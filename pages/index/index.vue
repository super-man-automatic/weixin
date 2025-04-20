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

    <!-- 输入框和发送按钮 -->
    <view class="input-send-area">
      <input 
        class="input-box" 
        type="text" 
        placeholder="请输入您的问题"
        v-model="inputValue"
        @input="onInputChange"
      />
      <button class="send-button" @tap="sendQuestion">
        发送
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      dialogs: [], // 对话记录
      inputValue: '', // 输入框内容
      apiServerUrl: 'http://localhost:11434', // API 调用服务器地址
      dbServerUrl: 'http://172.26.97.248:5000', // 数据库写入服务器地址
      scrollToBottomID: 'dialog-bottom', // 滚动到底部的 ID
      openid: '', // 当前用户的 openid
      socketOpen: false // API 连接状态
    };
  },
  methods: {
    // 输入框内容变化
    onInputChange(e) {
      this.inputValue = e.detail.value;
    },

    // 检查 API 连接状态
    checkAPIConnection() {
      wx.request({
        url: `${this.apiServerUrl}/api/tags`, // 使用 API 调用服务器
        method: 'GET',
        success: () => {
          this.socketOpen = true;
          console.log('API连接正常');
        },
        fail: (err) => {
          console.error('API连接失败:', err);
          this.socketOpen = false;
        }
      });
    },

    // 发送问题
    async sendQuestion() {
      if (!this.inputValue.trim() || !this.socketOpen) return;

      // 检查 openid 是否存在
      if (!this.openid) {
        console.error('缺少 openid，请重新登录');
        wx.redirectTo({ url: '/pages/login/login' }); // 如果没有 openid，跳转到登录页面
        return;
      }

      // 添加用户消息到对话记录
      this.dialogs.push({
        role: 'user',
        content: this.inputValue
      });

      const question = this.inputValue; // 保存用户输入
      this.inputValue = ''; // 清空输入框
      this.scrollToBottom(); // 滚动到底部

      try {
        wx.request({
          url: `${this.apiServerUrl}/api/generate`, // 使用 API 调用服务器
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            prompt: question,
            model: 'deepseek-r1:8b',
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 1.0,
            stream: false
          },
          success: (res) => {
            if (res.statusCode === 200 && res.data.response) {
              // 去掉 <think></think> 字符
              const aiResponse = res.data.response.replace(/<think>.*?<\/think>/g, '').trim();
              this.dialogs.push({ role: 'ai', content: aiResponse });
              this.scrollToBottom(); // 滚动到底部
              this.saveChatHistory(question, aiResponse); // 保存聊天记录
            } else {
              console.error('请求失败:', res.data);
              this.dialogs.push({ role: 'ai', content: '请求处理失败，请重试' });
              this.scrollToBottom();
            }
          },
          fail: (err) => {
            console.error('请求失败:', err);
            this.dialogs.push({ role: 'ai', content: '请求处理失败，请重试' });
            this.scrollToBottom();
          }
        });
      } catch (err) {
        console.error('请求失败:', err);
        this.dialogs.push({ role: 'ai', content: '请求处理失败，请重试' });
        this.scrollToBottom();
      }
    },

    // 保存聊天记录
    async saveChatHistory(question, answer) {
      try {
        if (!this.openid) {
          console.error('缺少 openid，请重新登录');
          wx.redirectTo({ url: '/pages/login/login' }); // 如果没有 openid，跳转到登录页面
          return;
        }

        // 去掉 <think></think> 字符
        const sanitizedQuestion = question.replace(/<think>.*?<\/think>/g, '').trim();
        const sanitizedAnswer = answer.replace(/<think>.*?<\/think>/g, '').trim();

        wx.request({
          url: `${this.dbServerUrl}/save_chat`, // 使用数据库写入服务器
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          data: {
            openid: this.openid, // 使用当前用户的 openid
            question: sanitizedQuestion,
            answer: sanitizedAnswer
          },
          success: (res) => {
            console.log('聊天记录保存成功:', res.data);
          },
          fail: (err) => {
            console.error('保存聊天记录失败:', err);
          }
        });
      } catch (err) {
        console.error('保存聊天记录时发生错误:', err);
      }
    },

    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollToBottomID = `dialog-${this.dialogs.length - 1}`;
      });
    }
  },
  onLoad() {
    this.checkAPIConnection(); // 检查 API 连接状态

    // 从本地存储中获取 openid
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      console.error('缺少 openid，请重新登录');
      wx.redirectTo({ url: '/pages/login/login' }); // 如果没有 openid，跳转到登录页面
    } else {
      this.openid = openid; // 保存 openid 到组件数据中
      console.log('当前用户 openid:', openid);
    }
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
</style>