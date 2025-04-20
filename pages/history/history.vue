<!-- history.vue -->
<template>
  <view class="history-container">
    <view class="history-header">
      <text class="title">对话历史</text>
    </view>
    
    <scroll-view 
      class="history-list" 
      scroll-y
      @scrolltolower="loadMoreHistory"
    >
      <!-- 滑到底部时触发加载更多 -->
      <view 
        v-for="(dialog, index) in history" 
        :key="index"
        class="history-item"
      >
        <view class="timestamp">{{ dialog.timestamp }}</view>
        <view class="dialog-content">
          <text class="user">{{ dialog.question }}</text>
          <text class="ai">{{ dialog.answer }}</text>
        </view>
      </view>
      <view v-if="loading" class="loading">加载中...</view>
      <view v-if="noMoreData" class="no-more">没有更多数据了</view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      history: [], // 聊天记录
      page: 1, // 当前页码
      pageSize: 10, // 每页加载的记录数
      loading: false, // 是否正在加载
      noMoreData: false, // 是否没有更多数据
      openid: '' // 当前用户的 openid
    };
  },
  methods: {
    // 获取聊天记录
    async fetchHistory() {
      if (this.loading || this.noMoreData) return; // 防止重复加载
      this.loading = true;

      try {
        const res = await new Promise((resolve, reject) => {
          wx.request({
            url: `http://172.26.97.248:5000/get_chat_history`, // 后端接口地址
            method: 'GET',
            data: {
              openid: this.openid, // 当前用户的 openid
              page: this.page, // 当前页码
              pageSize: this.pageSize // 每页记录数
            },
            success: resolve,
            fail: reject
          });
        });

        if (res.statusCode === 200 && res.data.chats) {
          const newHistory = res.data.chats;

          // 如果返回的数据少于 pageSize，说明没有更多数据了
          if (newHistory.length < this.pageSize) {
            this.noMoreData = true;
          }

          // 将新数据追加到历史记录中
          this.history = [...this.history, ...newHistory];
          this.page += 1; // 页码加 1
        } else {
          console.error('获取聊天记录失败:', res.data.error || '未知错误');
        }
      } catch (err) {
        console.error('请求失败:', err);
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
    // 从本地存储中获取 openid
    const openid = wx.getStorageSync('openid');
    if (!openid) {
      console.error('缺少 openid，请重新登录');
      wx.redirectTo({ url: '/pages/login/login' }); // 如果没有 openid，跳转到登录页面
    } else {
      this.openid = openid; // 保存 openid 到组件数据中
      console.log('当前用户 openid:', openid);
      this.fetchHistory(); // 加载第一页数据
    }
  }
};
</script>

<style scoped>
.history-container {
  height: 100vh;
  background: #f8f9fa;
}

.history-header {
  padding: 40rpx;
  background: white;
  border-bottom: 1rpx solid #eee;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2d3436;
}

.history-list {
  height: calc(100vh - 120rpx);
  padding: 20rpx;
}

.history-item {
  margin-bottom: 40rpx;
  padding: 30rpx;
  background: white;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.timestamp {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.dialog-content {
  display: flex;
  flex-direction: column;
}

.user {
  font-size: 28rpx;
  color: #2d3436;
  margin-bottom: 10rpx;
}

.ai {
  font-size: 26rpx;
  color: #666;
  padding-left: 40rpx;
  border-left: 4rpx solid #007aff;
}

.loading {
  text-align: center;
  font-size: 24rpx;
  color: #666;
  padding: 20rpx 0;
}

.no-more {
  text-align: center;
  font-size: 24rpx;
  color: #aaa;
  padding: 20rpx 0;
}
</style>