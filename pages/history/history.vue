<!-- history.vue -->
<template>
  <view class="history-container">
    <view class="history-header">
      <text class="title">对话历史</text>
    </view>
    
    <scroll-view 
      class="history-list" 
      scroll-y
    >
      <view 
        v-for="(dialog, index) in mockHistory" 
        :key="index"
        class="history-item"
      >
        <view class="timestamp">{{ dialog.time }}</view>
        <view class="dialog-content">
          <text class="user">{{ dialog.user }}</text>
          <text class="ai">{{ dialog.ai }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      mockHistory: [
        {
          time: '2023-10-27 14:30',
          user: '用户：如何学习人工智能？',
          ai: 'AI：可以从基础数学开始...'
        },
        // 更多模拟数据...
      ]
    };
  }
}
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
</style>