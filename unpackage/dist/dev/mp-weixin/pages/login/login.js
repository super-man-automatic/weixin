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
      userInfo: {},
      // 用户信息
      completeAnswer: "",
      // 完整回答内容
      dialogs: [],
      // 对话内容
      openid: "",
      // 用户 openid
      dbServerUrl: "http://localhost:5000",
      // 数据库服务器地址
      aiSocket: null
      // WebSocket 实例
    };
  },
  methods: {
    // 微信登录逻辑
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
                url: `${this.dbServerUrl}/login`,
                // 替换为你的后端地址
                method: "POST",
                data: {
                  code: res.code
                },
                success: (response) => {
                  common_vendor.index.__f__("log", "at pages/login/login.vue:66", "登录成功:", response.data);
                  if (response.data.openid) {
                    common_vendor.wx$1.setStorageSync("openid", response.data.openid);
                    this.openid = response.data.openid;
                    common_vendor.wx$1.showModal({
                      title: "登录成功",
                      content: `${userInfo.nickName}，请选择功能：`,
                      confirmText: "进入问答",
                      cancelText: "查看历史",
                      success: (res2) => {
                        if (res2.confirm) {
                          common_vendor.wx$1.switchTab({
                            url: "/pages/index/index",
                            // 替换为你的问答页面路径
                            fail: (err) => {
                              common_vendor.index.__f__("error", "at pages/login/login.vue:86", "跳转到问答页面失败:", err);
                              common_vendor.wx$1.showToast({
                                title: "跳转失败",
                                icon: "error"
                              });
                            }
                          });
                        } else if (res2.cancel) {
                          common_vendor.wx$1.switchTab({
                            url: "/pages/history/history",
                            // 替换为你的历史记录页面路径
                            fail: (err) => {
                              common_vendor.index.__f__("error", "at pages/login/login.vue:98", "跳转到历史记录页面失败:", err);
                              common_vendor.wx$1.showToast({
                                title: "跳转失败",
                                icon: "error"
                              });
                            }
                          });
                        }
                      },
                      fail: (err) => {
                        common_vendor.index.__f__("error", "at pages/login/login.vue:108", "显示功能选择对话框失败:", err);
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
                  common_vendor.index.__f__("error", "at pages/login/login.vue:119", "登录失败:", error);
                  common_vendor.wx$1.showToast({
                    title: "请求失败，请检查网络",
                    icon: "error"
                  });
                }
              });
            } else {
              common_vendor.index.__f__("error", "at pages/login/login.vue:127", "获取登录凭证失败:", res.errMsg);
              common_vendor.wx$1.showToast({
                title: "登录失败，请重试",
                icon: "error"
              });
            }
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/login/login.vue:135", "wx.login 调用失败:", err);
            common_vendor.wx$1.showToast({
              title: "登录失败，请重试",
              icon: "error"
            });
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:143", "登录失败:", error);
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
