"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      mockHistory: [
        {
          time: "2023-10-27 14:30",
          user: "用户：如何学习人工智能？",
          ai: "AI：可以从基础数学开始..."
        }
        // 更多模拟数据...
      ]
    };
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.mockHistory, (dialog, index, i0) => {
      return {
        a: common_vendor.t(dialog.time),
        b: common_vendor.t(dialog.user),
        c: common_vendor.t(dialog.ai),
        d: index
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-b2d018fa"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/history/history.js.map
