<!-- login.vue -->
<template>
  <view class="login-container">
    <!-- 登录页面内容 -->
    <view v-if="!showQuestion">
      <image class="logo" src="/static/logo.png"></image>
      <button 
        class="login-btn" 
        @click="handleWechatLogin"
        :disabled="isLogging"
        :class="{ 'logging': isLogging }"
      >
        {{ isLogging ? '登录中...' : '微信一键登录' }}
      </button>
    </view>

    <!-- 问题内容 -->
    <view v-else>
      <text class="question-title">欢迎，{{ userInfo.nickName }}！以下是您的问题：</text>
      <view class="question-content">
        <text>问题：{{ question }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLogging: false, // 是否正在登录
      showQuestion: false, // 是否显示问题内容
      question: "", // 问题内容
      userInfo: {} // 用户信息
    }
  },
  methods: {
    async handleWechatLogin() {
      try {
        // 获取用户信息（必须在用户点击时触发）
        const userInfoRes = await wx.getUserProfile({
          desc: '用于智能问答系统的个性化服务', // 明确用途说明
          timeout: 10000 // 设置超时时间
        });
        const userInfo = userInfoRes.userInfo;

        this.isLogging = true;

        // 调用 wx.login 获取临时登录凭证 code
        wx.login({
          success: (res) => {
            if (res.code) {
              wx.request({
                url: 'http://172.26.98.86:5000/login', // 替换为你的后端地址
                method: 'POST',
                data: {
                  code: res.code
                },
                success: (response) => {
                  console.log('登录成功:', response.data);

                  // 检查后端返回的数据
                  if (response.data.openid) {
                    console.log('准备弹出对话框');
                    // 显示功能选择对话框
                    wx.showModal({
                      title: 'Login Successful',
                      content: `${userInfo.nickName}, do you want to enter Q&A?`,
                      confirmText: 'Enter',
                      cancelText: 'History',
                      success: (res) => {
                        console.log('Modal result:', res); // 添加日志
                        if (res.confirm) {
                          console.log('User chose to enter Q&A');
                          // 使用 wx.switchTab 跳转到 TabBar 页面
                          wx.switchTab({
                            url: '/pages/index/index', // 替换为你的 TabBar 页面路径
                            fail: (err) => {
                              console.error('Failed to switch to index page:', err);
                              wx.showToast({
                                title: 'Failed to navigate',
                                icon: 'error'
                              });
                            }
                          });
                        } else if (res.cancel) {
                          console.log('User chose to view history');
                          // 使用 wx.switchTab 跳转到 TabBar 页面
                          wx.switchTab({
                            url: '/pages/history/history', // 替换为你的 TabBar 页面路径
                            fail: (err) => {
                              console.error('Failed to switch to history page:', err);
                              wx.showToast({
                                title: 'Failed to navigate',
                                icon: 'error'
                              });
                            }
                          });
                        }
                      },
                      fail: (err) => {
                        console.error('Failed to display modal:', err); // 添加日志
                      }
                    });
                  } else {
                    wx.showToast({
                      title: '登录失败，请重试',
                      icon: 'error'
                    });
                  }
                },
                fail: (error) => {
                  console.error('登录失败:', error);
                  wx.showToast({
                    title: '请求失败，请检查网络',
                    icon: 'error'
                  });
                }
              });
            } else {
              console.error('获取登录凭证失败:', res.errMsg);
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'error'
              });
            }
          }
        });
      } catch (error) {
        console.error('登录失败:', error);
        wx.showToast({
          title: error.errMsg || '登录失败',
          icon: 'error'
        });
      } finally {
        this.isLogging = false;
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* 垂直居中 */
  height: 100vh; /* 占满整个视口高度 */
  padding: 120rpx 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logo {
  width: 240rpx;
  height: 240rpx;
  margin: 0 auto 100rpx; /* 水平居中 */
  border-radius: 20rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  display: block; /* 确保 image 是块级元素 */
}

.login-btn {
  width: 600rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(45deg, #409eff, #337ecc);
  color: white;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 20rpx rgba(51, 126, 204, 0.4);
  transition: all 0.3s ease;
  transform: translateZ(0);
}

.login-btn:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.login-btn.logging {
  opacity: 0.7;
  cursor: not-allowed;
}

.question-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #333;
}

.question-content {
  font-size: 20px;
  color: #666;
}
</style>