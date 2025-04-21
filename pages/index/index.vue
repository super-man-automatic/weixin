<!-- index.vue -->
<template>
  <view class="container">
    <!-- 对话显示区域 -->
    <scroll-view 
      class="dialog-area" 
      scroll-y 
      :scroll-into-view="scrollToBottomID"
      :scroll-with-animation="true"
    >
      <view 
        v-for="(dialog, index) in dialogs" 
        :key="index" 
        :id="'dialog-' + index"
        class="dialog-item"
        :class="dialog.role === 'user' ? 'user' : 'ai'"
      >
        <text class="dialog-text">{{ dialog.content }}</text>
      </view>
      <view :id="scrollToBottomID"></view>
    </scroll-view>

    <!-- 新增：预设问题按钮 -->
    <view v-if="showPresetButton" class="preset-question">
      <button 
        class="preset-button" 
        @tap="fillPresetQuestion"
      >
        你可以问我关于职场方面的问题，比如：在职场中如何与同事相处？
      </button>
    </view>

    <!-- 输入框和发送按钮 -->
    <view class="input-send-area">
      <input 
        class="input-box" 
        type="text" 
        placeholder="请输入您的问题"
        v-model="inputValue"
        :disabled="isSending"
        @confirm="sendQuestion"
      />
      <button 
        class="send-button" 
        :disabled="isSending" 
        @tap="sendQuestion"
      >
        {{ isSending ? '回答中...' : '发送' }}
      </button>
    </view>
  </view>
</template>

<script>
import CryptoJS from 'crypto-js';
import base64 from 'base-64';

export default {
  data() {
    return {
      dialogs: [],
      inputValue: '',
      showPresetButton: true, // 新增：控制预设问题按钮的显示
      aiWebSocketUrl: 'wss://spark-api.xf-yun.com/v4.0/chat',
      dbServerUrl: 'http://localhost:5000',
      scrollToBottomID: 'dialog-bottom',
      aiSocket: null,
      isSending: false,
      APPID: '5d460b66',
      APISecret: 'MTEwOTA3MmI2MThlZWM2YjFlMjYxMzM1',
      APIKey: '6f7d2da1a23bc29e761708ac7d53f022',
      currentAnswer: '',
      currentQuestion: '',
      reconnectTimer: null,
      responseComplete: false,
      modelDomain: '',
      openid: '', // 新增：存储用户的 openid
    };
  },
  methods: {
    async sendQuestion() {
      if (!this.inputValue.trim()) {
        this.showToast('请输入您的问题');
        return;
      }

      if (this.isSending) {
        this.showToast('正在处理上一个问题，请稍后');
        return;
      }

      this.isSending = true;
      this.currentQuestion = this.inputValue.trim();
      this.inputValue = '';
      this.currentAnswer = '';
      this.responseComplete = false;

      // 添加对话记录
      this.dialogs.push(
        { role: 'user', content: this.currentQuestion },
        { role: 'ai', content: '思考中...' }
      );
      this.scrollToBottom();

      try {
        if (!this.aiSocket || this.aiSocket.readyState !== 1) {
          await this.createConnection();
        }
        await this.sendToAI();
        this.startResponseTimer(); // 确保方法存在
      } catch (err) {
        console.error('发送失败:', err);
        this.handleSendError();
      }
    },

    async createConnection() {
      return new Promise((resolve, reject) => {
        if (this.aiSocket) {
          this.aiSocket.close({
            success: () => {
              console.log('WebSocket 已关闭，准备重新连接');
              this.initializeWebSocket(resolve, reject);
            },
            fail: (err) => {
              console.error('关闭 WebSocket 失败:', err);
              reject(err);
            }
          });
        } else {
          this.initializeWebSocket(resolve, reject);
        }
      });
    },

    initializeWebSocket(resolve, reject) {
      this.getWebSocketUrl()
        .then(authUrl => {
          console.log('尝试连接 WebSocket:', authUrl);

          this.aiSocket = wx.connectSocket({
            url: authUrl,
            success: () => {
              console.log('WebSocket 连接初始化成功');
            },
            fail: (err) => {
              console.error('WebSocket 初始化失败:', err);
              reject(err);
            }
          });

          this.aiSocket.onOpen(() => {
            console.log('WebSocket 连接成功');
            resolve();
          });

          this.aiSocket.onMessage(res => this.handleMessage(res));

          this.aiSocket.onError(err => {
            console.error('WebSocket 连接错误:', err);
            this.handleSendError();
            reject(err);
          });

          this.aiSocket.onClose(() => {
            console.log('WebSocket 已关闭');
            this.isSending = false;
          });
        })
        .catch(err => {
          console.error('获取 WebSocket URL 失败:', err);
          reject(err);
        });
    },

    handleMessage(res) {
      try {
        const obj = JSON.parse(res.data);
        console.log('结构化消息:', obj);

        if (obj.header?.code !== 0) {
          console.error('API 返回错误:', obj.header.message);
          this.showToast(`服务错误: ${obj.header.message}`);
          this.handleResponseError();
          return;
        }

        const content = obj.payload?.choices?.text?.[0]?.content || '';
        if (content) {
          this.currentAnswer += content;
          const lastDialog = this.dialogs[this.dialogs.length - 1];
          if (lastDialog?.role === 'ai') {
            lastDialog.content = this.currentAnswer.replace('思考中...', '');
            this.$forceUpdate();
            this.scrollToBottom();
          }
        }

        if (obj.header?.status === 2) {
          console.log('完整回答接收完成');
          this.responseComplete = true;
          this.handleResponseComplete();

          // 存储对话到数据库
          this.saveChatToDatabase(this.currentQuestion, this.currentAnswer);
        }
      } catch (e) {
        console.error('消息解析失败:', e);
        this.handleResponseError();
      }
    },

    async sendToAI() {
      const params = {
        header: {
          app_id: this.APPID,
         
        },
        parameter: {
          chat: {
            domain: '4.0Ultra',
            temperature: 0.5,
            max_tokens: 1024,
            chat_id: Date.now().toString()
          }
        },
        payload: {
          message: {
            text: [
              { role: 'user', content: this.currentQuestion }
            ]
          }
        }
      };

      console.log('发送参数:', JSON.stringify(params, null, 2));

      return new Promise((resolve, reject) => {
        this.aiSocket.send({
          data: JSON.stringify(params),
          success: resolve,
          fail: reject
        });
      });
    },

    getWebSocketUrl() {
      return new Promise((resolve, reject) => {
        try {
          const host = 'spark-api.xf-yun.com';
          const path = '/v4.0/chat';
          const date = new Date().toGMTString();
          const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
          const signature = CryptoJS.HmacSHA256(signatureOrigin, this.APISecret).toString(CryptoJS.enc.Base64);
          const authorization = base64.encode(
            `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
          );
          const url = `${this.aiWebSocketUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
          console.log('生成的 WebSocket URL:', url);
          resolve(url);
        } catch (err) {
          console.error('生成 WebSocket URL 失败:', err);
          reject(err);
        }
      });
    },

    showToast(msg) {
      wx.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      });
    },

    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollToBottomID = `dialog-${this.dialogs.length - 1}`;
      });
    },

    handleSendError() {
      this.isSending = false;
      this.dialogs.pop(); // 移除最后一条 "思考中..." 的对话
      this.$forceUpdate();
      if (this.aiSocket) {
        this.aiSocket.close();
        this.aiSocket = null;
      }
      this.showToast('发送失败，请检查网络或服务配置');
    },

    startResponseTimer() {
      // 设置超时时间为 60 秒
      this.reconnectTimer = setTimeout(() => {
        if (!this.responseComplete) {
          console.warn('响应超时');
          this.handleSendError();
        }
      }, 60000);
    },

    handleResponseComplete() {
      console.log('响应处理完成');
      this.isSending = false;

      // 如果需要关闭 WebSocket，可以在这里处理
      if (this.aiSocket) {
        this.aiSocket.close();
        this.aiSocket = null;
      }
    },

    handleResponseError() {
      console.error('处理响应时发生错误');
      this.isSending = false;

      const lastDialog = this.dialogs[this.dialogs.length - 1];
      if (lastDialog?.role === 'ai') {
        lastDialog.content = '抱歉，处理响应时出错，请稍后重试。';
        this.$forceUpdate();
        this.scrollToBottom();
      }

      // 针对鉴权错误的提示
      if (this.currentAnswer.includes('AppIdNoAuthError')) {
        this.showToast('鉴权失败，请检查 APPID 和密钥配置');
      }
    },

    async saveChatToDatabase(question, answer) {
      if (!this.openid) {
        console.error('未找到 openid，无法保存聊天记录');
        wx.showToast({
          title: '未登录，请先登录',
          icon: 'error',
        });
        return;
      }

      try {
        const timestamp = new Date().toISOString(); // 获取当前时间戳
        const requestData = {
          openid: this.openid,
          question: question,
          answer: answer,
          timestamp: timestamp,
        };

        console.log('准备发送到后端的请求数据:', requestData);

        // 使用 Promise 包装异步请求
        const response = await new Promise((resolve, reject) => {
          wx.request({
            url: `${this.dbServerUrl}/save_chat`, // 后端保存聊天记录的接口
            method: 'POST',
            header: {
              'Content-Type': 'application/json',
            },
            data: requestData,
            success: (res) => resolve(res),
            fail: (err) => reject(err),
          });
        });

        console.log('后端返回的响应:', response);

        if (response.statusCode === 200 && response.data.message === '聊天记录保存成功') {
          console.log('聊天记录保存成功:', response.data);
          wx.showToast({
            title: '聊天记录已保存',
            icon: 'success',
          });
        } else {
          console.error('聊天记录保存失败:', response.data);
          wx.showToast({
            title: '保存失败，请稍后重试',
            icon: 'error',
          });
        }
      } catch (err) {
        console.error('保存聊天记录时发生错误:', err);
        wx.showToast({
          title: '保存失败，请检查网络',
          icon: 'error',
        });
      }
    },

    // 新增：填充预设问题的方法
    fillPresetQuestion() {
      this.inputValue = "在职场中如何与同事相处？";
      this.showPresetButton = false; // 点击后隐藏按钮
    }
  },
  onLoad() {
    console.log('当前用户 APPID:', this.APPID);

    // 获取登录时存储的 openid
    const storedOpenid = wx.getStorageSync('openid');
    if (storedOpenid) {
      this.openid = storedOpenid;
      console.log('获取到的 openid:', this.openid);
    } else {
      console.error('未找到 openid，请先登录');
      wx.showToast({
        title: '请先登录',
        icon: 'error',
      });
    }
  },
  onUnload() {
    if (this.aiSocket) {
      this.aiSocket.close();
    }
    clearTimeout(this.reconnectTimer);
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dialog-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f5f5;
}

.dialog-item {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  max-width: 80%;
}

.dialog-item.user {
  background-color: #e0f7fa;
  align-self: flex-start;
}

.dialog-item.ai {
  background-color: #f1f8e9;
  align-self: flex-end;
}

.dialog-text {
  font-size: 16px;
  color: #333;
}

.input-send-area {
  display: flex;
  align-items: center;
  padding: 10px;
  border-top: 1px solid #ddd;
  background-color: #fff;
}

.input-box {
  flex: 1;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.send-button {
  margin-left: 10px;
  height: 40px;
  padding: 0 15px;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 4px;
}

.send-button[disabled] {
  opacity: 0.6;
}

/* 新增：预设问题按钮样式 */
.preset-question {
  padding: 10px;
  text-align: center;
  background-color: #f9f9f9;
  border-bottom: 1px solid #ddd;
}

.preset-button {
  padding: 10px 15px;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.preset-button:active {
  background-color: #005bb5;
}
</style>