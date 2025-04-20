# 这是一个职场助手。以下是操作方法。 <br />
本项目基于 Vue.js和UniApp实现界面的搭建,使用JavaScript建立执行逻辑，在前端使用微信小程序的WXML和WXSS完成样式设计，而在后端运用WebSocket和HTTP请求实现后端服务的交互，并通过Webpack打包工具搭建能够在小程序端运行的模块。根据Flask框架编写操作MySQL的API，调用wx.request函数,给职场中的用户提供一个智能问答平台。
## 1. 建立数据库
首先你需要安装一个mysql数据库，设置好你的用户以及密码。一般的端口号都是3306。
## 2. 下载ollama
下载ollama平台，这里我选择的大模型是deepseek-r1:8b，一般的接口是11434，这个可以为我们提供本地的大模型API接口。
## 3. 下载uni-app的IDE
uni-app是一个使用 Vue.js 开发所有前端应用的框架，开发者编写一套代码，可发布到iOS、Android、Web（响应式）、以及各种小程序（微信/支付宝/百度/头条/飞书/QQ/快手/钉钉/淘宝）、快应用等多个平台。<br />
uni-app使用的IDE是HBuilder X，可以支持跨平台的编译运行。此次借助它运行到微信小程序模拟器。
## 4. 下载微信小程序工具
这是一个小程序开发项目，而且uni-app的运行要直接依赖于该工具的手机模拟器。
## 5. 创建一个后台服务器
使用了python脚本编写一个服务器。这里使用到的库有Flask，PyMySQL，Requests,Datetime等，需要先自行安装好，运行该文件即可创建一个本地的服务器。<br />
用户登陆小程序获取到 code 后，通过调用微信提供的接口 https://api.weixin.qq.com/sns/jscode2session，将 code 发送到微信服务器，微信服务器会返回用户的 openid 和 session_key。<br />
如果用户是初次登陆，后台服务器会将收取到的openid记录在数据库ai_chat的User表格里面，若不是初次登录，则不用进行登记。<br />
用户在index页面进行与AI的问答时，问题和答案、用户的openid以及提问的时间会通过后台服务器记录在数据库ai_chat的chat_history表格里面。<br />
用户在查看会话历史时，后台服务器负责从数据库的chat_history表格里面选取openid等于当前用户的openid的内容，在history里面进行展示。
## 


