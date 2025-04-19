"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dialogs: [],
      // 对话记录
      inputValue: "",
      // 输入框内容
      apiUrl: "http://localhost:11434",
      // Ollama 本地 API 地址
      scrollToBottomID: "dialog-bottom",
      // 滚动到底部的 ID
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
        url: `${this.apiUrl}/api/tags`,
        method: "GET",
        success: () => {
          this.socketOpen = true;
          common_vendor.index.__f__("log", "at pages/index/index.vue:63", "API连接正常");
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:66", "API连接失败:", err);
          this.socketOpen = false;
        }
      });
    },
    // 发送问题
    sendQuestion() {
      if (!this.inputValue.trim() || !this.socketOpen)
        return;
      this.dialogs.push({
        role: "user",
        content: this.inputValue
      });
      const question = this.inputValue;
      this.inputValue = "";
      this.scrollToBottom();
      const requestData = {
        model: "deepseek-r1:8b",
        prompt: question,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 1,
        stream: false
      };
      common_vendor.wx$1.request({
        url: `${this.apiUrl}/api/generate`,
        method: "POST",
        header: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify(requestData),
        success: (res) => {
          this.handleAPIResponse(res.data);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:107", "请求失败:", err);
          this.addToDialog("AI", "请求处理失败，请重试");
        }
      });
    },
    // 处理 API 响应
    handleAPIResponse(response) {
      try {
        let aiResponse = "";
        if (response == null ? void 0 : response.response) {
          aiResponse = response.response.trim();
        } else {
          aiResponse = "未能获取到有效回答";
        }
        this.dialogs.push({ role: "ai", content: aiResponse });
        this.scrollToBottom();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:127", "解析响应失败:", error);
        this.addToDialog("AI", "解析响应失败");
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
    this.checkAPIConnection();
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
