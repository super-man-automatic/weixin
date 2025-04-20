# 这是一个职场助手项目。（非流式问答） <br />
&emsp; 本项目基于 Vue.js和UniApp实现界面的搭建,使用JavaScript建立执行逻辑，在前端使用微信小程序的WXML和WXSS完成样式设计，而在后端运用WebSocket和HTTP请求实现后端服务的交互，并通过Webpack打包工具搭建能够在小程序端运行的模块。根据Flask框架编写操作MySQL的API，调用wx.request函数,给职场中的用户提供一个智能问答平台。
## 1. 建立数据库
&emsp; 首先你需要安装一个mysql数据库，设置好你的用户以及密码。一般的端口号都是3306。
## 2. 下载ollama
&emsp; 下载ollama平台，这里我选择的大模型是deepseek-r1:8b，一般的接口是11434，这个可以为我们提供本地的大模型API接口。
## 3. 下载uni-app的IDE
&emsp; uni-app是一个使用 Vue.js 开发所有前端应用的框架，开发者编写一套代码，可发布到iOS、Android、Web（响应式）、以及各种小程序（微信/支付宝/百度/头条/飞书/QQ/快手/钉钉/淘宝）、快应用等多个平台。<br />
&emsp; uni-app使用的IDE是HBuilder X，可以支持跨平台的编译运行。此次借助它运行到微信小程序模拟器。
## 4. 微信小程序
&emsp; 这是一个小程序开发项目，而且uni-app的运行要直接依赖于该工具的手机模拟器，所以要先下载好微信小程序工具。<br />
&emsp; 不仅如此还要在微信的小程序平台上面注册小程序账号，补充好小程序的各项信息，注意要保存好APPID以及APPSECRET。 <br />
&emsp; 然后在小程序工具上登陆该账户，不然就是游客登录，应该会少权限。
## 5. 创建一个后端服务器server.py
&emsp; 使用了python脚本编写一个服务器。这里使用到的库有Flask，PyMySQL，Requests,Datetime等，需要先自行安装好，运行该文件即可创建一个本地的服务器。<br />
&emsp; 用户登陆小程序获取到 code 后，通过调用微信提供的接口 https://api.weixin.qq.com/sns/jscode2session，将 code 发送到微信服务器，根据你给的APPID和APPSECRET，是的，**你需要在代码里面补充你的APPID和APPSECRET**，微信服务器会返回用户的 openid 和 session_key，服务器获取其openid，用户得以登录。<br />
&emsp; 如果用户是初次登陆，后端服务器会将收取到的openid记录在数据库ai_chat的User表格里面，若不是初次登录，则不用进行登记。<br />
&emsp; 用户在index页面进行与AI的问答时，问题和答案、用户的openid以及提问的时间会通过后端服务器记录在数据库ai_chat的chat_history表格里面。<br />
&emsp; 用户在查看会话历史时，后端服务器负责从数据库的chat_history表格里面选取openid等于当前用户的openid的内容，在history里面进行展示。<br />
&emsp; 这里我的数据库运行端口是5000。
## 6. uni-app项目
&emsp; 这里我使用的是最基本的vue框架，然后进行各个文件的编写。page的login是起始页即登陆界面，用户登录后系统弹出问题，提问要不要进行职场的智能回答。<br />
&emsp; 若选择要，则跳转到index页面。这里可以与调用的本地大模型API进行对话。对话的内容会显示在输入框上方的的空白处。用户既可以直接在输入框里面输入问题并且发送，也可以直接点击示例问题进行提问。为了防止AI因为输出的内容过多而导致请求时间过长而请求失败，AI的输出信息采用非流式接收，然后它如果回答完毕则把回答打包送入数据库里。<br />
&emsp; 若选择不要，则跳转到history页面。这里按时间倒序显示当前用户与AI的所有对话。这是通过获取到的openid对数据库的chat_history表格进行检索获得的。<br />
&emsp; 在index和history页面的底部都有“智能问答”和“历史记录”按钮，可以直接跳转到这两个页面。<br />
## 7. 运行注意事项
&emsp;注意需要将server.py、ollama的大模型同时运行，保持数据库端口打开，此时项目运行是要连接两个后端服务器的。然后uni-app项目需要在HBuilder X平台上选择运行->运行到小程序模拟器->微信开发者工具。注意要保存好APPID以及APPSECRET，这是每个用户的独特访问标识。当然你也可以直接使用各个大模型平台的API调用。

