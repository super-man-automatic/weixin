from flask import Flask, request, jsonify
import requests
import logging
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.INFO)

# 替换为你的小程序的 AppID 和 AppSecret
APP_ID = "wx39a70f358eabe973"
APP_SECRET = "a7630e787cab06723812fba0b11fe7d2"

# 配置 MySQL 数据库连接
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:123456@localhost:3306/ai_chat'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 定义用户表
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    openid = db.Column(db.String(64), unique=True, nullable=False)

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
    openid = db.Column(db.String(64), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)

# 初始化数据库
with app.app_context():
    db.create_all()

@app.route('/login', methods=['POST'])
def login():
    """
    微信登录接口，获取 openid 和 session_key
    """
    try:
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
    """
    接收前端发送的完整聊天记录并保存到数据库
    """
    try:
        data = request.json
        logging.info(f"接收到的请求数据: {data}")

        openid = data.get('openid')  # 从请求中获取 openid
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()

        if not openid or not question or not answer:
            logging.error("缺少 openid、问题或答案")
            return jsonify({"error": "缺少 openid、问题或答案"}), 400

        # 验证字段长度
        if len(question) > 1000 or len(answer) > 5000:
            logging.error("问题或答案内容过长")
            return jsonify({"error": "问题或答案内容过长"}), 400

        # 获取当前时间
        timestamp = datetime.now()

        # 保存到数据库
        chat = ChatHistory(question=question, answer=answer, openid=openid, timestamp=timestamp)
        db.session.add(chat)
        db.session.commit()

        logging.info(f"聊天记录保存成功: openid={openid}, question={question}, answer={answer}")
        return jsonify({"message": "聊天记录保存成功", "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S')}), 200

    except Exception as e:
        logging.error(f"保存聊天记录时发生错误: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/get_chat_history', methods=['GET'])
def get_chat_history():
    """
    获取用户的聊天记录
    """
    try:
        openid = request.args.get('openid')  # 从请求参数中获取 openid

        if not openid:
            return jsonify({"error": "缺少 openid"}), 400

        # 获取用户的所有聊天记录，按时间倒序排序
        chats = ChatHistory.query.filter_by(openid=openid).order_by(ChatHistory.timestamp.desc()).all()

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
            "total": len(chat_list)
        }), 200

    except Exception as e:
        logging.error(f"Failed to get chat history: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)