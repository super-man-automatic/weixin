// main.js
import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'

Vue.config.productionTip = false
App.mpType = 'app'

// 适配微信小程序登录
wx.loginPromise = () => new Promise((resolve, reject) => {
  wx.login({
    success: resolve,
    fail: reject
  })
})

wx.getUserInfoPromise = () => new Promise((resolve, reject) => {
  wx.getUserInfo({
    success: resolve,
    fail: reject
  })
})

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'

// Vue3适配说明：
// 1. 需要安装@dcloudio/uni-app-vue3插件
// 2. 使用createSSRApp创建应用实例
// 3. 适配微信小程序API为Promise形式

export function createApp() {
  const app = createSSRApp(App)
  
  // Vue3全局API适配
  app.config.globalProperties.$axios = App.$axios
  
  return {
    app
  }
}
// #endif