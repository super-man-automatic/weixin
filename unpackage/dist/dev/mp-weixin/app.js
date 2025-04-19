"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
if (!Math) {
  "./pages/login/login.js";
  "./pages/index/index.js";
  "./pages/history/history.js";
}
const _sfc_main = {
  onLaunch: function() {
    common_vendor.index.__f__("log", "at App.vue:5", "App Launch");
    this.globalData = {
      apiUrl: "https://172.26.98.86:5000",
      // 建议使用正式域名
      hasLogin: false
    };
    if (this.$axios) {
      this.$axios.defaults.baseURL = this.globalData.apiUrl;
      this.$axios.interceptors.request.use((config) => {
        common_vendor.wx$1.showNavigationBarLoading();
        return config;
      });
      this.$axios.interceptors.response.use((response) => {
        common_vendor.wx$1.hideNavigationBarLoading();
        return response;
      }, (error) => {
        common_vendor.wx$1.hideNavigationBarLoading();
        return Promise.reject(error);
      });
    } else {
      common_vendor.index.__f__("warn", "at App.vue:32", "axios未初始化，请检查main.js配置");
    }
  },
  onShow: function() {
    common_vendor.index.__f__("log", "at App.vue:36", "App Show");
    if (!this.globalData.hasLogin) {
      common_vendor.wx$1.reLaunch({ url: "/pages/login/login" });
    }
  },
  onHide: function() {
    common_vendor.index.__f__("log", "at App.vue:42", "App Hide");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.config.globalProperties.$axios = _sfc_main.$axios;
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
