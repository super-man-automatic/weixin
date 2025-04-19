"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  data() {
    return {
      isLogging: false,
      // 是否正在登录
      showQuestion: false,
      // 是否显示问题内容
      question: "",
      // 问题内容
      userInfo: {}
      // 用户信息
    };
  },
  methods: {
    async handleWechatLogin() {
      try {
        const userInfoRes = await common_vendor.wx$1.getUserProfile({
          desc: "用于智能问答系统的个性化服务",
          // 明确用途说明
          timeout: 1e4
          // 设置超时时间
        });
        const userInfo = userInfoRes.userInfo;
        this.isLogging = true;
        common_vendor.wx$1.login({
          success: (res) => {
            if (res.code) {
              common_vendor.wx$1.request({
                url: "http://172.26.98.86:5000/login",
                // 替换为你的后端地址
                method: "POST",
                data: {
                  code: res.code
                },
                success: (response) => {
                  common_vendor.index.__f__("log", "at pages/login/login.vue:60", "登录成功:", response.data);
                  if (response.data.openid) {
                    common_vendor.index.__f__("log", "at pages/login/login.vue:64", "准备弹出对话框");
                    common_vendor.wx$1.showModal({
                      title: "Login Successful",
                      content: `${userInfo.nickName}, do you want to enter Q&A?`,
                      confirmText: "Enter",
                      cancelText: "History",
                      success: (res2) => {
                        common_vendor.index.__f__("log", "at pages/login/login.vue:72", "Modal result:", res2);
                        if (res2.confirm) {
                          common_vendor.index.__f__("log", "at pages/login/login.vue:74", "User chose to enter Q&A");
                          common_vendor.wx$1.switchTab({
                            url: "/pages/index/index",
                            // 替换为你的 TabBar 页面路径
                            fail: (err) => {
                              common_vendor.index.__f__("error", "at pages/login/login.vue:79", "Failed to switch to index page:", err);
                              common_vendor.wx$1.showToast({
                                title: "Failed to navigate",
                                icon: "error"
                              });
                            }
                          });
                        } else if (res2.cancel) {
                          common_vendor.index.__f__("log", "at pages/login/login.vue:87", "User chose to view history");
                          common_vendor.wx$1.switchTab({
                            url: "/pages/history/history",
                            // 替换为你的 TabBar 页面路径
                            fail: (err) => {
                              common_vendor.index.__f__("error", "at pages/login/login.vue:92", "Failed to switch to history page:", err);
                              common_vendor.wx$1.showToast({
                                title: "Failed to navigate",
                                icon: "error"
                              });
                            }
                          });
                        }
                      },
                      fail: (err) => {
                        common_vendor.index.__f__("error", "at pages/login/login.vue:102", "Failed to display modal:", err);
                      }
                    });
                  } else {
                    common_vendor.wx$1.showToast({
                      title: "登录失败，请重试",
                      icon: "error"
                    });
                  }
                },
                fail: (error) => {
                  common_vendor.index.__f__("error", "at pages/login/login.vue:113", "登录失败:", error);
                  common_vendor.wx$1.showToast({
                    title: "请求失败，请检查网络",
                    icon: "error"
                  });
                }
              });
            } else {
              common_vendor.index.__f__("error", "at pages/login/login.vue:121", "获取登录凭证失败:", res.errMsg);
              common_vendor.wx$1.showToast({
                title: "登录失败，请重试",
                icon: "error"
              });
            }
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:130", "登录失败:", error);
        common_vendor.wx$1.showToast({
          title: error.errMsg || "登录失败",
          icon: "error"
        });
      } finally {
        this.isLogging = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.showQuestion
  }, !$data.showQuestion ? {
    b: common_assets._imports_0,
    c: common_vendor.t($data.isLogging ? "登录中..." : "微信一键登录"),
    d: common_vendor.o((...args) => $options.handleWechatLogin && $options.handleWechatLogin(...args)),
    e: $data.isLogging,
    f: $data.isLogging ? 1 : ""
  } : {
    g: common_vendor.t($data.userInfo.nickName),
    h: common_vendor.t($data.question)
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
