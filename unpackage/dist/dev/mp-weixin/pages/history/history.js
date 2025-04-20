"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      history: [],
      // 聊天记录
      page: 1,
      // 当前页码
      pageSize: 10,
      // 每页加载的记录数
      loading: false,
      // 是否正在加载
      noMoreData: false,
      // 是否没有更多数据
      openid: ""
      // 当前用户的 openid
    };
  },
  methods: {
    // 获取聊天记录
    async fetchHistory() {
      if (this.loading || this.noMoreData)
        return;
      this.loading = true;
      try {
        const res = await new Promise((resolve, reject) => {
          common_vendor.wx$1.request({
            url: `http://172.26.97.248:5000/get_chat_history`,
            // 后端接口地址
            method: "GET",
            data: {
              openid: this.openid,
              // 当前用户的 openid
              page: this.page,
              // 当前页码
              pageSize: this.pageSize
              // 每页记录数
            },
            success: resolve,
            fail: reject
          });
        });
        if (res.statusCode === 200 && res.data.chats) {
          const newHistory = res.data.chats;
          if (newHistory.length < this.pageSize) {
            this.noMoreData = true;
          }
          this.history = [...this.history, ...newHistory];
          this.page += 1;
        } else {
          common_vendor.index.__f__("error", "at pages/history/history.vue:76", "获取聊天记录失败:", res.data.error || "未知错误");
        }
      } catch (err) {
        common_vendor.index.__f__("error", "at pages/history/history.vue:79", "请求失败:", err);
      } finally {
        this.loading = false;
      }
    },
    // 滑到底部加载更多
    loadMoreHistory() {
      this.fetchHistory();
    }
  },
  onLoad() {
    const openid = common_vendor.wx$1.getStorageSync("openid");
    if (!openid) {
      common_vendor.index.__f__("error", "at pages/history/history.vue:94", "缺少 openid，请重新登录");
      common_vendor.wx$1.redirectTo({ url: "/pages/login/login" });
    } else {
      this.openid = openid;
      common_vendor.index.__f__("log", "at pages/history/history.vue:98", "当前用户 openid:", openid);
      this.fetchHistory();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.f($data.history, (dialog, index, i0) => {
      return {
        a: common_vendor.t(dialog.timestamp),
        b: common_vendor.t(dialog.question),
        c: common_vendor.t(dialog.answer),
        d: index
      };
    }),
    b: $data.loading
  }, $data.loading ? {} : {}, {
    c: $data.noMoreData
  }, $data.noMoreData ? {} : {}, {
    d: common_vendor.o((...args) => $options.loadMoreHistory && $options.loadMoreHistory(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b2d018fa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/history/history.js.map
