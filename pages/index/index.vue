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
      apiUrl: 'http://localhost:11434', // Ollama 本地 API 地址
      scrollToBottomID: 'dialog-bottom', // 滚动到底部的 ID
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
        url: `${this.apiUrl}/api/tags`,
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
    sendQuestion() {
      if (!this.inputValue.trim() || !this.socketOpen) return;

      // 添加用户消息到对话记录
      this.dialogs.push({
        role: 'user',
        content: this.inputValue
      });

      const question = this.inputValue; // 保存用户输入
      this.inputValue = ''; // 清空输入框
      this.scrollToBottom(); // 滚动到底部

      const requestData = {
        model: 'deepseek-r1:8b',
        prompt: question,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 1.0,
        stream: false
      };

      // 调用 API
      wx.request({
        url: `${this.apiUrl}/api/generate`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(requestData),
        success: (res) => {
          this.handleAPIResponse(res.data);
        },
        fail: (err) => {
          console.error('请求失败:', err);
          this.addToDialog('AI', '请求处理失败，请重试');
        }
      });
    },

    // 处理 API 响应
    handleAPIResponse(response) {
      try {
        let aiResponse = '';

        if (response?.response) {
          aiResponse = response.response.trim();
        } else {
          aiResponse = '未能获取到有效回答';
        }

        this.dialogs.push({ role: 'ai', content: aiResponse });
        this.scrollToBottom(); // 滚动到底部
      } catch (error) {
        console.error('解析响应失败:', error);
        this.addToDialog('AI', '解析响应失败');
      }
    },

    // 添加对话记录
    addToDialog(role, content) {
      this.dialogs.push({ role, content });
      this.scrollToBottom();
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