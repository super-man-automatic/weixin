from flask import Flask, request, jsonify
import requests
import logging
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)

# 替换为你的小程序的 AppID 和 AppSecret
APP_ID = "wx39a70f358eabe973"
APP_SECRET = "a7630e787cab06723812fba0b11fe7d2"

@app.route('/login', methods=['POST'])
def login():
    try:
        # 从请求中获取 code
        data = request.json
        code = data.get('code')
        logging.info(f"Received code: {code}")

        if not code:
            return jsonify({"error": "缺少登录凭证 code"}), 400

        # 调用微信接口获取 openid 和 session_key
        url = "https://api.weixin.qq.com/sns/jscode2session"
        params = {
            "appid": APP_ID,
            "secret": APP_SECRET,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        response = requests.get(url, params=params, timeout=10)
        wx_data = response.json()
        logging.info(f"WeChat API response: {wx_data}")

        if "errcode" in wx_data:
            return jsonify({
                "error": wx_data.get("errmsg", "微信接口调用失败"),
                "errcode": wx_data.get("errcode")
            }), 400

        # 返回 openid 和 session_key
        return jsonify({
            "openid": wx_data.get("openid"),
            "session_key": wx_data.get("session_key")
        })

    except requests.exceptions.RequestException as e:
        logging.error(f"Request to WeChat API failed: {e}")
        return jsonify({"error": "请求微信接口失败，请检查网络连接"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)