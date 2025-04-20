from flask import Flask, request, jsonify
import requests
import logging
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime  # 导入 datetime 模块

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)

# 替换为你的小程序的 AppID 和 AppSecret
APP_ID = ""
APP_SECRET = ""

# 配置 MySQL 数据库连接
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@localhost:3306/ai_chat'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 定义用户表
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    openid = db.Column(db.String(64), unique=True, nullable=False)  # 用户的 openid

    # 明确指定 primaryjoin 条件
    chats = db.relationship(
        'ChatHistory',
        primaryjoin="User.openid == foreign(ChatHistory.openid)",
        backref='user',
        lazy=True
    )

# 定义聊天记录表
class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    openid = db.Column(db.String(64), nullable=False)  # 存储用户的 openid
    timestamp = db.Column(db.DateTime, nullable=False)  # 提问时间

# 初始化数据库
with app.app_context():
    db.create_all()

@app.route('/login', methods=['POST'])
def login():
    try:
        # 从请求中获取 code
        data = request.json
        code = data.get('code')

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

        if "errcode" in wx_data:
            return jsonify({
                "error": wx_data.get("errmsg", "微信接口调用失败"),
                "errcode": wx_data.get("errcode")
            }), 400

        openid = wx_data.get("openid")
        session_key = wx_data.get("session_key")

        # 检查用户是否已存在
        user = User.query.filter_by(openid=openid).first()
        if not user:
            # 如果用户不存在，则创建新用户
            user = User(openid=openid)
            db.session.add(user)
            db.session.commit()

        # 返回 openid 和 session_key
        return jsonify({
            "openid": openid,
            "session_key": session_key
        })

    except requests.exceptions.RequestException as e:
        logging.error(f"Request to WeChat API failed: {e}")
        return jsonify({"error": "请求微信接口失败，请检查网络连接"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/save_chat', methods=['POST'])
def save_chat():
    try:
        data = request.json
        openid = data.get('openid')  # 从请求中获取 openid
        question = data.get('question', '').replace('<think>', '').replace('</think>', '').strip()
        answer = data.get('answer', '').replace('<think>', '').replace('</think>', '').strip()

        if not openid or not question or not answer:
            return jsonify({"error": "缺少 openid、问题或答案"}), 400

        # 获取当前时间
        timestamp = datetime.now()

        # 保存到数据库
        chat = ChatHistory(question=question, answer=answer, openid=openid, timestamp=timestamp)
        db.session.add(chat)
        db.session.commit()

        return jsonify({"message": "聊天记录保存成功", "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S')}), 200

    except Exception as e:
        logging.error(f"Failed to save chat history: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_chat_history', methods=['GET'])
def get_chat_history():
    try:
        openid = request.args.get('openid')  # 从请求参数中获取 openid
        page = int(request.args.get('page', 1))  # 获取当前页码，默认为 1
        page_size = int(request.args.get('pageSize', 10))  # 获取每页记录数，默认为 10

        if not openid:
            return jsonify({"error": "缺少 openid"}), 400

        # 获取用户的聊天记录，按时间倒序排序并分页
        query = ChatHistory.query.filter_by(openid=openid).order_by(ChatHistory.timestamp.desc())
        total = query.count()  # 总记录数
        chats = query.offset((page - 1) * page_size).limit(page_size).all()

        chat_list = [
            {
                "question": chat.question,
                "answer": chat.answer,
                "timestamp": chat.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for chat in chats
        ]

        return jsonify({
            "chats": chat_list,
            "total": total,
            "page": page,
            "pageSize": page_size
        }), 200

    except Exception as e:
        logging.error(f"Failed to get chat history: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
