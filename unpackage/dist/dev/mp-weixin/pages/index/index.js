"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dialogs: [],
      // 对话记录
      inputValue: "",
      // 输入框内容
      apiServerUrl: "http://localhost:11434",
      // API 调用服务器地址
      dbServerUrl: "http://172.26.97.248:5000",
      // 数据库写入服务器地址
      scrollToBottomID: "dialog-bottom",
      // 滚动到底部的 ID
      openid: "",
      // 当前用户的 openid
      socketOpen: false
      // API 连接状态
    };
  },
  methods: {
    // 输入框内容变化
    onInputChange(e) {
      this.inputValue = e.detail.value;
    },
    // 检查 API 连接状态
    checkAPIConnection() {
      common_vendor.wx$1.request({
        url: `${this.apiServerUrl}/api/tags`,
        // 使用 API 调用服务器
        method: "GET",
        success: () => {
          this.socketOpen = true;
          common_vendor.index.__f__("log", "at pages/index/index.vue:65", "API连接正常");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:68", "API连接失败:", err);
          this.socketOpen = false;
        }
      });
    },
    // 发送问题
    async sendQuestion() {
      if (!this.inputValue.trim() || !this.socketOpen)
        return;
      if (!this.openid) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:80", "缺少 openid，请重新登录");
        common_vendor.wx$1.redirectTo({ url: "/pages/login/login" });
        return;
      }
      this.dialogs.push({
        role: "user",
        content: this.inputValue
      });
      const question = this.inputValue;
      this.inputValue = "";
      this.scrollToBottom();
      try {
        common_vendor.wx$1.request({
          url: `${this.apiServerUrl}/api/generate`,
          // 使用 API 调用服务器
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            prompt: question,
            model: "deepseek-r1:8b",
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 1,
            stream: false
          },
          success: (res) => {
            if (res.statusCode === 200 && res.data.response) {
              const aiResponse = res.data.response.replace(/<think>.*?<\/think>/g, "").trim();
              this.dialogs.push({ role: "ai", content: aiResponse });
              this.scrollToBottom();
              this.saveChatHistory(question, aiResponse);
            } else {
              common_vendor.index.__f__("error", "at pages/index/index.vue:118", "请求失败:", res.data);
              this.dialogs.push({ role: "ai", content: "请求处理失败，请重试" });
              this.scrollToBottom();
            }
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:124", "请求失败:", err);
            this.dialogs.push({ role: "ai", content: "请求处理失败，请重试" });
            this.scrollToBottom();
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:130", "请求失败:", err);
        this.dialogs.push({ role: "ai", content: "请求处理失败，请重试" });
        this.scrollToBottom();
      }
    },
    // 保存聊天记录
    async saveChatHistory(question, answer) {
      try {
        if (!this.openid) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:140", "缺少 openid，请重新登录");
          common_vendor.wx$1.redirectTo({ url: "/pages/login/login" });
          return;
        }
        const sanitizedQuestion = question.replace(/<think>.*?<\/think>/g, "").trim();
        const sanitizedAnswer = answer.replace(/<think>.*?<\/think>/g, "").trim();
        common_vendor.wx$1.request({
          url: `${this.dbServerUrl}/save_chat`,
          // 使用数据库写入服务器
          method: "POST",
          header: {
            "Content-Type": "application/json"
          },
          data: {
            openid: this.openid,
            // 使用当前用户的 openid
            question: sanitizedQuestion,
            answer: sanitizedAnswer
          },
          success: (res) => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:161", "聊天记录保存成功:", res.data);
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:164", "保存聊天记录失败:", err);
          }
        });
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:168", "保存聊天记录时发生错误:", err);
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
    this.checkAPIConnection();
    const openid = common_vendor.wx$1.getStorageSync("openid");
    if (!openid) {
      common_vendor.index.__f__("error", "at pages/index/index.vue:185", "缺少 openid，请重新登录");
      common_vendor.wx$1.redirectTo({ url: "/pages/login/login" });
    } else {
      this.openid = openid;
      common_vendor.index.__f__("log", "at pages/index/index.vue:189", "当前用户 openid:", openid);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.dialogs, (dialog, index, i0) => {
      return {
        a: common_vendor.t(dialog.content),
        b: index,
        c: "dialog-" + index,
        d: common_vendor.n(dialog.role === "user" ? "user" : "ai")
      };
    }),
    b: $data.scrollToBottomID,
    c: $data.scrollToBottomID,
    d: common_vendor.o([($event) => $data.inputValue = $event.detail.value, (...args) => $options.onInputChange && $options.onInputChange(...args)]),
    e: $data.inputValue,
    f: common_vendor.o((...args) => $options.sendQuestion && $options.sendQuestion(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
