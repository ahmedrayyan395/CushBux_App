# models.py
import csv
from decimal import Decimal
import enum
from io import StringIO
import os
import random
import re

import secrets
from sqlite3 import IntegrityError
import string
# models.py
import jwt
from sqlalchemy.dialects.postgresql import JSONB # Use JSONB for PostgreSQL for better performance
# from flask_jwt_extended import JWTManager
from sqlalchemy.sql import func
from flask_sqlalchemy import SQLAlchemy
import datetime
import json
from urllib.parse import parse_qs, unquote, urlparse
from flask import Blueprint, Flask, Response, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime, timedelta 
from sqlalchemy import JSON, func, or_
from werkzeug.security import generate_password_hash, check_password_hash
import hmac
import hashlib
import os
from functools import wraps
from dotenv import load_dotenv
# from backend.routes import admin_management
from flask_cors import cross_origin

# Initialize the SQLAlchemy extension
load_dotenv()
app = Flask(__name__)


CORS(
    app,
    origins=[
        "https://bot.cashubux.com",
        "https://admin.cashubux.com",
        "http://localhost:3000",
        "https://9bbc9974b41c.ngrok-free.app",  # For local development
    ],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    expose_headers=["Content-Type", "Authorization", "X-Requested-With"]
)
app.secret_key = 'replace-this-with-your-own-very-secret-key'
# Add JWT secret to your config
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
# app.config["JWT_SECRET_KEY"] = "your-super-secret-key-for-jwt"
# jwt = JWTManager(app)

# app.register_blueprint(admin_management, url_prefix='/admin')



app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mini_telegram_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False



db = SQLAlchemy(app)
migrate = Migrate(app, db)



# from datetime import datetime
from flask.cli import with_appcontext
import click

@app.cli.command("seed-users")
@with_appcontext
def seed_users():
    """Seed some demo users into the database."""

    users = [
        User(
            id=14970017,   # Telegram ID
            name="Alice",
            coins=50000000,
            ton=555,
            referral_earnings=0,
            spins=5,
            ad_credit=200.0,
            ads_watched_today=2,
            tasks_completed_today_for_spin=1,
            friends_invited_today_for_spin=0,
            space_defender_progress={"weaponLevel": 2, "shieldLevel": 1, "speedLevel": 1},
            street_racing_progress={"currentCar": 2, "unlockedCars": [1, 2], "carUpgrades": {}, "careerPoints": 50, "adProgress": {"engine": 1, "tires": 0, "nitro": 0}},
            banned=False
        ),
        User(
            id=1497001715,   # Telegram ID
            name="Alice",
            coins=50000000,
            ton=125,
            referral_earnings=0,
            spins=5,
            ad_credit=200.0,
            ads_watched_today=2,
            tasks_completed_today_for_spin=1,
            friends_invited_today_for_spin=0,
            space_defender_progress={"weaponLevel": 2, "shieldLevel": 1, "speedLevel": 1},
            street_racing_progress={"currentCar": 2, "unlockedCars": [1, 2], "carUpgrades": {}, "careerPoints": 50, "adProgress": {"engine": 1, "tires": 0, "nitro": 0}},
            banned=False
        ),
       
    
    
    ]

    db.session.add_all(users)
    db.session.commit()
    click.echo("✅ Users seeded successfully")



# --- Enums defined from TypeScript interfaces ---


class TransactionType(enum.Enum):
    WITHDRAWAL = 'Withdrawal'
    DEPOSIT = 'Deposit'

class TransactionCurrency(enum.Enum):
    TON = 'TON'
    COINS = 'Coins'

class TransactionStatus(enum.Enum):
    COMPLETED = 'Completed'
    PENDING = 'Pending'
    FAILED = 'Failed'

class PromoCodeType(enum.Enum):
    COINS = 'COINS'
    TON_AD_CREDIT = 'TON_AD_CREDIT'
    SPINS = 'SPINS'








# --- Association Tables for Many-to-Many Relationships ---

# Tracks which user has completed which task
# First, modify your table definition (if you can run migrations)

friendships = db.Table('friendships',
    db.Column('user_id', db.BigInteger, db.ForeignKey('users.id'), primary_key=True),
    db.Column('friend_id', db.BigInteger, db.ForeignKey('users.id'), primary_key=True)
)


# --- Core Models ---





user_daily_task_completions = db.Table(
    "user_daily_task_completions",
    db.Column("user_id", db.BigInteger, db.ForeignKey("users.id"), primary_key=True),
    db.Column("task_id", db.String, db.ForeignKey("daily_tasks.id"), primary_key=True),
    db.Column("started_at", db.TIMESTAMP, server_default=func.now()),
    db.Column("completed_at", db.TIMESTAMP),
    db.Column("claimed", db.Boolean, default=False)  # ✅ track claim status
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.BigInteger, primary_key=True, autoincrement=False, comment="Corresponds to Telegram ID")
    name = db.Column(db.String(255), nullable=False)
    
    # Currency and Rewards
    coins = db.Column(db.BigInteger, nullable=False, default=0)
    ton = db.Column(db.Numeric(20, 9), nullable=False, default=0.0)
    referral_earnings = db.Column(db.BigInteger, nullable=False, default=0)
    spins = db.Column(db.Integer, nullable=False, default=0)
    ad_credit = db.Column(db.Numeric(12, 4), nullable=False, default=0.0)
    
    # Daily Tracking Columns
    ads_watched_today = db.Column(db.Integer, nullable=False, default=0)
    tasks_completed_today_for_spin = db.Column(db.Integer, nullable=False, default=0)
    friends_invited_today_for_spin = db.Column(db.Integer, nullable=False, default=0)

    # Game Progress stored as JSON
    space_defender_progress = db.Column(JSON, nullable=False, default=lambda: {"weaponLevel": 1, "shieldLevel": 1, "speedLevel": 1})
    street_racing_progress = db.Column(JSON, nullable=False, default=lambda: {"currentCar": 1, "unlockedCars": [1], "carUpgrades": {}, "careerPoints": 0, "adProgress": {"engine": 0, "tires": 0, "nitro": 0}})

    banned = db.Column(db.Boolean, default=False)
    
    # Daily tasks relationship
    daily_tasks = db.relationship(
        "DailyTask",
        secondary="user_daily_task_completions",
        back_populates="users"
    )

    # Friends relationships
    friends = db.relationship('User',
                              secondary=friendships,
                              primaryjoin=(id == friendships.c.user_id),
                              secondaryjoin=(id == friendships.c.friend_id),
                              backref="friend_of")

    # Referral tracking - REMOVE referral_code since we're using user ID
    referred_by = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=True)
    referral_count = db.Column(db.Integer, default=0)
    total_referral_earnings = db.Column(db.BigInteger, default=0)

    # Relationships
    referrals = db.relationship('User',
                                foreign_keys=[referred_by],
                                backref=db.backref('referrer', remote_side=[id]))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "coins": self.coins,
            "ton": float(self.ton),
            "referral_earnings": self.referral_earnings,
            "spins": self.spins,
            "ad_credit": float(self.ad_credit),
            "ads_watched_today": self.ads_watched_today,
            "tasks_completed_today_for_spin": self.tasks_completed_today_for_spin,
            "friends_invited_today_for_spin": self.friends_invited_today_for_spin,
            "space_defender_progress": self.space_defender_progress,
            "street_racing_progress": self.street_racing_progress,
            "banned": self.banned,
            "friends": [friend.id for friend in self.friends],
            "referral_count": self.referral_count,
            "total_referral_earnings": self.total_referral_earnings,
            "referred_by": self.referred_by,
        }    

class Referral(db.Model):
    __tablename__ = 'referrals'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    referrer_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    referred_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    earnings_generated = db.Column(db.BigInteger, default=0)
    
    # Relationships
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_made')
    referred = db.relationship('User', foreign_keys=[referred_id], backref='referrals_received')
    
    __table_args__ = (
        db.UniqueConstraint('referrer_id', 'referred_id', name='unique_referral'),
    )

class TaskCategory(enum.Enum):
    DAILY = 'Daily'
    GAME = 'Game'
    SOCIAL = 'Social'
    PARTNER = 'Partner'

class CampaignStatus(enum.Enum):
    ACTIVE = 'Active'
    PAUSED = 'Paused'
    COMPLETED = 'Completed'

user_task_completion = db.Table('user_task_completions',
    db.Column('user_id', db.BigInteger, db.ForeignKey('users.id'), primary_key=True),
    db.Column('campaign_id', db.BigInteger, db.ForeignKey('user_campaigns.id'), primary_key=True),
    db.Column('started_at', db.TIMESTAMP, server_default=func.now()),  # Add this
    db.Column('completed_at', db.TIMESTAMP)  # Keep this
)
# Tracks friendships (many-to-many relationship on User)

class UserCampaign(db.Model):
    __tablename__ = 'user_campaigns'

    # Common fields for User and Partner campaigns
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    creator_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    link = db.Column(db.String, nullable=False)
    langs = db.Column(JSON, nullable=False, default=list)
    
    status = db.Column(db.Enum(CampaignStatus), default=CampaignStatus.ACTIVE)
    completions = db.Column(db.Integer, default=0)
    goal = db.Column(db.Integer, nullable=False)  # number of users
    cost = db.Column(db.Numeric(12, 4), nullable=False)  # how many coins claimed
    category = db.Column(db.Enum(TaskCategory), nullable=False)
    
    # New field for subscription validation
    check_subscription = db.Column(db.Boolean, default=False)
    
    # Discriminator for inheritance
    type = db.Column(db.String(50)) 
    
    creator = db.relationship('User', backref='campaigns')
    
    __mapper_args__ = {
        'polymorphic_identity': 'user_campaign',
        'polymorphic_on': type
    }

    def to_dict(self):
        return {
            'id': self.id,
            'creator_id': self.creator_id,
            'link': self.link,
            'status': self.status.name if self.status else None,
            'completions': self.completions,
            'goal': self.goal,
            'cost': str(self.cost),  # Convert Decimal to string for JSON
            'category': self.category.name if self.category else None,
            'check_subscription': self.check_subscription,  # Include the new field
            'type': self.type,
            'langs': self.langs  # The JSONB field is automatically read as a Python list
        }



class PartnerCampaign(UserCampaign):
    __tablename__ = 'partner_campaigns'

    id = db.Column(db.String, db.ForeignKey('user_campaigns.id'), primary_key=True)
    required_level = db.Column(db.Integer, nullable=False)
    webhook_token = db.Column(db.String(64), unique=True, nullable=False)  # Add this field

    __mapper_args__ = {
        'polymorphic_identity': 'partner_campaign',
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Generate unique webhook token if not provided
        if not self.webhook_token:
            self.webhook_token = self.generate_webhook_token()
    
    def generate_webhook_token(self):
        """Generate a secure random token for webhook authentication"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    def to_dict(self):
        data = super().to_dict()
        data['requiredLevel'] = self.required_level
        data['webhookToken'] = self.webhook_token  # Include the token
        return data



# models.py - Add these models
class UserGameProgress(db.Model):
    __tablename__ = 'user_game_progress'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    game_id = db.Column(db.String(100), nullable=False)  # bot username or game identifier
    current_level = db.Column(db.Integer, default=1)
    max_level_reached = db.Column(db.Integer, default=1)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='game_progress')
    
    __table_args__ = (
        db.Index('idx_user_game', 'user_id', 'game_id'),
    )

class LevelCompletion(db.Model):
    __tablename__ = 'level_completions'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('user_campaigns.id'), nullable=False)
    required_level = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    campaign = db.relationship('UserCampaign', backref='level_completions')

class DailyTask(db.Model):
    __tablename__ = "daily_tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String, nullable=False)
    reward = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String, default="Daily")

    # ✅ use AdNetwork.id instead of .name
    ad_network_id = db.Column(db.Integer, db.ForeignKey("ad_network.id"), nullable=True)

    link = db.Column(db.String, nullable=False)
    status = db.Column(db.Enum(CampaignStatus), default=CampaignStatus.ACTIVE)
    completions = db.Column(db.Integer, default=0)

    # ✅ New column: task_type
    task_type = db.Column(db.String, default="general", nullable=False)

    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    users = db.relationship(
        "User",
        secondary="user_daily_task_completions",
        back_populates="daily_tasks",
    )

    # ✅ Optional relationship back to AdNetwork
    ad_network = db.relationship("AdNetwork", backref="daily_tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "reward": self.reward,
            "category": self.category,
            "link": self.link,
            "status": self.status.value if self.status else None,
            "completions": self.completions,
            "taskType": self.task_type,  # ✅ expose as camelCase
            "ad_network_id": self.ad_network_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }




class Quest(db.Model):
    __tablename__ = 'quests'
    
    id = db.Column(db.String, primary_key=True)
    icon_name = db.Column(db.String, nullable=False)
    title = db.Column(db.String, nullable=False)
    reward = db.Column(db.Integer, nullable=False, comment="Reward in coins")
    total_progress = db.Column(db.Integer, nullable=False, comment="The goal the user must reach")

class UserQuestProgress(db.Model):
    __tablename__ = 'user_quest_progress'
    
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), primary_key=True)
    quest_id = db.Column(db.String, db.ForeignKey('quests.id'), primary_key=True)
    current_progress = db.Column(db.Integer, default=0)
    
    user = db.relationship('User', backref='quest_progress')
    quest = db.relationship('Quest', backref='user_progress')

# models.py
# models.py
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(20, 9), nullable=False)
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    currency = db.Column(db.Enum(TransactionCurrency), nullable=False)
    status = db.Column(db.Enum(TransactionStatus), nullable=False, default=TransactionStatus.COMPLETED)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('transactions', lazy='dynamic'))


class PromoCode(db.Model):
    __tablename__ = 'promo_codes'
    
    code = db.Column(db.String, primary_key=True)
    type = db.Column(db.Enum(PromoCodeType), nullable=False)
    value = db.Column(db.Numeric(20, 9), nullable=False)
    max_uses = db.Column(db.Integer) # Null for infinite
    
    # Storing an array of user IDs is simpler with JSON
    used_by = db.Column(JSON, default=list) 
    
    expires_at = db.Column(db.TIMESTAMP, nullable=True)


class Settings(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)
    auto_withdrawals = db.Column(db.Boolean, default=False, nullable=False)


class AdNetwork(db.Model):
    __tablename__ = "ad_network"   # ✅ define table name

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String, nullable=False, unique=True)  # optional unique
    code = db.Column(db.Text, nullable=False)
    enabled = db.Column(db.Boolean, default=True)

class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    permissions = db.Column(JSON, nullable=False) # e.g., ["MANAGE_USERS", "CREATE_TASKS"]



# Add this to your models.py

class SpinHistory(db.Model):
    __tablename__ = 'spin_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    prize_type = db.Column(db.String(20), nullable=False)  # coins, spins, ton, none
    prize_value = db.Column(db.Numeric(20, 9), nullable=False, default=0)
    prize_label = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('spin_history', lazy='dynamic'))




# IMPORTANT: This function needs to be updated to use sessions
def current_user():
    if  'user_id' in session:
        return User.query.get(session['user_id'])
    return  User.query.get(2) # No user is logged in



@app.get('/user/me')
def get_current_user():
    user = current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify(user.to_dict()) # Return the logged-in user's data







@app.route('/auth/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh JWT token endpoint - Manual implementation
    """
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Authorization header with Bearer token required"}), 401
    
    try:
        # Extract the token
        token = auth_header.split(' ')[1]
        
        # Decode the token without verification to get user ID
        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        user_id = unverified_payload.get('user_id')
        
        if not user_id:
            return jsonify({"error": "Invalid token"}), 401
            
        # Verify the user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if user.banned:
            return jsonify({"error": "Account is banned"}), 403
        
        # Now verify the token properly
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            # Token is expired but we'll still allow refresh if user is valid
            pass
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        # Create new token
        token_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        new_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return jsonify({
            "success": True,
            "token": new_token,
            "message": "Token refreshed successfully"
        }), 200
        
    except Exception as e:
        print(f"Token refresh error: {e}")
        return jsonify({"error": "Invalid or expired token"}), 401


# Create a JWT required decorator
def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Token required"}), 401
        
        try:
            token = token.replace('Bearer ', '')
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# Add this function to validate Telegram authentication
def validate_telegram_init_data_simple(init_data: str, bot_token: str) -> bool:
    """
    Simplified validation that handles common parsing issues
    """
    try:
        # Parse the query string
        parsed = parse_qs(init_data)
        
        # Get the hash
        hash_value = parsed.get('hash', [''])[0]
        if not hash_value:
            return False
        
        # Create data check string
        data_check_list = []
        for key in sorted(parsed.keys()):
            if key == 'hash':
                continue
            for value in parsed[key]:
                data_check_list.append(f"{key}={value}")
        
        data_check_string = "\n".join(data_check_list)
        
        # Calculate secret key
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Calculate expected hash
        expected_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(hash_value, expected_hash)
        
    except Exception as e:
        print(f"Validation error: {e}")
        return False



@app.post('/dev/login/<int:user_id>')
def dev_login(user_id):
    user = User.query.get(user_id)

    if not user:
        app.logger.error(f"DEV LOGIN FAILED: No user found with ID: {user_id}")
        return jsonify({"message": f"User with ID {user_id} not found."}), 404

    # Create session
    session.clear()
    session['user_id'] = user.id

    # Create JWT token (valid for 7 days)
    token_payload = {
        'user_id': user.id,
        'exp': datetime.now() + timedelta(days=7)  # UTC is safer for JWT
    }
    jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    app.logger.info(f"DEV LOGIN SUCCESS: Session created for User ID {user.id} ({user.name})")

    # Return user data with token
    user_data = user.to_dict()
    user_data['token'] = jwt_token

    return jsonify(user_data)

@app.route('/auth/telegram', methods=['POST'])
def auth_with_telegram():
    data = request.get_json()
    init_data_str = data.get('initData')
    start_param_from_frontend = data.get('startParam')  # Get from frontend

    if not init_data_str:
        return jsonify({"error": "initData is required"}), 400

    try:
        # Parse the init data
        parsed_data = parse_qs(init_data_str)
        
        # Get the user parameter
        user_params = parsed_data.get('user')
        if not user_params:
            return jsonify({"error": "User data is missing from initData"}), 400

        # Parse the JSON user data
        user_param = user_params[0]
        user_data = json.loads(user_param)

        telegram_id = user_data.get('id')
        if not telegram_id:
            return jsonify({"error": "Invalid user data in initData"}), 400

        referred_by_id = None
        
        # FIRST: Check for start parameter from frontend (most reliable - from Telegram WebApp SDK)
        if start_param_from_frontend and start_param_from_frontend.startswith('ref_'):
            try:
                referred_by_id = int(start_param_from_frontend.replace('ref_', ''))
                print(f"🔗 Found referral from frontend startParam: {referred_by_id}")
            except (ValueError, AttributeError):
                referred_by_id = None
                print("❌ Invalid startParam format from frontend")
        
        # SECOND: Check in initData for startapp parameter (deep links)
        if not referred_by_id:
            startapp_params = parsed_data.get('startapp')
            if startapp_params:
                try:
                    startapp_param = startapp_params[0]
                    if startapp_param.startswith('ref_'):
                        referred_by_id = int(startapp_param.replace('ref_', ''))
                        print(f"🔗 Found referral from startapp: {referred_by_id}")
                except (ValueError, AttributeError):
                    referred_by_id = None
                    print("❌ Invalid startapp parameter format")
        
        # THIRD: Check for regular start parameter (web compatibility)
        if not referred_by_id:
            start_params = parsed_data.get('start')
            if start_params:
                try:
                    start_param = start_params[0]
                    if start_param.startswith('ref_'):
                        referred_by_id = int(start_param.replace('ref_', ''))
                        print(f"🔗 Found referral from start: {referred_by_id}")
                except (ValueError, AttributeError):
                    referred_by_id = None
                    print("❌ Invalid start parameter format")

        # FOURTH: Check the initData string directly (fallback)
        if not referred_by_id and init_data_str:
            try:
                # Look for start parameters in the raw initData string
                start_patterns = [r'start=ref_(\d+)', r'startapp=ref_(\d+)']
                for pattern in start_patterns:
                    match = re.search(pattern, init_data_str)
                    if match:
                        referred_by_id = int(match.group(1))
                        print(f"🔗 Found referral from initData string pattern: {referred_by_id}")
                        break
            except (ValueError, re.error):
                referred_by_id = None

        # Debug output
        print(f"👤 User ID: {telegram_id}")
        print(f"📋 Start param from frontend: {start_param_from_frontend}")
        print(f"🎯 Referred by ID: {referred_by_id}")

        # Validate referrer
        if referred_by_id:
            if referred_by_id == telegram_id:
                referred_by_id = None  # Prevent self-referral
                print("🚫 Self-referral detected, ignoring")
            else:
                referrer = User.query.get(referred_by_id)
                if not referrer:
                    referred_by_id = None  # Referrer doesn't exist
                    print("❌ Referrer not found in database")
                else:
                    print(f"✅ Valid referrer found: {referrer.name} (ID: {referrer.id})")

        # Use get_or_create pattern with race condition handling
        user = None
        is_new_user = False
        
        # First try to get existing user
        user = User.query.get(telegram_id)
        
        if user:
            # Existing user - update name if it changed
            new_name = user_data.get('username') or f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Anonymous"
            if user.name != new_name:
                user.name = new_name
                print(f"📝 Updated user name: {user.name}")
            
            # Only set referral if user doesn't have one already and referral is valid
            if not user.referred_by and referred_by_id and referred_by_id != user.id:
                user.referred_by = referred_by_id
                print(f"🔗 Updated existing user referral: {telegram_id} -> {referred_by_id}")
        else:
            # New user - try to create with race condition handling
            is_new_user = True
            try:
                user = User(
                    id=telegram_id,
                    name=user_data.get('username') or 
                         f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or 
                         "Anonymous",
                    coins=0,
                    ton=0.0,
                    referral_earnings=0,
                    spins=10,
                    ad_credit=0.0,
                    ads_watched_today=0,
                    tasks_completed_today_for_spin=0,
                    friends_invited_today_for_spin=0,
                    space_defender_progress={"weaponLevel": 1, "shieldLevel": 1, "speedLevel": 1},
                    street_racing_progress={
                        "currentCar": 1, 
                        "unlockedCars": [1], 
                        "carUpgrades": {}, 
                        "careerPoints": 0, 
                        "adProgress": {"engine": 0, "tires": 0, "nitro": 0}
                    },
                    banned=False,
                    referred_by=referred_by_id,
                    referral_count=0,
                    total_referral_earnings=0
                )
                db.session.add(user)
                db.session.flush()  # Test if we can add without commit
                print(f"✅ Created new user: {telegram_id}, referred by: {referred_by_id}")
                
            except IntegrityError:
                # Race condition: user was already created by another request
                db.session.rollback()
                print(f"⚠️  Race condition detected for user {telegram_id}, retrieving existing user...")
                
                # Get the user that was created by the other request
                user = User.query.get(telegram_id)
                if user:
                    is_new_user = False
                    print(f"✅ Retrieved existing user after race condition: {user.name}")
                else:
                    # If user still doesn't exist, re-raise the error
                    raise

        # Update referrer's count for new users only
        if is_new_user and referred_by_id and referred_by_id != user.id:
            referrer = User.query.get(referred_by_id)
            if referrer:
                referrer.referral_count += 1
                
                # AWARD 1 SPIN TO REFERRER FOR SUCCESSFUL REFERRAL
                referrer.spins += 1
                
                # INCREASE FRIEND INVITATION COUNT FOR TODAY
                referrer.friends_invited_today_for_spin += 1
                
                # Create referral record (check if it already exists first)
                existing_referral = Referral.query.filter_by(
                    referrer_id=referred_by_id,
                    referred_id=user.id
                ).first()
                
                if not existing_referral:
                    referral = Referral(
                        referrer_id=referred_by_id,
                        referred_id=user.id,
                        earnings_generated=0
                    )
                    db.session.add(referral)
                    print(f"📊 Created referral record: {referrer.id} -> {user.id}")
                else:
                    print(f"📊 Referral record already exists: {referrer.id} -> {user.id}")
                
                print(f"📈 Updated referrer count: {referrer.referral_count}")
                print(f"🎰 Awarded 1 spin to referrer {referrer.id} for new referral")
                print(f"👥 Increased friend invitation count for today: {referrer.friends_invited_today_for_spin}")

        db.session.commit()

        # Create JWT token
        token_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Return user data with token
        user_dict = user.to_dict()
        user_dict['token'] = jwt_token
        user_dict['is_new_user'] = is_new_user

        print(f"✅ Authentication successful for user: {user.name} (ID: {user.id})")
        print(f"🆕 New user: {is_new_user}")
        print(f"🎯 Referred by: {referred_by_id}")

        return jsonify(user_dict)

    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        return jsonify({"error": "Failed to decode user JSON"}), 400
    except IntegrityError as e:
        db.session.rollback()
        print(f"❌ Database integrity error: {e}")
        # Try to get the user that might have been created
        user = User.query.get(telegram_id)
        if user:
            # If user exists, return them anyway
            token_payload = {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            }
            jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            user_dict = user.to_dict()
            user_dict['token'] = jwt_token
            user_dict['is_new_user'] = False
            return jsonify(user_dict)
        return jsonify({"error": "Authentication failed due to database conflict"}), 500
    except Exception as e:
        db.session.rollback()
        print(f"❌ Auth error: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Authentication failed"}), 500

@app.route('/my-campaigns', methods=['GET'])
@jwt_required  # Use this or  depending on your needs
def get_my_created_campaigns():

    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404


    user_campaigns = UserCampaign.query.filter_by(creator_id=user_id).order_by(UserCampaign.id).all()
    
    if not user_campaigns:
        return jsonify([]), 200
        
    
    campaigns_list = [campaign.to_dict() for campaign in user_campaigns]
    
    return jsonify(campaigns_list), 200



@app.route('/usercampaigns/unclaimed', methods=['GET'])
@jwt_required
def get_my_unclaimed_created_campaigns():
    """Return campaigns created by the current user that they haven't yet claimed."""
    try:
        current_user_id = current_user().id

        # Get IDs of campaigns this user has already completed
        completed_records = db.session.execute(
            user_task_completion.select().where(
                (user_task_completion.c.user_id == current_user_id) &
                (user_task_completion.c.completed_at.isnot(None))
            )
        ).all()
        completed_campaign_ids = [record.campaign_id for record in completed_records]

        # Query campaigns created by this user that are NOT completed by them
        user_campaigns = UserCampaign.query.filter(
            (UserCampaign.creator_id == current_user_id) &
            (~UserCampaign.id.in_(completed_campaign_ids))
        ).order_by(UserCampaign.id).all()

        return jsonify([c.to_dict() for c in user_campaigns]), 200

    except Exception as e:
        print(f"Error fetching my unclaimed campaigns: {e}")
        # fallback
        user_campaigns = UserCampaign.query.filter_by(
            creator_id=current_user().id
        ).order_by(UserCampaign.id).all()
        return jsonify([c.to_dict() for c in user_campaigns]), 200



@app.route('/campaigns', methods=['GET'])
@jwt_required
def get_all_uncompleted_campaigns():
    """Return all campaigns except the ones the current user has already completed."""
    try:
        current_user_id = request.args.get('user_id', type=int)

        if not current_user_id:
            return jsonify({"success": False, "message": "Missing user_id"}), 400

        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404


        # Get all campaign IDs completed by this user
        completed_records = db.session.execute(
            user_task_completion.select().where(
                (user_task_completion.c.user_id == current_user_id) &
                (user_task_completion.c.completed_at.isnot(None))
            )
        ).all()
        completed_campaign_ids = [record.campaign_id for record in completed_records]

        # Return all campaigns excluding the completed ones
        campaigns = UserCampaign.query.filter(
            ~UserCampaign.id.in_(completed_campaign_ids)
        ).order_by(UserCampaign.id).all()

        return jsonify([c.to_dict() for c in campaigns]), 200

    except Exception as e:
        print(f"Error fetching campaigns: {e}")
        # fallback → return everything
        campaigns = UserCampaign.query.order_by(UserCampaign.id).all()
        return jsonify([c.to_dict() for c in campaigns]), 200







@app.route("/addusercampaigns", methods=["POST"])
@jwt_required
def create_campaign():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Ensure ad_credit check
    if user.ad_credit < Decimal(str(data['cost'])):
        return jsonify({
            "success": False,
            "message": "Insufficient ad balance. Please add funds."
        }), 400

    # Deduct cost safely
    user.ad_credit -= Decimal(str(data['cost']))

    # Required fields
    required = ['user_id', 'link', 'goal', 'cost', 'languages', 'category']
    if not all(k in data for k in required):
        return jsonify({
            "success": False,
            "message": f"Missing required fields: {required}"
        }), 400

    # Check creator exists
    creator = User.query.get(data['user_id'])
    if not creator:
        return jsonify({
            "success": False,
            "message": f"Creator user with id {data['user_id']} not found"
        }), 404

    # Parse category safely
    try:
        category = TaskCategory[data['category'].upper()]
    except KeyError:
        return jsonify({
            "success": False,
            "message": "Invalid category value"
        }), 400

    # Validate languages
    langs = data.get('languages', [])
    if not isinstance(langs, list):
        return jsonify({
            "success": False,
            "message": "The 'languages' field must be an array of strings."
        }), 400

    # Create the right campaign type with check_subscription
    # Create the right campaign type
    if 'requiredLevel' in data:
        new_campaign = PartnerCampaign(
            creator_id=data['user_id'],
            link=data['link'],
            langs=langs,
            status="ACTIVE",
            completions=0,
            goal=data['goal'],
            cost=Decimal(str(data['cost'])),
            category=category,
            required_level=data['requiredLevel'],
            check_subscription=True
        )
    else:
        new_campaign = UserCampaign(
            creator_id=data['user_id'],
            link=data['link'],
            langs=langs,
            status="ACTIVE",
            completions=0,
            goal=data['goal'],
            cost=Decimal(str(data['cost'])),
            category=category,
            check_subscription=data.get('checkSubscription', False)
        )

    db.session.add(new_campaign)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Campaign created successfully",
        "newCampaign": new_campaign.to_dict(),  # This will include the webhook token
        "user": user.to_dict()
    }), 201


def validate_telegram_access(link, check_subscription):
    """Validate that our bot has access to the Telegram channel/group"""
    try:
        # Simulate validation - in real implementation, this would call Telegram API
        # Check if link is a valid Telegram URL
        if not link.startswith('https://t.me/'):
            return {"success": False, "message": "Invalid Telegram URL"}
        
        # Simulate checking if our bot is admin with proper permissions
        # For demo purposes, we'll randomly succeed 80% of the time
        import random
        if random.random() < 0.8:
            return {"success": True, "message": "Validation successful"}
        else:
            return {"success": False, "message": "Please add our validation bot as admin with view permissions"}
    
    except Exception as e:
        return {"success": False, "message": f"Validation error: {str(e)}"}



def validate_bot_access(link):
    """Validate that the bot exists and is accessible"""
    try:
        # Simulate bot validation
        if not link.startswith('https://t.me/'):
            return {"success": False, "message": "Invalid bot URL"}
        
        # Check if bot username is valid (ends with 'bot')
        username = link.split('/')[-1]
        if not username.lower().endswith('bot'):
            return {"success": False, "message": "URL should point to a Telegram bot"}
        
        # Simulate checking if bot is operational
        import random
        if random.random() < 0.9:
            return {"success": True, "message": "Bot validation successful"}
        else:
            return {"success": False, "message": "Could not verify bot accessibility"}
    
    except Exception as e:
        return {"success": False, "message": f"Bot validation error: {str(e)}"}



@app.route("/tasks/start", methods=["POST"])
@jwt_required
def start_task():
    data = request.get_json()
    user_id = data.get("userId")
    task_id = data.get("taskId")

    if not user_id or not task_id:
        return jsonify({"success": False, "message": "Missing parameters"}), 400

    user = User.query.get(user_id)
    campaign = UserCampaign.query.get(task_id)

    if not user or not campaign:
        return jsonify({"success": False, "message": "User or Campaign not found"}), 404

    # Check if campaign is active
   

    # Check if user has Telegram connected
    if not user.id:
        return jsonify({
            "success": False, 
            "message": "Please connect your Telegram account first"
        }), 400

    # Check if already completed
    existing_completion = db.session.execute(
        user_task_completion.select().where(
            (user_task_completion.c.user_id == user_id) &
            (user_task_completion.c.campaign_id == str(task_id)) &
            (user_task_completion.c.completed_at.isnot(None))
        )
    ).first()

    if existing_completion:
        return jsonify({"success": False, "message": "Task already completed"}), 400

    # Check if already started but not completed
    existing_start = db.session.execute(
        user_task_completion.select().where(
            (user_task_completion.c.user_id == user_id) &
            (user_task_completion.c.campaign_id == (task_id)) &
            (user_task_completion.c.completed_at.is_(None))
        )
    ).first()

    if existing_start:
        return jsonify({"success": True, "message": "Task already started", "status": "started"})

    # NO VALIDATION AT START - JUST CREATE THE TASK RECORD
    db.session.execute(user_task_completion.insert().values(
        user_id=user_id,
        campaign_id=(task_id),
        started_at=datetime.now()
    ))

    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Task started successfully", 
        "status": "new"
    })


@app.route("/tasks/claim", methods=["POST"])
@jwt_required
def claim_task():
    data = request.get_json()
    user_id = data.get("userId")
    task_id = data.get("taskId")

    if not user_id or not task_id:
        return jsonify({"success": False, "message": "Missing parameters"}), 400

    user = User.query.get(user_id)
    campaign = UserCampaign.query.get(task_id)

    if not user or not campaign:
        return jsonify({"success": False, "message": "User or Campaign not found"}), 404

    # Check if task was started
    existing_record = db.session.execute(
        user_task_completion.select().where(
            (user_task_completion.c.user_id == user_id) &
            (user_task_completion.c.campaign_id == (task_id))
        )
    ).first()

    if not existing_record:
        return jsonify({"success": False, "message": "Task not started"}), 400

    if existing_record.completed_at:
        return jsonify({"success": False, "message": "Task already claimed"}), 400

    # VALIDATION: Check subscription for social campaigns (ONLY AT CLAIM TIME)
    if campaign.category == TaskCategory.SOCIAL and campaign.check_subscription:
        # Extract channel username from link (e.g., "https://t.me/channelname" -> "channelname")
        channel_username = campaign.link.replace('https://t.me/', '').split('?')[0]
        
        # Make direct Telegram API request to check membership
        is_member = check_telegram_membership_direct(channel_username, user.telegram_id)
        
        if not is_member:
            return jsonify({
                "success": False, 
                "message": "Please subscribe to the channel to claim rewards"
            }), 400

    # VALIDATION: Check bot start for game campaigns (ONLY AT CLAIM TIME)
    elif campaign.category == TaskCategory.GAME:
        # Extract bot username from link
        bot_username = campaign.link.replace('https://t.me/', '').split('?')[0]
        
        # Check if user started the bot
        bot_started = check_user_started_bot(bot_username, user.id)
        
        if not bot_started:
            return jsonify({
                "success": False, 
                "message": "Please start the bot to claim rewards"
            }), 400

    # VALIDATION: Check level completion for partner campaigns (ONLY AT CLAIM TIME)
    elif campaign.category == TaskCategory.PARTNER:
        # For partner campaigns, check if user reached the required level
        partner_campaign = PartnerCampaign.query.get(task_id)
        if not partner_campaign:
            return jsonify({"success": False, "message": "Invalid partner campaign"}), 400
        
        # Extract game ID from link
        # game_id = extract_game_id_from_link(campaign.link)
        game_id = campaign.link

        
        # Check user's current level for this game
        user_progress = UserGameProgress.query.filter_by(
            user_id=user.id,
            game_id=game_id
        ).first()
        
        if not user_progress or user_progress.current_level < partner_campaign.required_level:
            return jsonify({
                "success": False, 
                "message": f"Reach level {partner_campaign.required_level} in the game to claim rewards"
            }), 400
        
        # Check if level completion is already recorded
        level_completion = LevelCompletion.query.filter_by(
            user_id=user.id,
            campaign_id=campaign.id
        ).first()
        
        if not level_completion:
            return jsonify({
                "success": False, 
                "message": "Level completion not verified. Please make sure the game sent your progress."
            }), 400

    # ONLY COMPLETE TASK IF VALIDATION PASSES
    db.session.execute(
        user_task_completion.update().where(
            (user_task_completion.c.user_id == user_id) &
            (user_task_completion.c.campaign_id == (task_id))
        ).values(completed_at=datetime.now())
    )

    # Update campaign completions
    campaign.completions += 1

    # Reward user
    CONVERSION_RATE = 1000000
    reward = int((campaign.cost / Decimal(campaign.goal or 1)) * Decimal("0.4") * Decimal(CONVERSION_RATE))
    user.coins += reward
    user.tasks_completed_today_for_spin+=1
    user.spins+=1

    award_referral_earnings(user.id, reward)


    db.session.commit()
    db.session.refresh(user)

    return jsonify({
        "success": True,
        "message": f"Task claimed! +{reward} coins",
        "user": user.to_dict(),
        "reward": reward
    })



def extract_game_id_from_link(link: str) -> str:
    """Extract game/bot ID from various link formats"""
    if link.startswith('https://t.me/'):
        # Remove https://t.me/ and any query parameters
        return link.replace('https://t.me/', '').split('?')[0]
    elif link.startswith('@'):
        # Remove @ prefix
        return link[1:]
    else:
        # Return as is (could be bot username without @)
        return link

def check_telegram_membership_direct(channel_username: str, user_telegram_id: int) -> bool:
    """Make direct Telegram API request to check if user is member of channel"""
    import requests
    import os
    
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        print("Telegram bot token not found")
        return False
    
    base_url = f"https://api.telegram.org/bot{bot_token}"
    
    # Try different chat ID formats
    chat_formats = [
        f"@{channel_username}",  # With @ prefix
        channel_username,         # Without @ prefix
    ]
    
    for chat_format in chat_formats:
        try:
            url = f"{base_url}/getChatMember"
            payload = {
                "chat_id": chat_format,
                "user_id": user_telegram_id
            }
            
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            if result and result.get('ok'):
                status = result['result']['status']
                # User is member if status is not 'left' or 'kicked'
                is_member = status not in ['left', 'kicked']
                print(f"Telegram API: User {user_telegram_id} status in {chat_format}: {status} -> Member: {is_member}")
                return is_member
            else:
                print(f"Telegram API error for {chat_format}: {result}")
                
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 400:
                error_data = e.response.json()
                print(f"Telegram API 400 error for {chat_format}: {error_data.get('description', 'Unknown error')}")
            else:
                print(f"Telegram API HTTP error for {chat_format}: {e}")
        except Exception as e:
            print(f"Telegram API error for {chat_format}: {e}")
    
    return False


def check_user_started_bot(bot_username: str, user_telegram_id: int) -> bool:
    """
    Check if user started the bot.
    This requires storing bot start events in your database.
    For now, return True as placeholder - implement your actual tracking logic.
    """
    # TODO: Implement actual bot start tracking
    # This could be done by storing when users interact with your bot
    # and checking if the user has started the specific bot
    
    print(f"Placeholder: Assuming user {user_telegram_id} started bot {bot_username}")
    return True



@app.route("/api/webhook/level-update", methods=["POST"])
def level_update_webhook():
    data = request.get_json()
    
    # Check for token authentication
    auth_token = request.headers.get('Authorization')
    if not auth_token or not auth_token.startswith('Bearer '):
        return jsonify({"success": False, "message": "Authentication required"}), 401
    
    token = auth_token[7:]  # Remove 'Bearer ' prefix
    
    # Find campaign by token
    campaign = PartnerCampaign.query.filter_by(webhook_token=token).first()
    if not campaign:
        return jsonify({"success": False, "message": "Invalid token"}), 401
    
    # Required fields
    required_fields = ['user_id', 'current_level']
    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    user_id = data['user_id']
    current_level = data['current_level']
    
    try:
        # Update or create user game progress
        progress = UserGameProgress.query.filter_by(
            user_id=user_id,
            game_id=campaign.link  # Use campaign link as game identifier
        ).first()
        
        if progress:
            progress.current_level = current_level
            if current_level > progress.max_level_reached:
                progress.max_level_reached = current_level
        else:
            progress = UserGameProgress(
                user_id=user_id,
                game_id=campaign.link,
                current_level=current_level,
                max_level_reached=current_level
            )
            db.session.add(progress)
        
        db.session.commit()
        
        # Check if user completed this specific partner task
        check_level_completion(user_id, campaign.id, current_level, campaign.required_level)
        
        return jsonify({
            "success": True,
            "message": "Level updated successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Level update error: {e}")
        return jsonify({"success": False, "message": "Internal server error"}), 500

def check_level_completion(user_id: int, campaign_id: int, current_level: int, required_level: int):
    """Check if user completed a specific partner task"""
    if current_level >= required_level:
        # Check if already completed
        existing_completion = LevelCompletion.query.filter_by(
            user_id=user_id,
            campaign_id=campaign_id
        ).first()
        
        if not existing_completion:
            # Record completion
            new_completion = LevelCompletion(
                user_id=user_id,
                campaign_id=campaign_id,
                required_level=required_level
            )
            db.session.add(new_completion)
            db.session.commit()




@app.route("/api/webhook-docs/<campaign_id>")
# @jwt_required
def webhook_docs(campaign_id):
    """Provide documentation for specific partner campaign"""
    campaign = PartnerCampaign.query.get(campaign_id)
    if not campaign or campaign.creator_id != current_user().id:
        return jsonify({"success": False, "message": "Campaign not found"}), 404
    
    return jsonify({
        "webhook_url": "/api/webhook/level-update",
        "method": "POST",
        "authentication": {
            "type": "Bearer Token",
            "token": campaign.webhook_token,
            "header": "Authorization: Bearer YOUR_TOKEN_HERE"
        },
        "content_type": "application/json",
        "required_fields": {
            "user_id": "Telegram user ID",
            "current_level": "User's current level in your game"
        },
        "optional_fields": {
            "username": "Telegram username (optional)",
            "game_data": "Additional game data (optional)"
        },
        "example_payload": {
            "user_id": 123456789,
            "current_level": 5,
            "username": "johndoe",
            "game_data": {"score": 1000, "achievements": ["first_win"]}
        },
        "response": {
            "success": "boolean",
            "message": "string"
        }
    })


@app.route("/api/campaign/<campaign_id>/token")
@jwt_required
def get_campaign_token(campaign_id):
    """Get the webhook token for a specific campaign"""
    campaign = PartnerCampaign.query.get(campaign_id)
    if not campaign or campaign.creator_id != current_user().id:
        return jsonify({"success": False, "message": "Campaign not found"}), 404
    
    return jsonify({
        "success": True,
        "webhook_token": campaign.webhook_token,
        "webhook_url": "/api/webhook/level-update"
    })


def check_user_started_bot(bot_username: str, user_id: int) -> bool:
    """
    Simple implementation - in production, you'd track bot starts in your database
    For now, we'll use a simple approach: check if user recently interacted with bot
    """
    # This is a placeholder - implement your actual bot start tracking logic
    return True



@app.route("/user/tasks/status")
@jwt_required
def get_user_task_status():
    user_id = request.args.get("userId")
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user ID"}), 400

    # Get all task statuses for this user
    task_statuses = db.session.execute(
        user_task_completion.select().where(
            user_task_completion.c.user_id == user_id
        )
    ).all()

    status_map = {}
    for record in task_statuses:
        status_map[record.campaign_id] = {
            "started": record.started_at is not None,
            "completed": record.completed_at is not None
        }

    return jsonify({"success": True, "taskStatuses": status_map})






# ---------------- Settings Endpoints ---------------- #

@app.route("/settings", methods=["GET"])
def get_settings():
    settings = Settings.query.first()
    if not settings:
        return jsonify({"error": "Settings not found"}), 404
    return jsonify({
        "id": settings.id,
        "auto_withdrawals": settings.auto_withdrawals
    })


#update the settings 
@app.route("/settings", methods=["PUT"])
def update_settings():
    data = request.get_json()
    settings = Settings.query.first()
    if not settings:
        settings = Settings(auto_withdrawals=data.get("auto_withdrawals", False))
        db.session.add(settings)
    else:
        if "auto_withdrawals" in data:
            settings.auto_withdrawals = data["auto_withdrawals"]
    db.session.commit()
    return jsonify({
        "id": settings.id,
        "auto_withdrawals": settings.auto_withdrawals
    })


# ---------------- AdNetwork Endpoints ---------------- #

@app.route("/ad-networks", methods=["GET"])
def list_ad_networks():
    networks = AdNetwork.query.all()
    return jsonify([{
        "id": n.id,
        "name": n.name,
        "code": n.code,
        "enabled": n.enabled
    } for n in networks])


@app.route("/ad-networks", methods=["POST"])
def create_ad_network():
    data = request.get_json()
    new_network = AdNetwork(
        name=data["name"],
        code=data["code"],
        enabled=data.get("enabled", True)
    )
    db.session.add(new_network)
    db.session.commit()
    return jsonify({
        "id": new_network.id,
        "name": new_network.name,
        "code": new_network.code,
        "enabled": new_network.enabled
    }), 201




@app.route("/ad-networks/<string:network_id>", methods=["PUT"])
def update_ad_network(network_id):
    data = request.get_json()
    network = AdNetwork.query.get_or_404(network_id)

    if "name" in data:
        network.name = data["name"]
    if "code" in data:
        network.code = data["code"]
    if "enabled" in data:
        network.enabled = data["enabled"]

    db.session.commit()
    return jsonify({
        "id": network.id,
        "name": network.name,
        "code": network.code,
        "enabled": network.enabled
    })

@app.route("/ad-networks/<string:network_id>", methods=["DELETE"])
def delete_ad_network(network_id):
    network = AdNetwork.query.get_or_404(network_id)
    db.session.delete(network)
    db.session.commit()
    return jsonify({"message": f"Ad network {network_id} deleted"}), 200




# ---------------- Example Admin Endpoints ---------------- #





# GET all daily tasks
@app.route("/daily-tasks", methods=["GET"])
def get_tasks():
    tasks = DailyTask.query.all()
    return jsonify([(task.to_dict()) for task in tasks]), 200


# Add these to your Flask app
@app.route('/admin/daily-tasks')
@jwt_required
def get_admin_daily_tasks():
    """Get all daily tasks for admin management"""
    tasks = DailyTask.query.order_by(DailyTask.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200




# GET single task
@app.route("/daily-tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = DailyTask.query.get_or_404(task_id)
    return jsonify(task.to_dict()), 200

# CREATE new task

@app.route("/daily-tasks", methods=["POST"])
def create_task():
    data = request.get_json()

    if not data or "title" not in data or "reward" not in data or "link" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    new_task = DailyTask(
        title=data["title"],
        reward=data["reward"],
        link=data["link"],
        category=data.get("category", "Daily"),
        task_type=data.get("task_type", "general"),  # ✅ new field
        status=CampaignStatus(data.get("status", "Active")),
        ad_network_id=data.get("ad_network_id"),
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_dict()), 201







@app.route('/admin/daily-tasks/<int:task_id>', methods=['DELETE'])
@jwt_required
def delete_daily_task(task_id):
    """Delete a daily task"""
    task = DailyTask.query.get_or_404(task_id)
    
    # Delete associated completions first
    db.session.execute(
        user_daily_task_completions.delete().where(
            user_daily_task_completions.c.task_id == task_id
        )
    )
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Task deleted successfully"}), 200

@app.route('/admin/daily-tasks/<int:task_id>/status', methods=['PUT'])
@jwt_required
def update_daily_task_status(task_id):
    """Update task status"""
    task = DailyTask.query.get_or_404(task_id)
    data = request.get_json()
    
    if 'status' not in data or data['status'] not in ['ACTIVE', 'PAUSED']:
        return jsonify({"success": False, "message": "Invalid status"}), 400
    
    task.status = CampaignStatus[data['status']]
    db.session.commit()
    
    return jsonify({"success": True, "message": "Status updated successfully"}), 200



# Add these endpoints to your Flask app

# Update the start_daily_task endpoint to handle different task types
@app.route("/daily-tasks/start", methods=["POST"])
@jwt_required
def start_daily_task():
    data = request.get_json()
    user_id = data.get("userId")
    task_id = data.get("taskId")

    if not user_id or not task_id:
        return jsonify({"success": False, "message": "Missing parameters"}), 400

    user = User.query.get(user_id)
    task = DailyTask.query.get(task_id)

    if not user or not task:
        return jsonify({"success": False, "message": "User or Task not found"}), 404

    # Check if already completed today
    today = datetime.utcnow().date()
    existing_completion = db.session.execute(
        user_daily_task_completions.select().where(
            (user_daily_task_completions.c.user_id == user_id) &
            (user_daily_task_completions.c.task_id == task_id) &
            (func.date(user_daily_task_completions.c.completed_at) == today) &
            (user_daily_task_completions.c.claimed == True)
        )
    ).first()

    if existing_completion:
        return jsonify({"success": False, "message": "Task already completed today"}), 400

    # Check if already started but not completed
    existing_start = db.session.execute(
        user_daily_task_completions.select().where(
            (user_daily_task_completions.c.user_id == user_id) &
            (user_daily_task_completions.c.task_id == task_id) &
            (func.date(user_daily_task_completions.c.started_at) == today) &
            (user_daily_task_completions.c.completed_at.is_(None))
        )
    ).first()

    if existing_start:
        return jsonify({"success": True, "message": "Task already started", "status": "started"})

    # For ad script tasks, we don't need to open a window, just mark as started
    # For other tasks, the frontend will handle opening the appropriate window
    db.session.execute(user_daily_task_completions.insert().values(
        user_id=user_id,
        task_id=task_id,
        started_at=datetime.utcnow()
    ))

    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Task started", 
        "status": "new"
    })

# Update the claim_daily_task endpoint to handle verification for different task types
@app.route("/daily-tasks/claim", methods=["POST"])
@jwt_required
def claim_daily_task():
    data = request.get_json()
    user_id = data.get("userId")
    task_id = data.get("taskId")

    if not user_id or not task_id:
        return jsonify({"success": False, "message": "Missing parameters"}), 400

    user = User.query.get(user_id)
    task = DailyTask.query.get(task_id)

    if not user or not task:
        return jsonify({"success": False, "message": "User or Task not found"}), 404

    # Check if task was started today
    today = datetime.utcnow().date()
    existing_record = db.session.execute(
        user_daily_task_completions.select().where(
            (user_daily_task_completions.c.user_id == user_id) &
            (user_daily_task_completions.c.task_id == task_id) &
            (func.date(user_daily_task_completions.c.started_at) == today)
        )
    ).first()

    if not existing_record:
        return jsonify({"success": False, "message": "Task not started"}), 400

    if existing_record.claimed:
        return jsonify({"success": False, "message": "Task already claimed"}), 400

    # For Telegram tasks, we might want to verify subscription/participation
    # This would require additional integration with Telegram API
    if task.task_type in ['telegram_channel', 'telegram_bot']:
        # Here you would add verification logic using Telegram API
        # For now, we'll just mark as completed
        pass

    # Update to mark as completed and claimed
    db.session.execute(
        user_daily_task_completions.update().where(
            (user_daily_task_completions.c.user_id == user_id) &
            (user_daily_task_completions.c.task_id == task_id) &
            (func.date(user_daily_task_completions.c.started_at) == today)
        ).values(
            completed_at=datetime.utcnow(),
            claimed=True
        )
    )

    # Update task completions
    task.completions += 1

    # Reward user
    user.coins += task.reward

    # Grant a spin for completing a daily task
    if user.tasks_completed_today_for_spin < 50:
        user.spins += 1
        user.tasks_completed_today_for_spin += 1

    db.session.commit()
    db.session.refresh(user)

    return jsonify({
        "success": True,
        "message": f"Task claimed! +{task.reward} coins",
        "user": user.to_dict(),
        "reward": task.reward
    })


@app.route("/user/daily-tasks/status")
@jwt_required
def get_user_daily_task_status():
    user_id = request.args.get("userId")
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user ID"}), 400

    # Get today's task statuses for this user
    today = datetime.utcnow().date()
    task_statuses = db.session.execute(
        user_daily_task_completions.select().where(
            (user_daily_task_completions.c.user_id == user_id) &
            (func.date(user_daily_task_completions.c.started_at) == today)
        )
    ).all()

    status_map = {}
    for record in task_statuses:
        status_map[record.task_id] = {
            "started": record.started_at is not None,
            "completed": record.claimed is True,
            "claimed": record.claimed
        }

    return jsonify({"success": True, "taskStatuses": status_map})





# Admin routes

# Admin role decorator

@app.route('/users', methods=['GET'])
# @jwt_required
def get_all_users():
    try:
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        banned_filter = request.args.get('banned', type=str)
        
        # Build query
        query = User.query
        
        # Apply filters
        if banned_filter is not None:
            if banned_filter.lower() == 'true':
                query = query.filter(User.banned == True)
            elif banned_filter.lower() == 'false':
                query = query.filter(User.banned == False)
        
        # Order by most recent first (assuming ID is sequential)
        query = query.order_by(User.id.desc())
        
        # Paginate results
        paginated_users = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users_data = [user.to_dict() for user in paginated_users.items]
        
        return jsonify({
            "users": users_data,
            "total": paginated_users.total,
            "pages": paginated_users.pages,
            "current_page": page
        })
        
    except Exception as e:
        app.logger.error(f"Error fetching users: {str(e)}")
        return jsonify({"error": "Failed to fetch users"}), 500


@app.route('/admin/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    try:
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict())
    except Exception as e:
        app.logger.error(f"Error fetching user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to fetch user"}), 500

@app.route('/admin/users/<int:user_id>', methods=['PUT'])


def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Update allowed fields
        allowed_fields = [
            'coins', 'ton', 'referral_earnings', 'spins', 'ad_credit',
            'ads_watched_today', 'tasks_completed_today_for_spin',
            'friends_invited_today_for_spin', 'banned', 'name'
        ]
        
        for field in allowed_fields:
            if field in data:
                if field in ['ton', 'ad_credit']:
                    # Ensure numeric values are converted properly
                    try:
                        setattr(user, field, float(data[field]))
                    except (ValueError, TypeError):
                        return jsonify({"error": f"Invalid value for {field}"}), 400
                else:
                    setattr(user, field, data[field])
        
        # Handle game progress updates
        game_progress_fields = ['space_defender_progress', 'street_racing_progress']
        for field in game_progress_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to update user"}), 500

@app.route('/admin/users/<int:user_id>/ban', methods=['PATCH'])


def toggle_user_ban(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if 'banned' not in data:
            return jsonify({"error": "banned field required"}), 400
        
        user.banned = bool(data['banned'])
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating ban status for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to update ban status"}), 500

@app.route('/admin/users/<int:user_id>/currency', methods=['PATCH'])


def update_user_currency(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        currency_fields = ['coins', 'ton', 'referral_earnings', 'spins', 'ad_credit']
        
        for field in currency_fields:
            if field in data:
                if field in ['ton', 'ad_credit']:
                    try:
                        setattr(user, field, float(data[field]))
                    except (ValueError, TypeError):
                        return jsonify({"error": f"Invalid value for {field}"}), 400
                else:
                    try:
                        setattr(user, field, int(data[field]))
                    except (ValueError, TypeError):
                        return jsonify({"error": f"Invalid value for {field}"}), 400
        
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating currency for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to update currency"}), 500

@app.route('/admin/users/<int:user_id>/game-progress', methods=['PATCH'])


def update_user_game_progress(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        game_progress_fields = ['space_defender_progress', 'street_racing_progress']
        
        for field in game_progress_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating game progress for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to update game progress"}), 500

@app.route('/admin/users/<int:user_id>/reset-daily', methods=['POST'])


def reset_user_daily_stats(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Reset daily stats
        user.ads_watched_today = 0
        user.tasks_completed_today_for_spin = 0
        user.friends_invited_today_for_spin = 0
        
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error resetting daily stats for user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to reset daily stats"}), 500

@app.route('/admin/users/search', methods=['GET'])


def search_users():
    try:
        query = request.args.get('query', '')
        field = request.args.get('field', 'name')
        
        if not query:
            return jsonify([])
        
        if field == 'id':
            # Search by ID
            try:
                user_id = int(query)
                users = User.query.filter(User.id == user_id).all()
            except ValueError:
                users = []
        elif field == 'name':
            # Search by name (case insensitive)
            users = User.query.filter(
                User.name.ilike(f'%{query}%')
            ).order_by(User.name).limit(50).all()
        else:
            return jsonify({"error": "Invalid search field"}), 400
        
        users_data = [user.to_dict() for user in users]
        return jsonify(users_data)
        
    except Exception as e:
        app.logger.error(f"Error searching users: {str(e)}")
        return jsonify({"error": "Failed to search users"}), 500

@app.route('/admin/users/bulk-update', methods=['POST'])


def bulk_update_users():
    try:
        data = request.get_json()
        
        if not data or 'userIds' not in data or 'updates' not in data:
            return jsonify({"error": "userIds and updates required"}), 400
        
        user_ids = data['userIds']
        updates = data['updates']
        
        # Validate user IDs
        if not isinstance(user_ids, list) or len(user_ids) == 0:
            return jsonify({"error": "Invalid user IDs"}), 400
        
        # Get allowed fields for bulk update
        allowed_fields = [
            'coins', 'ton', 'referral_earnings', 'spins', 'ad_credit', 'banned'
        ]
        
        # Filter updates to only allowed fields
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            return jsonify({"error": "No valid fields to update"}), 400
        
        # Update users in bulk
        updated_users = []
        for user_id in user_ids:
            user = User.query.get(user_id)
            if user:
                for field, value in filtered_updates.items():
                    if field in ['ton', 'ad_credit']:
                        setattr(user, field, float(value))
                    else:
                        setattr(user, field, value)
                updated_users.append(user)
        
        db.session.commit()
        
        # Return updated user data
        users_data = [user.to_dict() for user in updated_users]
        return jsonify(users_data)
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in bulk update: {str(e)}")
        return jsonify({"error": "Failed to bulk update users"}), 500

@app.route('/admin/users/export', methods=['GET'])


def export_users():
    try:
        format_type = request.args.get('format', 'json')
        
        # Get all users (consider pagination for large datasets)
        users = User.query.order_by(User.id).all()
        
        if format_type == 'csv':
            # Create CSV output
            output = StringIO()
            writer = csv.writer(output)
            
            # Write header
            writer.writerow([
                'ID', 'Name', 'Coins', 'TON', 'Referral Earnings', 'Spins', 
                'Ad Credit', 'Ads Watched Today', 'Tasks Completed Today',
                'Friends Invited Today', 'Banned', 'Created At'
            ])
            
            # Write data
            for user in users:
                writer.writerow([
                    user.id,
                    user.name,
                    user.coins,
                    float(user.ad_credit),
                    user.referral_earnings,
                    user.spins,
                    float(user.ad_credit),
                    user.ads_watched_today,
                    user.tasks_completed_today_for_spin,
                    user.friends_invited_today_for_spin,
                    user.banned,
                    user.created_at.isoformat() if hasattr(user, 'created_at') else ''
                ])
            
            output.seek(0)
            
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=users_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }
            )
            
        else:  # JSON format
            users_data = [user.to_dict() for user in users]
            
            return Response(
                json.dumps(users_data, indent=2),
                mimetype='application/json',
                headers={
                    'Content-Disposition': f'attachment; filename=users_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                }
            )
            
    except Exception as e:
        app.logger.error(f"Error exporting users: {str(e)}")
        return jsonify({"error": "Failed to export users"}), 500

@app.route('/admin/users/stats', methods=['GET'])


def get_user_stats():
    try:
        # Get total user count
        total_users = User.query.count()
        
        # Get active/banned counts
        active_users = User.query.filter_by(banned=False).count()
        banned_users = User.query.filter_by(banned=True).count()
        
        # Get currency totals
        total_coins = db.session.query(func.sum(User.coins)).scalar() or 0
        total_ton = db.session.query(func.sum(User.ad_credit)).scalar() or 0
        total_spins = db.session.query(func.sum(User.spins)).scalar() or 0
        
        # Get average values
        avg_coins = db.session.query(func.avg(User.coins)).scalar() or 0
        avg_ton = db.session.query(func.avg(User.ad_credit)).scalar() or 0
        
        return jsonify({
            "total_users": total_users,
            "active_users": active_users,
            "banned_users": banned_users,
            "total_coins": total_coins,
            "total_ton": float(total_ton),
            "total_spins": total_spins,
            "avg_coins": float(avg_coins),
            "avg_ton": float(avg_ton)
        })
        
    except Exception as e:
        app.logger.error(f"Error getting user stats: {str(e)}")
        return jsonify({"error": "Failed to get user statistics"}), 500

# Add created_at field to User model if not exists
# class User(db.Model):
#     # ... existing fields ...
#     created_at = db.Column(db.DateTime, default=db.func.current_timestamp())



@app.route('/api/referral/claim', methods=['POST'])
@jwt_required
def claim_referral_earnings():
    try:
        data = request.get_json()
        user_id_from_request = data.get('userId')
        
        # Validate that the JWT user matches the requested user
        
        if not user_id_from_request:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        
        # Get user from database
        user = User.query.get(user_id_from_request)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        if user.referral_earnings <= 0:
            return jsonify({"success": False, "message": "No earnings to claim"}), 400
        
        # Transfer earnings to main coins
        earnings = user.referral_earnings
        user.coins += earnings
        user.referral_earnings = 0  # Reset to zero after claiming
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Claimed {earnings} coins from referrals",
            "user": user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error claiming referral earnings: {e}")
        return jsonify({"success": False, "message": "Internal server error"}), 500

@app.route('/api/referral/invite', methods=['POST'])
@jwt_required
def invite_friend_for_spin():
    user_id = request.json.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "user_id is required"}), 400
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
        
    # Check daily limit
    if user.friends_invited_today_for_spin >= 50:
        return jsonify({
            "success": False, 
            "message": "Daily invite limit reached (50 per day)"
        }), 400
    
    # Award spin for sharing
    # user.spins += 1
    # user.friends_invited_today_for_spin += 1
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": "Thanks for sharing! +1 Spin!",
        "user": user.to_dict()
    })

@app.route('/api/referral/friends')
@jwt_required
def get_referral_friends():
    try:
        # Get user_id from query parameter
        user_id = request.args.get('user_id', type=int)
        
        # Validate user_id
        if not user_id:
            return jsonify({"success": False, "message": "Missing user_id"}), 400
        
        # SECURITY: Verify the requesting user matches the JWT user
       
        # Get user from database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Get users referred by this user with a single optimized query
        referred_users = User.query.filter_by(referred_by=user.id).all()
        
        # Get all referral records for this user in one query
        referral_records = Referral.query.filter_by(referrer_id=user.id).all()
        
        # Create a mapping of referred_id -> earnings for quick lookup
        earnings_map = {record.referred_id: record.earnings_generated for record in referral_records}
        
        friends_list = []
        for friend in referred_users:
            # Use get() with default to avoid KeyError
            earnings = earnings_map.get(friend.id, 0)
            
            # Handle missing created_at field gracefully
            joined_at = None
            if hasattr(friend, 'created_at') and friend.created_at:
                joined_at = friend.created_at.isoformat()
            elif hasattr(friend, 'joined_at') and friend.joined_at:  # Alternative field name
                joined_at = friend.joined_at.isoformat()
            
            friends_list.append({
                "id": friend.id,
                "name": friend.name,
                "joined_at": joined_at,
                "earnings_generated": earnings
            })
        
        return jsonify({
            "success": True,
            "friends": friends_list,
            "total_count": len(referred_users)
        })
        
    except Exception as e:
        print(f"Error in get_referral_friends: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error"
        }), 500


@app.route('/api/referral/info')
@jwt_required
def get_referral_info():
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"success": False, "error": "user_id is required"}), 400
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
        
    # Get your bot username from environment or config
    bot_username = os.getenv('TELEGRAM_BOT_USERNAME', 'CashUBux_bot')
    
    # CORRECT FORMAT for Telegram Mini Apps:
    referral_link = f"https://t.me/{bot_username}?startapp=ref_{user.id}"
    
    return jsonify({
        "success": True,
        "referral_code": str(user.id),
        "referral_link": referral_link,
        "referral_count": user.referral_count,
        "claimable_earnings": user.referral_earnings,  # This will now be consistent
        "total_earnings": user.total_referral_earnings,
        "spins_awarded": getattr(user, 'referral_spins_awarded', 0),  # Add if you implemented it
        "today_invites": user.friends_invited_today_for_spin,
        "max_daily_invites": 50
    })


# def award_referral_earnings(user_id: int, task_reward: int):
#     """Award 10% of task rewards to referrer"""
#     user = User.query.get(user_id)
#     if not user or not user.referred_by:
#         return
    
#     referrer = User.query.get(user.referred_by)
#     if not referrer:
#         return
    
#     referral_bonus = int(task_reward * 0.10)  # 10% commission
    
#     # Update referrer's earnings
#     referrer.referral_earnings += referral_bonus
    
#     # Update referral record
#     referral = Referral.query.filter_by(
#         referrer_id=referrer.id,
#         referred_id=user.id
#     ).first()
    
#     if referral:
#         referral.earnings_generated += referral_bonus
    
#     db.session.commit()


def award_referral_earnings(user_id: int, task_reward: int):
    """Award 10% of task rewards to referrer (to be claimed later) AND give them 1 spin immediately"""
    user = User.query.get(user_id)
    if not user or not user.referred_by:
        return
    
    referrer = User.query.get(user.referred_by)
    if not referrer:
        return
    
    referral_bonus = int(task_reward * 0.10)  # 10% commission
    
    # Update referrer's earnings (to be claimed later)
    referrer.referral_earnings += referral_bonus
    referrer.total_referral_earnings += referral_bonus
    
    # Award 1 spin immediately (not claimable, given right away)
    referrer.spins += 1
    
    # Update referral record
    referral = Referral.query.filter_by(
        referrer_id=referrer.id,
        referred_id=user.id
    ).first()
    
    if referral:
        referral.earnings_generated += referral_bonus
    
    db.session.commit()
    
    print(f"🎯 Referral bonus: {referrer.name} earned {referral_bonus} coins (to claim) + 1 spin (immediate) from {user.name}'s task")



@app.route('/admin/daily-reset', methods=['POST'])
def daily_reset():
    """Reset daily counters (should be called by a cron job)"""
    try:
        # Reset all users' daily counters
        User.query.update({
            User.ads_watched_today: 0,
            User.tasks_completed_today_for_spin: 0,
            User.friends_invited_today_for_spin: 0
        })
        
        db.session.commit()
        return jsonify({"success": True, "message": "Daily counters reset"})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500    







@app.route('/user/deposit-ad-credit', methods=['POST'])
@jwt_required
def deposit_ad_credit():
    data = request.get_json()
    
    user_id = data.get('user_id')
    amount = data.get('amount')

    if not user_id or not isinstance(user_id, int):
        return jsonify({
            "success": False,
            "message": "User ID is required and must be an integer"
        }), 400

    if not amount or amount <= 0:
        return jsonify({
            "success": False,
            "message": "Invalid amount"
        }), 400

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        # Convert to Decimal for precise calculations
        deposit_amount = Decimal(str(amount))

        # Update user's ad credit balance
        user.ad_credit += deposit_amount

        # Create transaction record
        transaction = Transaction(
            id=f"deposit_{int(datetime.now().timestamp())}_{user.id}",
            user_id=user.id,
            type=TransactionType.DEPOSIT,
            amount=deposit_amount,
            currency=TransactionCurrency.TON,
            status=TransactionStatus.COMPLETED
        )
        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Deposit successful",
            "user": user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Deposit error: {e}")
        return jsonify({
            "success": False,
            "message": "Deposit failed"
        }), 500


#real implemnetaion 
# @app.route('/api/user/deposit-ad-credit', methods=['POST'])
# @jwt_required
# def deposit_ad_credit():
#     data = request.get_json()
#     user = current_user()
    
#     amount = data.get('amount')
#     if not amount or amount <= 0:
#         return jsonify({
#             "success": False,
#             "message": "Invalid amount"
#         }), 400
    
#     try:
#         # In a real implementation, you would:
#         # 1. Verify the user actually sent the TON to your wallet
#         # 2. Check blockchain confirmation
#         # 3. Then update the balance
        
#         # For simulation/demo purposes, we'll just update the balance
#         deposit_amount = Decimal(str(amount))
        
#         # Check if user has enough TON balance (if deducting from main balance)
#         if user.ton < deposit_amount:
#             return jsonify({
#                 "success": False,
#                 "message": "Insufficient TON balance"
#             }), 400
        
#         # Transfer from TON balance to ad credit
#         user.ton -= deposit_amount
#         user.ad_credit += deposit_amount
        
#         # Create transaction record
#         transaction = Transaction(
#             id=f"deposit_ad_{int(datetime.now().timestamp())}_{user.id}",
#             user_id=user.id,
#             type=TransactionType.TRANSFER,
#             amount=deposit_amount,
#             currency=TransactionCurrency.TON,
#             status=TransactionStatus.COMPLETED,
#             description=f"Transferred to ad credit"
#         )
#         db.session.add(transaction)
        
#         db.session.commit()
        
#         return jsonify({
#             "success": True,
#             "message": "Deposit successful",
#             "user": user.to_dict()
#         })
        
#     except Exception as e:
#         db.session.rollback()
#         print(f"Deposit error: {e}")
#         return jsonify({
#             "success": False,
#             "message": "Deposit failed"
#         }), 500        













# Add these endpoints to your app.py

@app.route('/api/spin', methods=['POST'])
@jwt_required
def spin_wheel():
    """Handle wheel spin and award prizes"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID required"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Check if user has spins
        if user.spins <= 0:
            return jsonify({
                "success": False, 
                "message": "No spins left", 
                "prize": {"label": "No spins", "value": 0, "type": "coins"}
            }), 400
        
        # Deduct spin
        user.spins -= 1
        
        # Determine prize (weighted random) - Updated to match frontend wheel
        prizes = [
            {"label": "100 Coins", "value": 100, "type": "coins", "weight": 25},
            {"label": "250 Coins", "value": 250, "type": "coins", "weight": 20},
            {"label": "500 Coins", "value": 500, "type": "coins", "weight": 12},
            {"label": "1000 Coins", "value": 1000, "type": "coins", "weight": 8},
            {"label": "1 Spin", "value": 1, "type": "spins", "weight": 15},
            {"label": "2 Spins", "value": 2, "type": "spins", "weight": 8},
            {"label": "5 Spins", "value": 5, "type": "spins", "weight": 3},
            {"label": "0.001 TON", "value": 0.001, "type": "ton", "weight": 4},
            {"label": "0.005 TON", "value": 0.005, "type": "ton", "weight": 2},
            {"label": "0.01 TON", "value": 0.01, "type": "ton", "weight": 1},
            {"label": "Better luck!", "value": 0, "type": "none", "weight": 1},  # Very rare "bad luck"
            {"label": "Jackpot!", "value": 2000, "type": "coins", "weight": 1}   # Very rare jackpot
        ]
        
        # Weighted random selection
        total_weight = sum(prize["weight"] for prize in prizes)
        random_value = random.uniform(0, total_weight)
        current_weight = 0
        
        selected_prize = None
        for prize in prizes:
            current_weight += prize["weight"]
            if random_value <= current_weight:
                selected_prize = prize
                break
        
        # Award prize based on type
        if selected_prize["type"] == "coins":
            user.coins += selected_prize["value"]
            # Add bonus for jackpot
            if selected_prize["label"] == "Jackpot!":
                user.spins += 5  # Bonus spins for jackpot
                
        elif selected_prize["type"] == "spins":
            user.spins += selected_prize["value"]
            
        elif selected_prize["type"] == "ton":
            # Assuming you have a TON balance field or using ad_credit for TON
            if hasattr(user, 'ton_balance'):
                user.ton_balance += Decimal(str(selected_prize["value"]))
            else:
                user.ad_credit += Decimal(str(selected_prize["value"]))
                
        # For "none" type (Better luck!), no award is given
        
        # Record spin history
        spin_record = SpinHistory(
            user_id=user.id,
            prize_type=selected_prize["type"],
            prize_value=selected_prize["value"],
            prize_label=selected_prize["label"]
        )
        db.session.add(spin_record)
        
        db.session.commit()
        
        # Prepare response message based on prize type
        if selected_prize["type"] == "none":
            message = "Better luck next time!"
        elif selected_prize["label"] == "Jackpot!":
            message = "🎉 JACKPOT! You won 2000 Coins + 5 bonus spins! 🎉"
        else:
            message = f"Congratulations! You won {selected_prize['label']}"
        
        return jsonify({
            "success": True,
            "prize": selected_prize,
            "user": user.to_dict(),
            "message": message
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Spin error: {e}")
        return jsonify({"success": False, "message": "Spin failed"}), 500
@app.route('/api/spin/watch-ad', methods=['POST'])
@jwt_required
def watch_ad_for_spin():
    """Handle ad watching for spin rewards"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID required"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        # Check daily limit
        if user.ads_watched_today >= 50:
            return jsonify({
                "success": False, 
                "message": "Daily ad limit reached (50 per day)"
            }), 400
        
        # Award spin for watching ad
        user.spins += 1
        user.ads_watched_today += 1
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Thanks for watching! +1 Spin!",
            "user": user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Ad watch error: {e}")
        return jsonify({"success": False, "message": "Failed to process ad"}), 500







@app.route('/api/spin/history')
@jwt_required
def get_spin_history():
    """Get user's spin history"""
    try:
        user_id = request.args.get('userId', type=int)
        limit = request.args.get('limit', 20, type=int)
        
        if not user_id:
            return jsonify({"success": False, "message": "User ID required"}), 400
        
        # Get spin history with pagination
        spin_history = SpinHistory.query.filter_by(user_id=user_id)\
            .order_by(SpinHistory.created_at.desc())\
            .limit(limit)\
            .all()
        
        history_list = [{
            "prize_label": spin.prize_label,
            "prize_type": spin.prize_type,
            "prize_value": spin.prize_value,
            "created_at": spin.created_at.isoformat()
        } for spin in spin_history]
        
        return jsonify({
            "success": True,
            "history": history_list,
            "total": len(history_list)
        })
        
    except Exception as e:
        print(f"Spin history error: {e}")
        return jsonify({"success": False, "message": "Failed to get spin history"}), 500





# Add these constants to your app.py or config.py

# Spin store packages
SPIN_STORE_PACKAGES = [
    {"id": "sp10", "spins": 10, "costTon": 0.02},
    {"id": "sp50", "spins": 50, "costTon": 0.1},
    {"id": "sp100", "spins": 100, "costTon": 0.2},
    {"id": "sp500", "spins": 500, "costTon": 1.0},
    {"id": "sp1000", "spins": 1000, "costTon": 2.0},
    {"id": "sp5000", "spins": 5000, "costTon": 10.0},
    {"id": "sp10000", "spins": 10000, "costTon": 20.0},
    {"id": "sp50000", "spins": 50000, "costTon": 100.0}
]


# Conversion rate (coins to TON)
CONVERSION_RATE = 1000000  # 1 TON = 1,000,000 coins

# Recipient wallet address from environment
RECIPIENT_WALLET_ADDRESS = os.getenv('RECIPIENT_WALLET_ADDRESS')        

@app.route('/api/spin/buy', methods=['POST'])
@jwt_required
def buy_spins():
    """Purchase spins using coins, in-app TON, or blockchain TON"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        package_id = data.get('packageId')
        payment_method = data.get('paymentMethod')
        transaction_hash = data.get('transactionHash')  # For blockchain transactions
        
        if not user_id or not package_id or not payment_method:
            return jsonify({"success": False, "message": "Missing parameters"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        spin_package = next((pkg for pkg in SPIN_STORE_PACKAGES if pkg['id'] == package_id), None)
        if not spin_package:
            return jsonify({"success": False, "message": "Invalid package"}), 400
        
        transactions = []  # List to store multiple transaction records
        message = ""
        spins_to_add = spin_package['spins']
        
        if payment_method == 'COINS':
            cost_in_coins = spin_package['costTon'] * CONVERSION_RATE
            
            if user.coins < cost_in_coins:
                return jsonify({"success": False, "message": "Insufficient coins"}), 400
            
            user.coins -= cost_in_coins
            
            # Transaction for coins spent
            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_in_coins),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.COINS,
                status=TransactionStatus.COMPLETED,
                description=f"Spent on {spin_package['spins']} spins"
            ))
            
            message = f"Purchased {spins_to_add} spins for {cost_in_coins:,} coins"
            
        elif payment_method == 'TON':
            cost_in_ton = Decimal(str(spin_package['costTon']))
            
            if user.ad_credit< cost_in_ton:
                return jsonify({"success": False, "message": "Insufficient TON balance"}), 400
            
            user.ad_credit -= cost_in_ton
            
            # Transaction for TON spent
            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_in_ton),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.TON,
                status=TransactionStatus.COMPLETED,
                description=f"Spent on {spin_package['spins']} spins"
            ))
            
            message = f"Purchased {spins_to_add} spins for {spin_package['costTon']} TON"
            
        elif payment_method == 'TON_BLOCKCHAIN':
            # For blockchain transactions, add bonus
            bonus_spins = int(spin_package['spins'] * 0.1)
            spins_to_add += bonus_spins
            
            # Transaction for blockchain payment (optional - you might track this separately)
            if transaction_hash:
                transactions.append(Transaction(
                    user_id=user.id,
                    amount=Decimal(-spin_package['costTon']),
                    transaction_type=TransactionType.WITHDRAWAL,
                    currency=TransactionCurrency.TON,
                    status=TransactionStatus.COMPLETED,
                    description=f"Blockchain payment for spins - Hash: {transaction_hash}"
                ))
            
            message = f"Purchased {spin_package['spins']} spins + {bonus_spins} bonus via blockchain"
            
        else:
            return jsonify({"success": False, "message": "Invalid payment method"}), 400
        
        # Add spins to user
        user.spins += spins_to_add
        
        # Transaction for spins received
        transactions.append(Transaction(
            user_id=user.id,
            amount=Decimal(spins_to_add),
            transaction_type=TransactionType.DEPOSIT,
            currency=TransactionCurrency.COINS,  # Spins are tracked as coins equivalent
            status=TransactionStatus.COMPLETED,
            description=f"Received {spins_to_add} spins purchase"
        ))
        
        # Add all transactions to session
        for transaction in transactions:
            db.session.add(transaction)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": message,
            "user": user.to_dict(),
            "transaction_ids": [t.id for t in transactions]
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Spin purchase error: {e}")
        return jsonify({"success": False, "message": "Purchase failed"}), 500



@app.route('/api/withdraw/ton', methods=['POST'])
@jwt_required
def withdraw_ton():
    data = request.get_json()
    amount = data.get("amount")
    transaction_hash = data.get("transactionHash")
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"success": False, "message": "Missing userId"}), 400

    # Look up user by ID
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if amount is None or amount <= 0:
        return jsonify({"success": False, "message": "Invalid withdrawal amount"}), 400

    if user.ton < amount:
        return jsonify({"success": False, "message": "Insufficient TON balance"}), 400

    # Deduct TON from user balance
    user.ton -= amount

    # Save withdrawal record (optional: you probably have a Transaction model)
    from models import Transaction
    tx = Transaction(
        user_id=user.id,
        type="withdrawal",
        amount=amount,
        currency="TON",
        status="Completed",
        tx_hash=transaction_hash
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Successfully withdrew {amount} TON",
        "user": user.to_dict()
    })
