这是一个职场助手。以下是操作方法。 <br />
#建立数据库#
首先你需要安装一个mysql数据库，设置好你的用户以及密码。一般的端口号都是3306。
#下载ollama
下载ollama平台，这里我选择的大模型是deepseek-r1:8b，一般的接口是11434，这个可以为我们提供本地的大模型API接口。
#创建一个后台服务器
使用了python脚本编写一个服务器。这里使用到的库有Flask，PyMySQL，Requests,Datetime等，需要先自行安装好，运行该文件即可创建一个本地的服务器。
用户获取到 code 后，通过调用微信提供的接口 https://api.weixin.qq.com/sns/jscode2session，将 code 发送到微信服务器，微信服务器会返回用户的 openid 和 session_key。

