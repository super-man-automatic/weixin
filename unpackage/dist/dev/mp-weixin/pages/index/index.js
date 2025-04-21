"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      dialogs: [],
      inputValue: "",
      showPresetButton: true,
      // 新增：控制预设问题按钮的显示
      aiWebSocketUrl: "wss://spark-api.xf-yun.com/v4.0/chat",
      dbServerUrl: "http://localhost:5000",
      scrollToBottomID: "dialog-bottom",
      aiSocket: null,
      isSending: false,
      APPID: "5d460b66",
      APISecret: "MTEwOTA3MmI2MThlZWM2YjFlMjYxMzM1",
      APIKey: "6f7d2da1a23bc29e761708ac7d53f022",
      currentAnswer: "",
      currentQuestion: "",
      reconnectTimer: null,
      responseComplete: false,
      modelDomain: "",
      openid: ""
      // 新增：存储用户的 openid
    };
  },
  methods: {
    async sendQuestion() {
      if (!this.inputValue.trim()) {
        this.showToast("请输入您的问题");
        return;
      }
      if (this.isSending) {
        this.showToast("正在处理上一个问题，请稍后");
        return;
      }
      this.isSending = true;
      this.currentQuestion = this.inputValue.trim();
      this.inputValue = "";
      this.currentAnswer = "";
      this.responseComplete = false;
      this.dialogs.push(
        { role: "user", content: this.currentQuestion },
        { role: "ai", content: "思考中..." }
      );
      this.scrollToBottom();
      try {
        if (!this.aiSocket || this.aiSocket.readyState !== 1) {
          await this.createConnection();
        }
        await this.sendToAI();
        this.startResponseTimer();
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:112", "发送失败:", err);
        this.handleSendError();
      }
    },
    async createConnection() {
      return new Promise((resolve, reject) => {
        if (this.aiSocket) {
          this.aiSocket.close({
            success: () => {
              common_vendor.index.__f__("log", "at pages/index/index.vue:122", "WebSocket 已关闭，准备重新连接");
              this.initializeWebSocket(resolve, reject);
            },
            fail: (err) => {
              common_vendor.index.__f__("error", "at pages/index/index.vue:126", "关闭 WebSocket 失败:", err);
              reject(err);
            }
          });
        } else {
          this.initializeWebSocket(resolve, reject);
        }
      });
    },
    initializeWebSocket(resolve, reject) {
      this.getWebSocketUrl().then((authUrl) => {
        common_vendor.index.__f__("log", "at pages/index/index.vue:139", "尝试连接 WebSocket:", authUrl);
        this.aiSocket = common_vendor.wx$1.connectSocket({
          url: authUrl,
          success: () => {
            common_vendor.index.__f__("log", "at pages/index/index.vue:144", "WebSocket 连接初始化成功");
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/index/index.vue:147", "WebSocket 初始化失败:", err);
            reject(err);
          }
        });
        this.aiSocket.onOpen(() => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:153", "WebSocket 连接成功");
          resolve();
        });
        this.aiSocket.onMessage((res) => this.handleMessage(res));
        this.aiSocket.onError((err) => {
          common_vendor.index.__f__("error", "at pages/index/index.vue:160", "WebSocket 连接错误:", err);
          this.handleSendError();
          reject(err);
        });
        this.aiSocket.onClose(() => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:166", "WebSocket 已关闭");
          this.isSending = false;
        });
      }).catch((err) => {
        common_vendor.index.__f__("error", "at pages/index/index.vue:171", "获取 WebSocket URL 失败:", err);
        reject(err);
      });
    },
    handleMessage(res) {
      var _a, _b, _c, _d, _e, _f;
      try {
        const obj = JSON.parse(res.data);
        common_vendor.index.__f__("log", "at pages/index/index.vue:179", "结构化消息:", obj);
        if (((_a = obj.header) == null ? void 0 : _a.code) !== 0) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:182", "API 返回错误:", obj.header.message);
          this.showToast(`服务错误: ${obj.header.message}`);
          this.handleResponseError();
          return;
        }
        const content = ((_e = (_d = (_c = (_b = obj.payload) == null ? void 0 : _b.choices) == null ? void 0 : _c.text) == null ? void 0 : _d[0]) == null ? void 0 : _e.content) || "";
        if (content) {
          this.currentAnswer += content;
          const lastDialog = this.dialogs[this.dialogs.length - 1];
          if ((lastDialog == null ? void 0 : lastDialog.role) === "ai") {
            lastDialog.content = this.currentAnswer.replace("思考中...", "");
            this.$forceUpdate();
            this.scrollToBottom();
          }
        }
        if (((_f = obj.header) == null ? void 0 : _f.status) === 2) {
          common_vendor.index.__f__("log", "at pages/index/index.vue:200", "完整回答接收完成");
          this.responseComplete = true;
          this.handleResponseComplete();
          this.saveChatToDatabase(this.currentQuestion, this.currentAnswer);
        }
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:208", "消息解析失败:", e);
        this.handleResponseError();
      }
    },
    async sendToAI() {
      const params = {
        header: {
          app_id: this.APPID
        },
        parameter: {
          chat: {
            domain: "4.0Ultra",
            temperature: 0.5,
            max_tokens: 1024,
            chat_id: Date.now().toString()
          }
        },
        payload: {
          message: {
            text: [
              { role: "user", content: this.currentQuestion }
            ]
          }
        }
      };
      common_vendor.index.__f__("log", "at pages/index/index.vue:236", "发送参数:", JSON.stringify(params, null, 2));
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
          const host = "spark-api.xf-yun.com";
          const path = "/v4.0/chat";
          const date = (/* @__PURE__ */ new Date()).toGMTString();
          const signatureOrigin = `host: ${host}
date: ${date}
GET ${path} HTTP/1.1`;
          const signature = common_vendor.CryptoJS.HmacSHA256(signatureOrigin, this.APISecret).toString(common_vendor.CryptoJS.enc.Base64);
          const authorization = common_vendor.base64.encode(
            `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
          );
          const url = `${this.aiWebSocketUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
          common_vendor.index.__f__("log", "at pages/index/index.vue:259", "生成的 WebSocket URL:", url);
          resolve(url);
        } catch (err) {
          common_vendor.index.__f__("error", "at pages/index/index.vue:262", "生成 WebSocket URL 失败:", err);
          reject(err);
        }
      });
    },
    showToast(msg) {
      common_vendor.wx$1.showToast({
        title: msg,
        icon: "none",
        duration: 2e3
      });
    },
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollToBottomID = `dialog-${this.dialogs.length - 1}`;
      });
    },
    handleSendError() {
      this.isSending = false;
      this.dialogs.pop();
      this.$forceUpdate();
      if (this.aiSocket) {
        this.aiSocket.close();
        this.aiSocket = null;
      }
      this.showToast("发送失败，请检查网络或服务配置");
    },
    startResponseTimer() {
      this.reconnectTimer = setTimeout(() => {
        if (!this.responseComplete) {
          common_vendor.index.__f__("warn", "at pages/index/index.vue:297", "响应超时");
          this.handleSendError();
        }
      }, 6e4);
    },
    handleResponseComplete() {
      common_vendor.index.__f__("log", "at pages/index/index.vue:304", "响应处理完成");
      this.isSending = false;
      if (this.aiSocket) {
        this.aiSocket.close();
        this.aiSocket = null;
      }
    },
    handleResponseError() {
      common_vendor.index.__f__("error", "at pages/index/index.vue:315", "处理响应时发生错误");
      this.isSending = false;
      const lastDialog = this.dialogs[this.dialogs.length - 1];
      if ((lastDialog == null ? void 0 : lastDialog.role) === "ai") {
        lastDialog.content = "抱歉，处理响应时出错，请稍后重试。";
        this.$forceUpdate();
        this.scrollToBottom();
      }
      if (this.currentAnswer.includes("AppIdNoAuthError")) {
        this.showToast("鉴权失败，请检查 APPID 和密钥配置");
      }
    },
    async saveChatToDatabase(question, answer) {
      if (!this.openid) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:333", "未找到 openid，无法保存聊天记录");
        common_vendor.wx$1.showToast({
          title: "未登录，请先登录",
          icon: "error"
        });
        return;
      }
      try {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const requestData = {
          openid: this.openid,
          question,
          answer,
          timestamp
        };
        common_vendor.index.__f__("log", "at pages/index/index.vue:350", "准备发送到后端的请求数据:", requestData);
        const response = await new Promise((resolve, reject) => {
          common_vendor.wx$1.request({
            url: `${this.dbServerUrl}/save_chat`,
            // 后端保存聊天记录的接口
            method: "POST",
            header: {
              "Content-Type": "application/json"
            },
            data: requestData,
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          });
        });
        common_vendor.index.__f__("log", "at pages/index/index.vue:366", "后端返回的响应:", response);
        if (response.statusCode === 200 && response.data.message === "聊天记录保存成功") {
          common_vendor.index.__f__("log", "at pages/index/index.vue:369", "聊天记录保存成功:", response.data);
          common_vendor.wx$1.showToast({
            title: "聊天记录已保存",
            icon: "success"
          });
        } else {
          common_vendor.index.__f__("error", "at pages/index/index.vue:375", "聊天记录保存失败:", response.data);
          common_vendor.wx$1.showToast({
            title: "保存失败，请稍后重试",
            icon: "error"
          });
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/index/index.vue:382", "保存聊天记录时发生错误:", err);
        common_vendor.wx$1.showToast({
          title: "保存失败，请检查网络",
          icon: "error"
        });
      }
    },
    // 新增：填充预设问题的方法
    fillPresetQuestion() {
      this.inputValue = "在职场中如何与同事相处？";
      this.showPresetButton = false;
    }
  },
  onLoad() {
    common_vendor.index.__f__("log", "at pages/index/index.vue:397", "当前用户 APPID:", this.APPID);
    const storedOpenid = common_vendor.wx$1.getStorageSync("openid");
    if (storedOpenid) {
      this.openid = storedOpenid;
      common_vendor.index.__f__("log", "at pages/index/index.vue:403", "获取到的 openid:", this.openid);
    } else {
      common_vendor.index.__f__("error", "at pages/index/index.vue:405", "未找到 openid，请先登录");
      common_vendor.wx$1.showToast({
        title: "请先登录",
        icon: "error"
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
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
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
    d: $data.showPresetButton
  }, $data.showPresetButton ? {
    e: common_vendor.o((...args) => $options.fillPresetQuestion && $options.fillPresetQuestion(...args))
  } : {}, {
    f: $data.isSending,
    g: common_vendor.o((...args) => $options.sendQuestion && $options.sendQuestion(...args)),
    h: $data.inputValue,
    i: common_vendor.o(($event) => $data.inputValue = $event.detail.value),
    j: common_vendor.t($data.isSending ? "回答中..." : "发送"),
    k: $data.isSending,
    l: common_vendor.o((...args) => $options.sendQuestion && $options.sendQuestion(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
