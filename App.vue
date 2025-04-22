<!-- app.vue -->
<script>
export default {
  onLaunch: function() {
    console.log('App Launch');
    
    // 初始化全局变量
    this.globalData = {
      apiUrl: 'https://localhost:5000', // 建议使用正式域名
      hasLogin: false
    };

    // 确保axios已初始化（需要在main.js中配置）
    if (this.$axios) {
      this.$axios.defaults.baseURL = this.globalData.apiUrl;
      
      // 添加请求拦截器
      this.$axios.interceptors.request.use(config => {
        wx.showNavigationBarLoading();
        return config;
      });

      // 添加响应拦截器
      this.$axios.interceptors.response.use(response => {
        wx.hideNavigationBarLoading();
        return response;
      }, error => {
        wx.hideNavigationBarLoading();
        return Promise.reject(error);
      });
    } else {
      console.warn('axios未初始化，请检查main.js配置');
    }
  },
  onShow: function() {
    console.log('App Show');
    if (!this.globalData.hasLogin) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
  onHide: function() {
    console.log('App Hide');
  }
}
</script>

<style>
/* 全局公共样式应放在独立css文件中 */
/* 此处保留必要的页面框架样式 */
page {
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>