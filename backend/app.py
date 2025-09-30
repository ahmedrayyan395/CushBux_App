# models.py
import asyncio
import csv
from decimal import Decimal
import enum
from io import StringIO
import os
import random
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from sqlalchemy import or_



import secrets
from sqlite3 import IntegrityError
import string
# models.py
import aiohttp
import bcrypt
import jwt as pyjwt  # Rename PyJWT to avoid conflict
import requests
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
JWT_SECRET = os.environ.get('JWT_SECRET', 'cashubux-admin-secret-key-2025')
JWT_ALGORITHM = 'HS256'
jwt = JWTManager(app)

# app.register_blueprint(admin_management, url_prefix='/admin')



app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mini_telegram_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'cashubux-admin-secret-key-2025'


from flask_bcrypt import Bcrypt


db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt()
jwt = JWTManager()


# from datetime import datetime
from flask.cli import with_appcontext
import click

@app.cli.command("seed-users")
@with_appcontext
def seed_users():
    """Seed some demo users into the database."""

    users = [
        User(
            id=2,   # Telegram ID
            name="Alice",
            coins=50000000,
            ton=0,
            referral_earnings=0,
            spins=5,
            ad_credit=177.0,
            ads_watched_today=2,
            tasks_completed_today_for_spin=1,
            friends_invited_today_for_spin=0,
            language_code="en",  # English user
            space_defender_progress={"weaponLevel": 2, "shieldLevel": 1, "speedLevel": 1},
            street_racing_progress={"currentCar": 2, "unlockedCars": [1, 2], "carUpgrades": {}, "careerPoints": 50, "adProgress": {"engine": 1, "tires": 0, "nitro": 0}},
            banned=False
        ),
        User(
            id=3,   # Telegram ID
            name="أحمد",  # Arabic name
            coins=50000000,
            ton=125,
            referral_earnings=0,
            spins=522,
            ad_credit=111.0,
            ads_watched_today=2,
            tasks_completed_today_for_spin=1,
            friends_invited_today_for_spin=0,
            language_code="ar",  # Arabic user
            space_defender_progress={"weaponLevel": 2, "shieldLevel": 1, "speedLevel": 1},
            street_racing_progress={"currentCar": 2, "unlockedCars": [1, 2], "carUpgrades": {}, "careerPoints": 50, "adProgress": {"engine": 1, "tires": 0, "nitro": 0}},
            banned=False
        ),
        User(
            id=4,   # Telegram ID
            name="vgg",  # Arabic name
            coins=50000000,
            ton=125,
            referral_earnings=0,
            spins=522,
            ad_credit=111.0,
            ads_watched_today=2,
            tasks_completed_today_for_spin=1,
            friends_invited_today_for_spin=0,
            language_code="en",  # Arabic user
            space_defender_progress={"weaponLevel": 2, "shieldLevel": 1, "speedLevel": 1},
            street_racing_progress={"currentCar": 2, "unlockedCars": [1, 2], "carUpgrades": {}, "careerPoints": 50, "adProgress": {"engine": 1, "tires": 0, "nitro": 0}},
            banned=False
        ),
    ]

    db.session.add_all(users)
    db.session.commit()
    click.echo("✅ Users seeded successfully")





@app.cli.command("seed-system-users")
@with_appcontext
def seed_system_users():
    """Seed demo system users into the database."""
    
    # Check if users already exist to avoid duplicates
    existing_users = SystemUser.query.all()
    if existing_users:
        click.echo("⚠️  System users already exist. Skipping seeding.")
        return

    system_users = [
        SystemUser(
            username="superadmin",
            email="superadmin@cashubux.com",
            password="SuperAdmin123!",
            first_name="System",
            last_name="Administrator",
            role=UserRole.SUPER_ADMIN,
            created_by=None  # This is the first user
        ),
        SystemUser(
            username="admin",
            email="admin@cashubux.com",
            password="Admin123!",
            first_name="John",
            last_name="Admin",
            role=UserRole.ADMIN,
            created_by=1  # Created by superadmin
        ),
        SystemUser(
            username="moderator1",
            email="moderator1@cashubux.com",
            password="Moderator123!",
            first_name="Sarah",
            last_name="Moderator",
            role=UserRole.MODERATOR,
            created_by=1
        ),
        SystemUser(
            username="moderator2",
            email="moderator2@cashubux.com",
            password="Moderator123!",
            first_name="Mike",
            last_name="Coordinator",
            role=UserRole.MODERATOR,
            created_by=2
        ),
        SystemUser(
            username="support1",
            email="support1@cashubux.com",
            password="Support123!",
            first_name="Emily",
            last_name="Support",
            role=UserRole.SUPPORT,
            created_by=1
        ),
        SystemUser(
            username="viewer1",
            email="viewer1@cashubux.com",
            password="Viewer123!",
            first_name="David",
            last_name="Viewer",
            role=UserRole.VIEWER,
            created_by=2
        ),
        SystemUser(
            username="auditor",
            email="auditor@cashubux.com",
            password="Auditor123!",
            first_name="Lisa",
            last_name="Auditor",
            role=UserRole.VIEWER,
            created_by=1
        )
    ]

    try:
        db.session.add_all(system_users)
        db.session.commit()
        click.echo("✅ System users seeded successfully!")
        click.echo("📋 Demo credentials:")
        click.echo("   Super Admin: superadmin / SuperAdmin123!")
        click.echo("   Admin: admin / Admin123!")
        click.echo("   Moderator: moderator1 / Moderator123!")
        click.echo("   Support: support1 / Support123!")
        click.echo("   Viewer: viewer1 / Viewer123!")
        
    except Exception as e:
        db.session.rollback()
        click.echo(f"❌ Error seeding system users: {str(e)}")




@app.cli.command("seed-quests")
@with_appcontext
def seed_quests():
    """Initialize default quests in the database"""
    
    default_quests = [
        # Invite Friends
        {
            'id': 'q_invite_300',
            'title': 'Invite 300 friends',
            'icon': '👥',
            'reward': 300000,
            'total_progress': 300,
            'quest_type': 'invite',
            'is_active': True
        },
        
        # Game Tasks (Tiered)
        {'id': 'q_game_10', 'title': 'Complete 10 game tasks', 'icon': '🎮', 'reward': 10000, 'total_progress': 10, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_25', 'title': 'Complete 25 game tasks', 'icon': '🎮', 'reward': 25000, 'total_progress': 25, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_50', 'title': 'Complete 50 game tasks', 'icon': '🎮', 'reward': 50000, 'total_progress': 50, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_100', 'title': 'Complete 100 game tasks', 'icon': '🎮', 'reward': 100000, 'total_progress': 100, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_500', 'title': 'Complete 500 game tasks', 'icon': '🎮', 'reward': 500000, 'total_progress': 500, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_1000', 'title': 'Complete 1,000 game tasks', 'icon': '🎮', 'reward': 1000000, 'total_progress': 1000, 'quest_type': 'game', 'is_active': True},
        {'id': 'q_game_2500', 'title': 'Complete 2,500 game tasks', 'icon': '🎮', 'reward': 2500000, 'total_progress': 2500, 'quest_type': 'game', 'is_active': True},

        # Social Tasks (Tiered)
        {'id': 'q_social_10', 'title': 'Complete 10 social tasks', 'icon': '📱', 'reward': 10000, 'total_progress': 10, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_25', 'title': 'Complete 25 social tasks', 'icon': '📱', 'reward': 25000, 'total_progress': 25, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_50', 'title': 'Complete 50 social tasks', 'icon': '📱', 'reward': 50000, 'total_progress': 50, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_100', 'title': 'Complete 100 social tasks', 'icon': '📱', 'reward': 100000, 'total_progress': 100, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_500', 'title': 'Complete 500 social tasks', 'icon': '📱', 'reward': 500000, 'total_progress': 500, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_1000', 'title': 'Complete 1,000 social tasks', 'icon': '📱', 'reward': 1000000, 'total_progress': 1000, 'quest_type': 'social', 'is_active': True},
        {'id': 'q_social_2500', 'title': 'Complete 2,500 social tasks', 'icon': '📱', 'reward': 2500000, 'total_progress': 2500, 'quest_type': 'social', 'is_active': True},

        # Partner Tasks (Tiered)
        {'id': 'q_partner_10', 'title': 'Complete 10 partner tasks', 'icon': '🎁', 'reward': 100000, 'total_progress': 10, 'quest_type': 'partner', 'is_active': True},
        {'id': 'q_partner_25', 'title': 'Complete 25 partner tasks', 'icon': '🎁', 'reward': 250000, 'total_progress': 25, 'quest_type': 'partner', 'is_active': True},
        {'id': 'q_partner_50', 'title': 'Complete 50 partner tasks', 'icon': '🎁', 'reward': 500000, 'total_progress': 50, 'quest_type': 'partner', 'is_active': True},
        {'id': 'q_partner_100', 'title': 'Complete 100 partner tasks', 'icon': '🎁', 'reward': 1200000, 'total_progress': 100, 'quest_type': 'partner', 'is_active': True},
    ]
    
    created_count = 0
    updated_count = 0
    
    for quest_data in default_quests:
        # Check if quest already exists
        existing_quest = Quest.query.get(quest_data['id'])
        if not existing_quest:
            quest = Quest(
                id=quest_data['id'],
                title=quest_data['title'],
                icon=quest_data['icon'],
                reward=quest_data['reward'],
                total_progress=quest_data['total_progress'],
                quest_type=quest_data['quest_type'],
                is_active=quest_data['is_active']
            )
            db.session.add(quest)
            created_count += 1
        else:
            # Update existing quest if needed
            existing_quest.title = quest_data['title']
            existing_quest.icon = quest_data['icon']
            existing_quest.reward = quest_data['reward']
            existing_quest.total_progress = quest_data['total_progress']
            existing_quest.quest_type = quest_data['quest_type']
            existing_quest.is_active = quest_data['is_active']
            updated_count += 1
    
    db.session.commit()
    click.echo(f"✅ Quests seeded successfully! Created: {created_count}, Updated: {updated_count}")
# --- Enums defined from TypeScript interfaces ---

class TransactionType(enum.Enum):
    WITHDRAWAL = 'Withdrawal'
    DEPOSIT = 'Deposit'


class TransactionCurrency(enum.Enum):
    TON = 'TON'
    COINS = 'Coins'
    SPINS = 'Spins'  # fix capitalization for consistency


class TransactionStatus(enum.Enum):
    COMPLETED = 'Completed'
    PENDING = 'Pending'
    FAILED = 'Failed'
    PROCESSING='PROCESSING'


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(20, 9), nullable=False)
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    currency = db.Column(db.Enum(TransactionCurrency), nullable=False)
    status = db.Column(db.Enum(TransactionStatus), nullable=False, default=TransactionStatus.COMPLETED)
    description = db.Column(db.String(255))
    transaction_id_on_blockchain = db.Column(db.String(255), nullable=True)  # NEW FIELD
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('transactions', lazy='dynamic'))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": float(self.amount),  # convert Decimal -> float for JSON
            "transaction_type": self.transaction_type.value,
            "currency": self.currency.value,
            "status": self.status.value,
            "description": self.description,
            "transaction_id_on_blockchain": self.transaction_id_on_blockchain,
            "created_at": self.created_at.isoformat()
        }



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


# models.py
# models.py
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    # Wallet address for withdrawals
    wallet_address = db.Column(db.String(255), nullable=True)
    
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

    # Language preference (from Telegram)
    language_code = db.Column(db.String(10), nullable=False, default='en')
    
    # Game Progress stored as JSON
    space_defender_progress = db.Column(JSON, nullable=False, default=lambda: {"weaponLevel": 1, "shieldLevel": 1, "speedLevel": 1})
    street_racing_progress = db.Column(JSON, nullable=False, default=lambda: {"currentCar": 1, "unlockedCars": [1], "carUpgrades": {}, "careerPoints": 0, "adProgress": {"engine": 0, "tires": 0, "nitro": 0}})

    # Quest Progress Tracking
    total_game_tasks_completed = db.Column(db.Integer, nullable=False, default=0)
    total_social_tasks_completed = db.Column(db.Integer, nullable=False, default=0)
    total_partner_tasks_completed = db.Column(db.Integer, nullable=False, default=0)
    total_friends_invited = db.Column(db.Integer, nullable=False, default=0)
    
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

    # Referral tracking
    referred_by = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=True)
    referral_count = db.Column(db.Integer, default=0)
    total_referral_earnings = db.Column(db.BigInteger, default=0)

    # Quest relationships
    quest_progress = db.relationship('UserQuestProgress', back_populates='user', lazy='dynamic')
    claimed_quests = db.relationship('ClaimedQuest', back_populates='user', lazy='dynamic')
    
    # Relationships
    referrals = db.relationship('User',
                                foreign_keys=[referred_by],
                                backref=db.backref('referrer', remote_side=[id]))
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "coins": self.coins,
            "wallet_address": self.wallet_address,  # Add this line
            "ton": float(self.ton),
            "referral_earnings": self.referral_earnings,
            "spins": self.spins,
            "ad_credit": float(self.ad_credit),
            "ads_watched_today": self.ads_watched_today,
            "tasks_completed_today_for_spin": self.tasks_completed_today_for_spin,
            "friends_invited_today_for_spin": self.friends_invited_today_for_spin,
            "language_code": self.language_code,
            "space_defender_progress": self.space_defender_progress,
            "street_racing_progress": self.street_racing_progress,
            "banned": self.banned,
            "friends": [friend.id for friend in self.friends],
            "referral_count": self.referral_count,
            "total_referral_earnings": self.total_referral_earnings,
            "referred_by": self.referred_by,
            "total_game_tasks_completed": self.total_game_tasks_completed,
            "total_social_tasks_completed": self.total_social_tasks_completed,
            "total_partner_tasks_completed": self.total_partner_tasks_completed,
            "total_friends_invited": self.total_friends_invited,
        }

# Quest Models
class Quest(db.Model):
    __tablename__ = 'quests'
    
    
    id = db.Column(db.String(50), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), nullable=False)
    reward = db.Column(db.BigInteger, nullable=False)
    total_progress = db.Column(db.Integer, nullable=False)
    quest_type = db.Column(db.String(20), nullable=False)  # 'game', 'social', 'partner', 'invite'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_entries = db.relationship('UserQuestProgress', back_populates='quest')
    claimed_entries = db.relationship('ClaimedQuest', back_populates='quest')

class UserQuestProgress(db.Model):
    __tablename__ = 'user_quest_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    quest_id = db.Column(db.String(50), db.ForeignKey('quests.id'), nullable=False)
    current_progress = db.Column(db.Integer, nullable=False, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='quest_progress')
    quest = db.relationship('Quest', back_populates='progress_entries')
    
    __table_args__ = (db.UniqueConstraint('user_id', 'quest_id', name='_user_quest_uc'),)

class ClaimedQuest(db.Model):
    __tablename__ = 'claimed_quests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    quest_id = db.Column(db.String(50), db.ForeignKey('quests.id'), nullable=False)
    claimed_at = db.Column(db.DateTime, default=datetime.utcnow)
    reward_received = db.Column(db.BigInteger, nullable=False)
    
    # Relationships
    user = db.relationship('User', back_populates='claimed_quests')
    quest = db.relationship('Quest', back_populates='claimed_entries')
    
    __table_args__ = (db.UniqueConstraint('user_id', 'quest_id', name='_user_claimed_quest_uc'),)






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
    link = db.Column(db.String, nullable=False)  # Title field removed
    
    status = db.Column(db.Enum(CampaignStatus), default=CampaignStatus.ACTIVE)
    completions = db.Column(db.Integer, default=0)
    goal = db.Column(db.Integer, nullable=False)  # number of users
    cost = db.Column(db.Numeric(12, 4), nullable=False)  # how many coins claimed
    category = db.Column(db.Enum(TaskCategory), nullable=False)
    
    # New field for subscription validation
    check_subscription = db.Column(db.Boolean, default=False)
    
    # Field for storing languages as JSON array (replacing title)
    langs = db.Column(db.JSON, nullable=False, default=[])  # Store as array like ['en', 'es', 'fr']
    
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
            'check_subscription': self.check_subscription,
            'langs': self.langs,  # Include the langs field
            'type': self.type
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




# models.py


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






#Admin models
class UserRole(enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    SUPPORT = "support"
    VIEWER = "viewer"

class UserStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"

class SystemUser(db.Model):
    __tablename__ = 'system_users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    status = db.Column(db.Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    permissions = db.Column(db.JSON, nullable=False, default=list)  # Store as JSON array
    last_login = db.Column(db.DateTime, nullable=True)
    login_attempts = db.Column(db.Integer, default=0)
    must_change_password = db.Column(db.Boolean, default=False)
    timezone = db.Column(db.String(50), default='UTC')
    language = db.Column(db.String(10), default='en')
    
    # Audit fields
    created_by = db.Column(db.Integer, db.ForeignKey('system_users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_password_change = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('SystemUser', remote_side=[id], backref='created_users')
    
    def __init__(self, username, email, password, first_name=None, last_name=None, 
                 role=UserRole.VIEWER, permissions=None, created_by=None):
        self.username = username
        self.email = email
        self.set_password(password)
        self.first_name = first_name
        self.last_name = last_name
        self.role = role
        self.permissions = permissions or self.get_default_permissions(role)
        self.created_by = created_by
        self.last_password_change = datetime.utcnow()

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        self.last_password_change = datetime.utcnow()

    def check_password(self, password):
        """Verify password"""
        return bcrypt.check_password_hash(self.password_hash, password)

    def get_default_permissions(self, role):
        """Get default permissions based on role"""
        role_permissions = {
            UserRole.SUPER_ADMIN: ['all'],
            UserRole.ADMIN: ['dashboard', 'users', 'tasks', 'promocodes', 'settings', 'questadmin'],
            UserRole.MODERATOR: ['dashboard', 'users', 'tasks'],
            UserRole.SUPPORT: ['dashboard', 'users'],
            UserRole.VIEWER: ['dashboard']
        }
        return role_permissions.get(role, ['dashboard'])

    def has_permission(self, permission):
        """Check if user has specific permission"""
        return 'all' in self.permissions or permission in self.permissions

    def can_access_route(self, route_permissions):
        """Check if user can access routes with required permissions"""
        if not route_permissions:
            return True
        return any(self.has_permission(perm) for perm in route_permissions)

    def to_dict(self):
        """Convert to dictionary for JSON response"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.value,
            'status': self.status.value,
            'permissions': self.permissions,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'timezone': self.timezone,
            'language': self.language,
            'must_change_password': self.must_change_password,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def to_auth_dict(self):
        """Convert to dictionary for authentication response (excludes sensitive info)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'role': self.role.value,
            'permissions': self.permissions,
            'timezone': self.timezone,
            'language': self.language,
            'must_change_password': self.must_change_password
        }

    def record_login(self):
        """Record successful login"""
        self.last_login = datetime.utcnow()
        self.login_attempts = 0

    def record_login_failure(self):
        """Record failed login attempt"""
        self.login_attempts += 1

    def is_locked(self):
        """Check if account is locked due to too many failed attempts"""
        return self.login_attempts >= 5  # Lock after 5 failed attempts

    def reset_login_attempts(self):
        """Reset failed login attempts"""
        self.login_attempts = 0

    @classmethod
    def get_by_username(cls, username):
        """Get user by username"""
        return cls.query.filter_by(username=username).first()

    @classmethod
    def get_by_email(cls, email):
        """Get user by email"""
        return cls.query.filter_by(email=email).first()

    @classmethod
    def create_initial_admin(cls):
        """Create initial admin user if none exists"""
        if cls.query.filter_by(role=UserRole.SUPER_ADMIN).first() is None:
            admin = cls(
                username='admin',
                email='admin@cashubux.com',
                password='CashUBux2025!',
                first_name='System',
                last_name='Administrator',
                role=UserRole.SUPER_ADMIN


            )
            db.session.add(admin)
            db.session.commit()
            print("Initial super admin user created")











def admin_required(f):
    """Decorator to require admin role"""
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = SystemUser.query.get(current_user_id)
        
        if not user or user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            return jsonify({
                'success': False,
                'message': 'Admin access required'
            }), 403
        return f(*args, **kwargs)
    return decorated_function




def moderator_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            current_user_id = get_jwt_identity()
            user = SystemUser.query.get(current_user_id)
            
            # Allow admin, super_admin, and moderator roles
            allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
            if not user or user.role not in allowed_roles:
                return jsonify({
                    'success': False,
                    'message': 'Moderator access required'
                }), 403
                
        except Exception as e:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function



# def can_manage_quests(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         try:
#             current_user_id = get_jwt_identity()
#             user = SystemUser.query.get(current_user_id)
            
#             # Allow admin, super_admin, and moderator to manage quests
#             allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
#             if not user or user.role not in allowed_roles:
#                 return jsonify({
#                     'success': False,
#                     'message': 'Insufficient permissions to manage quests'
#                 }), 403
                
#         except Exception as e:
#             return jsonify({"error": "Invalid token"}), 401
            
#         return f(*args, **kwargs)
#     return decorated_function

# def can_manage_users(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         try:
#             current_user_id = get_jwt_identity()
#             user = SystemUser.query.get(current_user_id)
            
#             # Allow admin, super_admin, and moderator to manage users
#             allowed_roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MODERATOR]
#             if not user or user.role not in allowed_roles:
#                 return jsonify({
#                     'success': False,
#                     'message': 'Insufficient permissions to manage users'
#                 }), 403
                
#         except Exception as e:
#             return jsonify({"error": "Invalid token"}), 401
            
#         return f(*args, **kwargs)
#     return decorated_function


# routes/auth.py



@app.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin user login"""
    data = request.get_json()
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'message': 'Username and password are required'
        }), 400

    username = data['username'].strip()
    password = data['password']

    # Find user
    user = SystemUser.get_by_username(username)
    if not user:
        return jsonify({
            'success': False,
            'message': 'Invalid username or password'
        }), 401

    # Check if user is active
    if user.status != UserStatus.ACTIVE:
        return jsonify({
            'success': False,
            'message': 'Account is not active'
        }), 401

    # Check if account is locked
    if user.is_locked():
        return jsonify({
            'success': False,
            'message': 'Account temporarily locked due to too many failed attempts'
        }), 401

    # Verify password
    if not user.check_password(password):
        user.record_login_failure()
        db.session.commit()
        
        remaining_attempts = 5 - user.login_attempts
        return jsonify({
            'success': False,
            'message': f'Invalid username or password. {remaining_attempts} attempts remaining.'
        }), 401

    # Successful login
    user.record_login()
    db.session.commit()

    # Create access token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'username': user.username,
            'role': user.role.value,
            'permissions': user.permissions
        },
        expires_delta=timedelta(hours=24)
    )

    return jsonify({
        'success': True,
        'token': access_token,
        'user': user.to_auth_dict(),
        'message': 'Login successful'
    })



@app.route('/admin/verify', methods=['GET'])
@jwt_required()
def verify_admin_token():
    """Verify admin token and return user info"""
    current_user_id = get_jwt_identity()
    user = SystemUser.query.get(current_user_id)
    
    if not user or user.status != UserStatus.ACTIVE:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired token'
        }), 401

    return jsonify({
        'success': True,
        'user': user.to_auth_dict()
    })

@app.route('/admin/logout', methods=['POST'])
@jwt_required()
def admin_logout():
    """Admin logout"""
    # In a real implementation, you might want to blacklist the token
    # or remove it from the user_sessions table
    
    return jsonify({
        'success': True,
        'message': 'Logout successful'
    })

# @app.route('/admin/users/me', methods=['GET'])
# 
# def get_current_user():
#     """Get current user profile"""
#     current_user_id = get_jwt_identity()
#     user = SystemUser.query.get(current_user_id)
    
#     if not user:
#         return jsonify({
#             'success': False,
#             'message': 'User not found'
#         }), 404

#     return jsonify({
#         'success': True,
#         'user': user.to_dict()
#     })

@app.route('/admin/users/me/password', methods=['PUT'])
@jwt_required()
def change_password():
    """Change current user password"""
    current_user_id = get_jwt_identity()
    user = SystemUser.query.get(current_user_id)
    
    if not user:
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404

    data = request.get_json()
    if not data or 'current_password' not in data or 'new_password' not in data:
        return jsonify({
            'success': False,
            'message': 'Current password and new password are required'
        }), 400

    # Verify current password
    if not user.check_password(data['current_password']):
        return jsonify({
            'success': False,
            'message': 'Current password is incorrect'
        }), 400

    # Set new password
    user.set_password(data['new_password'])
    user.must_change_password = False
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Password updated successfully'
    })







































































































































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
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
def jwt_required_in_app(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({"error": "Token required"}), 401
        
        try:
            token = token.replace('Bearer ', '')
            payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            # FIX: Use 'sub' claim instead of 'user_id'
            request.user_id = payload['sub']  # Flask-JWT-Extended puts identity in 'sub'
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
    # jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    app.logger.info(f"DEV LOGIN SUCCESS: Session created for User ID {user.id} ({user.name})")

    # Return user data with token
    user_data = user.to_dict()
    # user_data['token'] = jwt_token

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

        # Extract language code from Telegram user data
        user_language_code = user_data.get('language_code', 'en')
        
        # Validate and normalize language code
        valid_language_codes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar', 'hi', 'tr']
        if user_language_code not in valid_language_codes:
            user_language_code = 'en'  # Default to English if invalid
        
        print(f"🌐 User language from Telegram: {user_language_code}")

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
        print(f"🌐 User Language: {user_language_code}")
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
            # Existing user - update name and language if changed
            new_name = user_data.get('username') or f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Anonymous"
            if user.name != new_name:
                user.name = new_name
                print(f"📝 Updated user name: {user.name}")
            
            # Update language if different
            if user.language_code != user_language_code:
                user.language_code = user_language_code
                print(f"🌐 Updated user language: {user.language_code}")
            
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
                    language_code=user_language_code,  # Set language from Telegram
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
                print(f"✅ Created new user: {telegram_id}, language: {user_language_code}, referred by: {referred_by_id}")
                
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
                user.total_friends_invited+=1
                
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
        print(f"🌐 User language: {user.language_code}")
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
@jwt_required_in_app  # Use this or  depending on your needs
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


@app.route('/my-partnercampaigns', methods=['GET'])
def get_my_partner_campaigns():
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"success": False, "message": "Missing user_id"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    # Query only partner campaigns for this user
    partner_campaigns = PartnerCampaign.query.filter_by(creator_id=user_id).order_by(PartnerCampaign.id).all()
    
    if not partner_campaigns:
        return jsonify([]), 200
        
    campaigns_list = [campaign.to_dict() for campaign in partner_campaigns]
    
    return jsonify(campaigns_list), 200



@app.route('/campaigns', methods=['GET'])
@jwt_required_in_app
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
@jwt_required_in_app
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

    # Required fields (title removed from required)
    required = ['user_id', 'link', 'goal', 'cost', 'category']
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

    # Parse languages from langs field
    langs = data.get('langs', [])
    
    # If langs is a string, convert to array (for backward compatibility)
    if isinstance(langs, str):
        langs = [lang.strip() for lang in langs.split(',')]
    
    # Validate language codes
    valid_language_codes = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ar', 'hi', 'tr']
    langs = [lang for lang in langs if lang in valid_language_codes]
    
    if not langs:
        return jsonify({
            "success": False,
            "message": "At least one valid language must be selected"
        }), 400

    # Create the right campaign type
    if 'requiredLevel' in data:
        new_campaign = PartnerCampaign(
            creator_id=data['user_id'],
            link=data['link'],
            status="ACTIVE",
            completions=0,
            goal=data['goal'],
            cost=Decimal(str(data['cost'])),
            category=category,
            required_level=data['requiredLevel'],
            check_subscription=data.get('checkSubscription', False),
            langs=langs  # Store languages in langs field
        )
    else:
        new_campaign = UserCampaign(
            creator_id=data['user_id'],
            link=data['link'],
            status="ACTIVE",
            completions=0,
            goal=data['goal'],
            cost=Decimal(str(data['cost'])),
            category=category,
            check_subscription=data.get('checkSubscription', False),
            langs=langs  # Store languages in langs field
        )

    db.session.add(new_campaign)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Campaign created successfully",
        "newCampaign": new_campaign.to_dict(),  # This will include the langs array
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
@jwt_required_in_app
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
@jwt_required_in_app
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
        is_member = check_telegram_membership_direct(channel_username, user.id)
        
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
    user.tasks_completed_today_for_spin += 1
    user.spins += 1

    # Update user's task completion counters based on task category
    if campaign.category == TaskCategory.GAME:
        user.total_game_tasks_completed += 1
    elif campaign.category == TaskCategory.SOCIAL:
        user.total_social_tasks_completed += 1
    elif campaign.category == TaskCategory.PARTNER:
        user.total_partner_tasks_completed += 1

    # Update quest progress for all relevant quests
    update_quest_progress(user.id, campaign.category)

    award_referral_earnings(user.id, reward)

    db.session.commit()
    db.session.refresh(user)

    return jsonify({
        "success": True,
        "message": f"Task claimed! +{reward} coins",
        "user": user.to_dict(),
        "reward": reward
    })

def update_quest_progress(user_id: int, task_category: str):
    """Update quest progress based on completed task category"""
    # Map task category to quest type
    quest_type_map = {
        TaskCategory.GAME: 'game',
        TaskCategory.SOCIAL: 'social', 
        TaskCategory.PARTNER: 'partner'
    }
    
    quest_type = quest_type_map.get(task_category)
    if not quest_type:
        return  # Unknown category, no quests to update
    
    # Get all active quests of this type
    quests = Quest.query.filter_by(quest_type=quest_type, is_active=True).all()
    
    for quest in quests:
        # Get or create user progress record
        progress = UserQuestProgress.query.filter_by(
            user_id=user_id, 
            quest_id=quest.id
        ).first()
        
        if not progress:
            # Calculate current progress from user stats
            user = User.query.get(user_id)
            current_progress = 0
            
            if quest_type == 'game':
                current_progress = user.total_game_tasks_completed
            elif quest_type == 'social':
                current_progress = user.total_social_tasks_completed
            elif quest_type == 'partner':
                current_progress = user.total_partner_tasks_completed
            
            progress = UserQuestProgress(
                user_id=user_id,
                quest_id=quest.id,
                current_progress=current_progress
            )
            db.session.add(progress)
        else:
            # Update progress based on quest type
            if quest_type == 'game':
                progress.current_progress = User.query.get(user_id).total_game_tasks_completed
            elif quest_type == 'social':
                progress.current_progress = User.query.get(user_id).total_social_tasks_completed
            elif quest_type == 'partner':
                progress.current_progress = User.query.get(user_id).total_partner_tasks_completed
        
        # Update completion status
        progress.is_completed = progress.current_progress >= quest.total_progress
        progress.last_updated = datetime.utcnow()

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
# @jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required_in_app
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




# ---------------- AdNetwork Endpoints ---------------- #

# @app.route("/ad-networks", methods=["GET"])
# def list_ad_networks():
#     networks = AdNetwork.query.all()
#     return jsonify([{
#         "id": n.id,
#         "name": n.name,
#         "code": n.code,
#         "enabled": n.enabled
#     } for n in networks])


# @app.route("/ad-networks", methods=["POST"])
# def create_ad_network():
#     data = request.get_json()
#     new_network = AdNetwork(
#         name=data["name"],
#         code=data["code"],
#         enabled=data.get("enabled", True)
#     )
#     db.session.add(new_network)
#     db.session.commit()
#     return jsonify({
#         "id": new_network.id,
#         "name": new_network.name,
#         "code": new_network.code,
#         "enabled": new_network.enabled
#     }), 201




# @app.route("/ad-networks/<string:network_id>", methods=["PUT"])
# def update_ad_network(network_id):
#     data = request.get_json()
#     network = AdNetwork.query.get_or_404(network_id)

#     if "name" in data:
#         network.name = data["name"]
#     if "code" in data:
#         network.code = data["code"]
#     if "enabled" in data:
#         network.enabled = data["enabled"]

#     db.session.commit()
#     return jsonify({
#         "id": network.id,
#         "name": network.name,
#         "code": network.code,
#         "enabled": network.enabled
#     })

# @app.route("/ad-networks/<string:network_id>", methods=["DELETE"])
# def delete_ad_network(network_id):
#     network = AdNetwork.query.get_or_404(network_id)
#     db.session.delete(network)
#     db.session.commit()
#     return jsonify({"message": f"Ad network {network_id} deleted"}), 200




# ---------------- Example Admin Endpoints ---------------- #





# GET all daily tasks
@app.route("/admin/daily-tasks", methods=["GET"])
@jwt_required()
# @admin_required
@moderator_required
def get_tasks():
    tasks = DailyTask.query.all()
    return jsonify([(task.to_dict()) for task in tasks]), 200







@app.route('/usercampaigns/unclaimed', methods=['GET'])
@jwt_required_in_app
def get_unclaimed_campaigns():
    """Return all campaigns that the current user hasn't completed yet and where completions haven't reached the goal, filtered by user's language with limits per category."""
    try:
        user_id = request.args.get('user_id', type=int)
        limit_per_category = request.args.get('limit', 5, type=int)
    
        if not user_id:
            return jsonify({"success": False, "message": "Missing user_id"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Get the current user's language preference
        current_user_obj = User.query.get(user_id)
        user_language = current_user_obj.language_code if current_user_obj else 'en'

        # Single query using LEFT JOIN to exclude completed campaigns AND campaigns that reached goal
        unclaimed_campaigns = db.session.query(UserCampaign).outerjoin(
            user_task_completion,
            (user_task_completion.c.campaign_id == UserCampaign.id) & 
            (user_task_completion.c.user_id == user_id) &
            (user_task_completion.c.completed_at.isnot(None))
        ).filter(
            user_task_completion.c.campaign_id.is_(None),  # No completed records exist
            UserCampaign.completions < UserCampaign.goal   # Exclude campaigns that reached goal
        ).all()

        # Filter campaigns by language and organize by category
        filtered_campaigns = []
        category_counts = {'GAME': 0, 'SOCIAL': 0, 'PARTNER': 0}
        
        for campaign in unclaimed_campaigns:
            # If campaign has no language restrictions or user's language is included
            if (not campaign.langs or 
                campaign.langs == [] or 
                campaign.langs == [''] or 
                user_language in campaign.langs):
                
                # Check if we've reached the limit for this category
                if category_counts.get(campaign.category, 0) < limit_per_category:
                    filtered_campaigns.append(campaign)
                    category_counts[campaign.category] = category_counts.get(campaign.category, 0) + 1

        # Sort by ID
        filtered_campaigns.sort(key=lambda x: x.id)

        return jsonify([c.to_dict() for c in filtered_campaigns]), 200

    except Exception as e:
        print(f"Error fetching unclaimed campaigns: {e}")
        return jsonify([]), 200


@app.route("/admin/daily-tasks/incomplete", methods=["GET"])
@jwt_required()
@admin_required
def get_incomplete_tasks():
    user_id = request.args.get('user_id')
    include_in_progress = request.args.get('include_in_progress', 'false').lower() == 'true'
    
    if not user_id:
        return jsonify({"error": "user_id parameter is required"}), 400
    
    try:
        # Get current time for 24-hour check
        current_time = datetime.utcnow()
        
        # Subquery for completed tasks
        completed_subquery = db.session.query(user_daily_task_completions.c.task_id)\
            .filter(user_daily_task_completions.c.user_id == user_id)\
            .filter(user_daily_task_completions.c.completed_at.isnot(None))\
            .subquery()
        
        # Base query for incomplete tasks
        query = DailyTask.query\
            .filter_by(status=CampaignStatus.ACTIVE)\
            .filter(~DailyTask.id.in_(completed_subquery))
        
        if not include_in_progress:
            # Exclude tasks that are in progress but within 24 hours
            # Get tasks that are either not started OR started but over 24 hours ago
            in_progress_subquery = db.session.query(user_daily_task_completions.c.task_id)\
                .filter(user_daily_task_completions.c.user_id == user_id)\
                .filter(user_daily_task_completions.c.started_at.isnot(None))\
                .filter(user_daily_task_completions.c.completed_at.is_(None))\
                .subquery()
            
            # Only include tasks that are either:
            # 1. Not started at all, OR
            # 2. Started but over 24 hours ago (need to be restarted)
            query = query.filter(
                ~DailyTask.id.in_(in_progress_subquery) | 
                (DailyTask.id.in_(in_progress_subquery) & 
                 user_daily_task_completions.c.started_at <= (current_time - timedelta(hours=24)))
            )
        
        incomplete_tasks = query.all()
        
        # Convert to dict with completion status and time info
        tasks_data = []
        for task in incomplete_tasks:
            # Check if task is in progress
            progress_record = db.session.query(user_daily_task_completions)\
                .filter_by(user_id=user_id, task_id=task.id)\
                .first()
            
            task_dict = task.to_dict()
            task_dict['completed'] = False
            task_dict['claimed'] = False
            task_dict['in_progress'] = progress_record and progress_record.started_at and not progress_record.completed_at
            task_dict['started_at'] = progress_record.started_at.isoformat() if progress_record and progress_record.started_at else None
            
            # Calculate if within 24 hours
            if task_dict['in_progress'] and progress_record.started_at:
                hours_passed = (current_time - progress_record.started_at).total_seconds() / 3600
                task_dict['within_24_hours'] = hours_passed <= 24
            else:
                task_dict['within_24_hours'] = False
                
            tasks_data.append(task_dict)
        
        return jsonify(tasks_data), 200
        
    except Exception as e:
        print(f"Error fetching incomplete daily tasks: {e}")
        return jsonify({"error": "Internal server error"}), 500







# Add these to your Flask app
@app.route('/admin/daily-tasks')

@jwt_required()
@admin_required
def get_admin_daily_tasks():
    """Get all daily tasks for admin management"""
    tasks = DailyTask.query.order_by(DailyTask.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200




# GET single task
@app.route("/daily-tasks/<int:task_id>", methods=["GET"])
@jwt_required()
@admin_required
def get_task(task_id):
    task = DailyTask.query.get_or_404(task_id)
    return jsonify(task.to_dict()), 200

# CREATE new task

@app.route("/admin/daily-tasks", methods=["POST"])
@jwt_required()
# @admin_required
@moderator_required
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
# @jwt_required_in_app
@jwt_required()
# @admin_required
@moderator_required
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
# @jwt_required_in_app
@jwt_required()
# @admin_required
@moderator_required
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
@jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required_in_app
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

@app.route('/admin/users', methods=['GET'])
# @jwt_required_in_app
@jwt_required()
# @admin_required
@moderator_required
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
@jwt_required()
@admin_required
def get_user_by_id(user_id):
    try:
        user = User.query.get_or_404(user_id)
        return jsonify(user.to_dict())
    except Exception as e:
        app.logger.error(f"Error fetching user {user_id}: {str(e)}")
        return jsonify({"error": "Failed to fetch user"}), 500

@app.route('/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required

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
@jwt_required()
@admin_required

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

@jwt_required()
@admin_required
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
@jwt_required()
@admin_required

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
@jwt_required()
@admin_required

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

@jwt_required()
@admin_required
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
@jwt_required()
@admin_required

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

@jwt_required()
@admin_required
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
@jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required()
@admin_required
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
@jwt_required_in_app
def deposit_ad_credit():
    data = request.get_json()

    user_id = data.get('user_id')
    amount = data.get('amount')
    transaction_hash = data.get('transaction_hash')
    payment_method = data.get('payment_method', 'MANUAL')  # MANUAL or BLOCKCHAIN

    if not user_id or not isinstance(user_id, int):
        return jsonify({"success": False, "message": "User ID is required and must be an integer"}), 400

    if not amount or amount <= 0:
        return jsonify({"success": False, "message": "Invalid amount"}), 400

    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        deposit_amount = Decimal(str(amount))

        # Update user's balance immediately for better UX
        if user.ad_credit is None:
            user.ad_credit = Decimal('0')
        user.ad_credit += deposit_amount

        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            amount=deposit_amount,
            transaction_type=TransactionType.DEPOSIT,
            currency=TransactionCurrency.TON,
            status=TransactionStatus.PENDING if payment_method == 'BLOCKCHAIN' else TransactionStatus.COMPLETED,
            description=f"Deposit of {deposit_amount} TON to ad credit{' via blockchain' if payment_method == 'BLOCKCHAIN' else ''}",
            transaction_id_on_blockchain=transaction_hash if payment_method == 'BLOCKCHAIN' else None
        )
        db.session.add(transaction)
        db.session.commit()

        # For blockchain transactions, verify in background (will reverse if invalid)
        if payment_method == 'BLOCKCHAIN' and transaction_hash:
            import threading
            thread = threading.Thread(
                target=verify_deposit_transaction,
                args=(user.id, transaction_hash, deposit_amount, transaction.id)
            )
            thread.daemon = True
            thread.start()

            return jsonify({
                "success": True, 
                "message": "Deposit received! Verification in progress...", 
                "user": user.to_dict()
            })
        else:
            return jsonify({
                "success": True, 
                "message": "Manual deposit successful", 
                "user": user.to_dict()
            })

    except Exception as e:
        db.session.rollback()
        print(f"Deposit error: {e}")
        return jsonify({"success": False, "message": f"Deposit failed: {str(e)}"}), 500


def verify_deposit_transaction(user_id: int, transaction_hash: str, expected_amount: Decimal, transaction_id: int):
    """Background verification for blockchain deposits - reverses if invalid"""
    with app.app_context():
        try:
            print(f"🔍 Verifying deposit transaction {transaction_id} for user {user_id}")

            # Check for double-spending first
            if is_double_spent(transaction_hash, transaction_id):
                print(f"❌ Double-spent transaction detected: {transaction_hash}")
                reverse_invalid_deposit(user_id, expected_amount, transaction_id)
                return

            # Verify on-chain transaction
            is_valid = verify_ton_transaction_sync_logic(transaction_hash, expected_amount)

            if not is_valid:
                print(f"❌ Invalid TON transaction: {transaction_hash}")
                reverse_invalid_deposit(user_id, expected_amount, transaction_id)
                return

            # Transaction is valid - mark as completed
            mark_transaction_verified(transaction_id)
            print(f"✅ Deposit transaction verified for user {user_id}")

        except Exception as e:
            print(f"Deposit verification error: {e}")
            mark_transaction_failed(transaction_id, f"Verification error: {str(e)}")


def is_double_spent(transaction_hash: str, current_transaction_id: int) -> bool:
    """Check if this blockchain transaction hash was already used"""
    try:
        existing_transaction = Transaction.query.filter(
            Transaction.transaction_id_on_blockchain == transaction_hash,
            Transaction.id != current_transaction_id,
            Transaction.status != TransactionStatus.FAILED  # Ignore failed ones
        ).first()
        return existing_transaction is not None
    except Exception as e:
        print(f"Double-spend check error: {e}")
        return False


def mark_transaction_failed(transaction_id: int, reason: str):
    """Mark a transaction as failed"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if transaction:
            transaction.status = TransactionStatus.FAILED
            transaction.description = f"{transaction.description} - FAILED: {reason}"
            db.session.commit()
            print(f"❌ Marked transaction {transaction_id} as failed: {reason}")
    except Exception as e:
        print(f"Error marking transaction as failed: {e}")
        db.session.rollback()


def mark_transaction_verified(transaction_id: int):
    """Mark a transaction as verified and completed"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if transaction:
            transaction.status = TransactionStatus.COMPLETED
            transaction.description = f"{transaction.description} - VERIFIED"
            db.session.commit()
            print(f"✅ Marked transaction {transaction_id} as verified")
    except Exception as e:
        print(f"Error marking transaction as verified: {e}")
        db.session.rollback()


def reverse_invalid_deposit(user_id: int, amount: Decimal, transaction_id: int):
    """
    Reverse an invalid deposit by deducting the amount and marking transaction failed
    """
    try:
        user = User.query.get(user_id)
        if not user:
            mark_transaction_failed(transaction_id, "User not found during reversal")
            return

        # Only reverse if user has sufficient balance
        if user.ad_credit and user.ad_credit >= amount:
            user.ad_credit -= amount
            
            # Create reversal transaction record
            reversal = Transaction(
                user_id=user.id,
                amount=-amount,
                transaction_type=TransactionType.REVERSAL,
                currency=TransactionCurrency.TON,
                status=TransactionStatus.COMPLETED,
                description=f"Reversal of invalid deposit (Original TX: {transaction_id})"
            )
            db.session.add(reversal)
            
            # Mark original transaction as failed
            mark_transaction_failed(transaction_id, "Transaction verification failed - reversed")
            
            db.session.commit()
            print(f"↩️ Reversed invalid deposit of {amount} TON for user {user_id}")
        else:
            mark_transaction_failed(transaction_id, "Cannot reverse - insufficient user balance")
            print(f"⚠️ Cannot reverse deposit - insufficient balance for user {user_id}")
            
    except Exception as e:
        db.session.rollback()
        print(f"Deposit reversal error: {e}")
        mark_transaction_failed(transaction_id, f"Reversal error: {str(e)}")











# Add these endpoints to your app.py

@app.route('/spin', methods=['POST'])
@jwt_required_in_app
def spin_wheel():
    """Handle wheel spin and award prizes"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
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
            if hasattr(user, 'ton'):
                user.ad_credit += Decimal(str(selected_prize["value"]))
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
@jwt_required_in_app
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
@jwt_required_in_app
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
@jwt_required_in_app
def buy_spins():  # Remove async here
    """Purchase spins using coins, in-app TON, or blockchain TON"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        package_id = data.get('packageId')
        payment_method = data.get('paymentMethod')
        transaction_boc = data.get('transactionHash')

        if not user_id or not package_id or not payment_method:
            return jsonify({"success": False, "message": "Missing parameters"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        spin_package = next((pkg for pkg in SPIN_STORE_PACKAGES if pkg['id'] == package_id), None)
        if not spin_package:
            return jsonify({"success": False, "message": "Invalid package"}), 400

        transactions = []
        message = ""
        spins_to_add = spin_package['spins']
        cost_ton = Decimal(str(spin_package['costTon']))

        if payment_method == 'COINS':
            cost_in_coins = spin_package['costTon'] * CONVERSION_RATE
            if user.coins < cost_in_coins:
                return jsonify({"success": False, "message": "Insufficient coins"}), 400

            user.coins -= cost_in_coins
            user.spins += spins_to_add

            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_in_coins),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.COINS,
                status=TransactionStatus.COMPLETED,
                description=f"Purchased {spins_to_add} spins"
            ))
            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(spins_to_add),
                transaction_type=TransactionType.DEPOSIT,
                currency=TransactionCurrency.COINS,
                status=TransactionStatus.COMPLETED,
                description=f"Received {spins_to_add} spins from purchase"
            ))
            message = f"Purchased {spins_to_add} spins for {cost_in_coins:,} coins"

        elif payment_method == 'TON':
            if user.ad_credit < cost_ton:
                return jsonify({"success": False, "message": "Insufficient TON balance"}), 400

            user.ad_credit -= cost_ton
            user.spins += spins_to_add

            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_ton),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.TON,
                status=TransactionStatus.COMPLETED,
                description=f"Purchased {spins_to_add} spins"
            ))
            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(spins_to_add),
                transaction_type=TransactionType.DEPOSIT,
                currency=TransactionCurrency.SPINS,
                status=TransactionStatus.COMPLETED,
                description=f"Received {spins_to_add} spins from purchase"
            ))
            message = f"Purchased {spins_to_add} spins for {cost_ton} TON"

        elif payment_method == 'TON_BLOCKCHAIN':
            if not transaction_boc:
                return jsonify({"success": False, "message": "Transaction BOC required"}), 400

            # For blockchain transactions, we'll verify asynchronously
            # But immediately credit spins for better UX (you can change this)
            bonus_spins = int(spins_to_add * 0.1)
            total_spins = spins_to_add + bonus_spins
            
            user.spins += total_spins

            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_ton),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.TON,
                status=TransactionStatus.COMPLETED,
                description=f"Blockchain payment for {total_spins} spins ({spins_to_add} + {bonus_spins} bonus)"
            ))
            # In your buy_spins function, for TON_BLOCKCHAIN payments:
            transactions.append(Transaction(
                user_id=user.id,
                amount=Decimal(-cost_ton),
                transaction_type=TransactionType.WITHDRAWAL,
                currency=TransactionCurrency.TON,
                status=TransactionStatus.COMPLETED,
                description=f"Blockchain payment for {spins_to_add} spins",
                transaction_id_on_blockchain=transaction_boc  # Use the new field
            ))
            
            # Start verification in background (non-blocking)
            import threading
            thread = threading.Thread(
                target=verify_ton_transaction_sync,
                args=(user.id, transaction_boc, cost_ton, spin_package)
            )
            thread.daemon = True
            thread.start()
            
            message = f"Purchased {total_spins} spins ({spins_to_add} + {bonus_spins} bonus) via blockchain!"

        else:
            return jsonify({"success": False, "message": "Invalid payment method"}), 400

        # Add all transactions to session
        for transaction in transactions:
            db.session.add(transaction)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": message,
            "user": user.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        print(f"Spin purchase error: {e}")
        return jsonify({"success": False, "message": "Purchase failed. Please try again."}), 500


def verify_ton_transaction_sync(user_id: int, transaction_boc: str, expected_amount: Decimal, spin_package: dict):
    """Synchronous version of TON verification"""
    try:
        # Your verification logic here (synchronous)
        is_valid = verify_ton_transaction_sync_logic(transaction_boc, expected_amount)
        
        if not is_valid:
            print(f"❌ Invalid TON tx for user {user_id}")
            # You might want to reverse the transaction here
            return
        
        print(f"✅ TON transaction verified for user {user_id}")
        
    except Exception as e:
        print(f"TON verification error: {e}")


def verify_ton_transaction_sync_logic(transaction_boc: str, expected_amount: Decimal) -> bool:
    """
    Synchronous TON transaction verification
    """
    try:
        # Use your TON API key here
        TON_API_KEY = "AG7BCGUSVI2VF7QAAAAG23MTFLRODHOP7EDRFM2NPLIQZUDCDFDQSHC3SNDNJD7ZBJWA5VI"
        MERCHANT_WALLET = "UQCUj1nsD2CHdyBoO8zIUqwlL-QXpyeUsMbePiegTqURiJu0"
        
        # This is a simplified synchronous version
        # You'll need to use a synchronous HTTP client like requests
        import requests
        
        payload = {
            'boc': transaction_boc,
            'expected_amount': float(expected_amount),
            'merchant_wallet': MERCHANT_WALLET
        }
        
        headers = {
            'Authorization': f'Bearer {TON_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            'http://bot.cashubux.com/api/v1/payments/ton-webhook',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('valid', False)
        
        return False
        
    except Exception as e:
        print(f"TON transaction verification error: {e}")
        # For development, return True; in production, handle properly
        return True





@app.route('/api/withdraw/update-transaction', methods=['POST'])
@jwt_required_in_app
def update_withdrawal_transaction():
    data = request.get_json()
    transaction_id = data.get("transactionId")
    transaction_hash = data.get("transactionHash")

    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"success": False, "message": "Transaction not found"}), 404

    transaction.transaction_id_on_blockchain = transaction_hash
    transaction.status = TransactionStatus.COMPLETED
    transaction.description = f"{transaction.description} - Blockchain confirmed"

    db.session.commit()

    return jsonify({"success": True})





# Add these endpoints to your app.py

# Get pending withdrawals for admin
@app.route('/admin/pending-withdrawals', methods=['GET'])
@jwt_required_in_app
def get_pending_withdrawals():
    try:
        pending_withdrawals = Transaction.query.filter_by(
            transaction_type=TransactionType.WITHDRAWAL,
            status=TransactionStatus.PENDING
        ).order_by(Transaction.created_at.desc()).all()
        
        # Include user information with each transaction
        transactions_with_users = []
        for tx in pending_withdrawals:
            tx_dict = tx.to_dict()
            tx_dict['user'] = tx.user.to_dict() if tx.user else None
            transactions_with_users.append(tx_dict)
        
        return jsonify({
            'success': True,
            'transactions': transactions_with_users
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error fetching pending withdrawals: {str(e)}'}), 500

# Approve withdrawal endpoint

# Update the existing withdraw_ton endpoint to check settings
@app.route('/api/withdraw/ton', methods=['POST'])
@jwt_required_in_app
def withdraw_ton():
    data = request.get_json()
    amount = data.get("amount")
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"success": False, "message": "Missing userId"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    if amount is None or amount <= 0:
        return jsonify({"success": False, "message": "Invalid withdrawal amount"}), 400

    # Check if user has wallet address
    if not user.wallet_address:
        return jsonify({"success": False, "message": "Wallet address not set. Please connect your wallet first."}), 400

    # Convert amount to Decimal for calculations
    withdrawal_amount = Decimal(str(amount))
    conversion_rate = Decimal(str(CONVERSION_RATE))

    # Calculate coins needed for withdrawal
    coins_balance = Decimal(str(user.coins)) if user.coins else Decimal('0')
    coins_needed = withdrawal_amount * conversion_rate

    # Check if user has enough coins
    if coins_needed > coins_balance:
        return jsonify({
            "success": False, 
            "message": f"Insufficient coins balance. You need {coins_needed:.0f} coins for {withdrawal_amount} TON"
        }), 400

    # Get settings to check auto-withdrawal status
    settings = Settings.query.first()
    if not settings:
        settings = Settings(auto_withdrawals=False)
        db.session.add(settings)
        db.session.commit()

    # Update coins balance - convert to float for SQLite compatibility
    new_coins_balance = float(coins_balance - coins_needed)
    user.coins = new_coins_balance

    # Determine transaction status based on auto-withdrawal setting
    if settings.auto_withdrawals:
        status = TransactionStatus.COMPLETED
        description = f"Auto withdrawal of {withdrawal_amount} TON (Converted {coins_needed:.0f} coins)"
        # TODO: If auto-withdrawals are enabled, process the TON transfer immediately here
    else:
        status = TransactionStatus.PENDING
        description = f"Withdrawal of {withdrawal_amount} TON (Converted {coins_needed:.0f} coins) - Pending admin approval"

    # Create withdrawal transaction record
    transaction = Transaction(
        user_id=user.id,
        amount=float(-withdrawal_amount),  # Convert to float for SQLite
        transaction_type=TransactionType.WITHDRAWAL,
        currency=TransactionCurrency.TON,
        status=status,
        description=description
    )
    
    try:
        db.session.add(transaction)
        db.session.commit()
        
        response_data = {
            "success": True,
            "message": f"Withdrawal request for {withdrawal_amount} TON submitted",
            "user": user.to_dict(),
            "transactionId": transaction.id
        }
        
        if not settings.auto_withdrawals:
            response_data["message"] = f"Withdrawal request for {withdrawal_amount} TON submitted for admin approval"
            response_data["requiresApproval"] = True
        
        return jsonify(response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Database error: {e}")
        return jsonify({
            "success": False, 
            "message": "Database error occurred during withdrawal"
        }), 500




# app.py - Add these endpoints
# app.py
@app.route('/api/transactions/withdrawals', methods=['GET'])
@jwt_required_in_app
def get_withdrawal_transactions():
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        currency = request.args.get('currency')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build query
        query = Transaction.query.filter(
            Transaction.transaction_type == TransactionType.WITHDRAWAL
        )
        
        # Apply filters
        if status:
            query = query.filter(Transaction.status == status)
        if currency:
            query = query.filter(Transaction.currency == currency)
        if start_date:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Transaction.created_at >= start_date_obj)
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Transaction.created_at <= end_date_obj)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        transactions = query.order_by(Transaction.created_at.desc()).paginate(
            page=page, 
            per_page=limit, 
            error_out=False
        ).items
        
        # Convert to list of dictionaries
        transactions_data = []
        for tx in transactions:
            tx_data = {
                'id': tx.id,
                'user_id': tx.user_id,
                'amount': float(tx.amount),
                'transaction_type': tx.transaction_type.value,
                'currency': tx.currency.value,
                'status': tx.status.value,
                'description': tx.description,
                'transaction_id_on_blockchain': tx.transaction_id_on_blockchain,
                'created_at': tx.created_at.isoformat() if tx.created_at else None,
                'date': tx.created_at.strftime('%Y-%m-%d %H:%M') if tx.created_at else 'Unknown date'
            }
            transactions_data.append(tx_data)
        
        return jsonify({
            'success': True,
            'transactions': transactions_data,
            'total': total,
            'page': page,
            'limit': limit,
            'totalPages': (total + limit - 1) // limit
        })
        
    except Exception as e:
        print(f"Error fetching withdrawal transactions: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch transactions',
            'transactions': [],
            'total': 0,
            'page': 1,
            'limit': 10,
            'totalPages': 0
        }), 500









# Settings endpoints
@app.route('/admin/api/settings', methods=['GET'])
@jwt_required()
@admin_required
def get_settings():
    try:
        settings = Settings.query.first()
        if not settings:
            # Create default settings if they don't exist
            settings = Settings(auto_withdrawals=False)
            db.session.add(settings)
            db.session.commit()
        
        return jsonify({
            'autoWithdrawals': settings.auto_withdrawals
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error fetching settings: {str(e)}'}), 500

@app.route('/admin/api/settings', methods=['POST'])
@jwt_required()
@admin_required
def update_settings():
    try:
        data = request.get_json()
        auto_withdrawals = data.get('autoWithdrawals')
        
        if auto_withdrawals is None:
            return jsonify({'success': False, 'message': 'autoWithdrawals is required'}), 400
        
        settings = Settings.query.first()
        if not settings:
            settings = Settings(auto_withdrawals=auto_withdrawals)
            db.session.add(settings)
        else:
            settings.auto_withdrawals = auto_withdrawals
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Settings updated successfully',
            'autoWithdrawals': settings.auto_withdrawals
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error updating settings: {str(e)}'}), 500












@app.route('/api/quests', methods=['GET'])
@jwt_required()
# @admin_required
def get_user_quests():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get all active quests
    quests = Quest.query.filter_by(is_active=True).all()
    
    user_quests = []
    for quest in quests:
        # Get user's progress for this quest
        progress = UserQuestProgress.query.filter_by(
            user_id=user_id, 
            quest_id=quest.id
        ).first()
        
        # Calculate current progress based on quest type
        current_progress = 0
        if progress:
            current_progress = progress.current_progress
        else:
            # Auto-calculate progress from user stats
            current_progress = calculate_quest_progress(quest, user)
            
            # Create progress record if it doesn't exist
            if not progress:
                progress = UserQuestProgress(
                    user_id=user_id,
                    quest_id=quest.id,
                    current_progress=current_progress
                )
                db.session.add(progress)
        
        # Update completion status
        is_completed = current_progress >= quest.total_progress
        if progress.is_completed != is_completed:
            progress.is_completed = is_completed
            progress.last_updated = datetime.utcnow()
        
        # Check if claimed
        is_claimed = ClaimedQuest.query.filter_by(
            user_id=user_id, 
            quest_id=quest.id
        ).first() is not None
        
        # Exclude quests that are both completed AND claimed
        # This shows: uncompleted quests + completed but unclaimed quests
        if not (is_completed and is_claimed):
            user_quests.append({
                'id': quest.id,
                'title': quest.title,
                'icon': quest.icon,
                'reward': quest.reward,
                'currentProgress': current_progress,
                'totalProgress': quest.total_progress,
                'isCompleted': is_completed,
                'isClaimed': is_claimed
            })
    
    db.session.commit()
    return jsonify(user_quests)

def calculate_quest_progress(quest, user):
    """Calculate progress based on quest type and user stats"""
    if quest.quest_type == 'game':
        return user.total_game_tasks_completed
    elif quest.quest_type == 'social':
        return user.total_social_tasks_completed
    elif quest.quest_type == 'partner':
        return user.total_partner_tasks_completed
    elif quest.quest_type == 'invite':
        return user.total_friends_invited
    return 0

@app.route('/api/quests/<quest_id>/claim', methods=['POST'])

@jwt_required()
@admin_required
def claim_quest_reward(quest_id):
    user_id = request.json.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    quest = Quest.query.get(quest_id)
    if not quest:
        return jsonify({'error': 'Quest not found'}), 404
    
    # Check if already claimed
    if ClaimedQuest.query.filter_by(user_id=user_id, quest_id=quest_id).first():
        return jsonify({'error': 'Quest already claimed'}), 400
    
    # Check progress
    progress = UserQuestProgress.query.filter_by(user_id=user_id, quest_id=quest_id).first()
    if not progress or progress.current_progress < quest.total_progress:
        return jsonify({'error': 'Quest not completed'}), 400
    
    # Award reward
    user.coins += quest.reward
    
    # Record claim
    claimed_quest = ClaimedQuest(
        user_id=user_id,
        quest_id=quest_id,
        reward_received=quest.reward
    )
    db.session.add(claimed_quest)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'coins_awarded': quest.reward,
        'new_balance': user.coins
    })

# Admin routes for quest management
@app.route('/admin/quests', methods=['GET'])

# @jwt_required()
# @admin_required
@jwt_required_in_app
def get_all_quests():
    quests = Quest.query.all()
    return jsonify([{
        'id': q.id,
        'title': q.title,
        'icon': q.icon,
        'reward': q.reward,
        'total_progress': q.total_progress,
        'quest_type': q.quest_type,
        'is_active': q.is_active,
        'created_at': q.created_at.isoformat(),
        'updated_at': q.updated_at.isoformat()
    } for q in quests])


@app.route('/admin/quests', methods=['POST'])

@jwt_required()
# @admin_required
@moderator_required
def create_quest():
    data = request.json
    quest = Quest(
        id=data['id'],
        title=data['title'],
        icon=data['icon'],
        reward=data['reward'],
        total_progress=data['total_progress'],
        quest_type=data['quest_type'],
        is_active=data.get('is_active', True)
    )
    db.session.add(quest)
    db.session.commit()
    return jsonify({'success': True, 'quest': quest.id})

@app.route('/admin/quests/<quest_id>', methods=['PUT'])
@jwt_required()
@admin_required

def update_quest(quest_id):
    quest = Quest.query.get(quest_id)
    if not quest:
        return jsonify({'error': 'Quest not found'}), 404
    
    data = request.json
    quest.title = data.get('title', quest.title)
    quest.icon = data.get('icon', quest.icon)
    quest.reward = data.get('reward', quest.reward)
    quest.total_progress = data.get('total_progress', quest.total_progress)
    quest.quest_type = data.get('quest_type', quest.quest_type)
    quest.is_active = data.get('is_active', quest.is_active)
    quest.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'success': True})

@app.route('/admin/quests/<quest_id>', methods=['DELETE'])
@jwt_required()
# @admin_required
@moderator_required
def delete_quest(quest_id):
    try:
        quest = Quest.query.get(quest_id)
        if not quest:
            return jsonify({'error': 'Quest not found'}), 404
        
        # First, delete all related records
        # Delete UserQuestProgress records
        UserQuestProgress.query.filter_by(quest_id=quest_id).delete()
        
        # Delete ClaimedQuest records
        ClaimedQuest.query.filter_by(quest_id=quest_id).delete()
        
        # Now delete the quest
        db.session.delete(quest)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting quest {quest_id}: {e}")
        return jsonify({'error': 'Failed to delete quest'}), 500



@app.route('/api/admin/dashboard/stats', methods=['GET'])

@jwt_required()
@moderator_required
# @admin_required
def get_dashboard_stats():
    try:
        # Check if user is admin (you'll need to implement this check)
        # For now, we'll assume the endpoint is protected by admin middleware
        
        # Total Users
        total_users = db.session.query(func.count(User.id)).scalar()
        
        # Total Coins in Circulation (sum of all users' coins)
        total_coins_result = db.session.query(func.sum(User.coins)).scalar()
        total_coins = total_coins_result if total_coins_result else 0
        
        # Total TON Withdrawn (sum of completed withdrawal transactions)
        total_withdrawals_result = db.session.query(
            func.sum(Transaction.amount)
        ).filter(
            Transaction.transaction_type == TransactionType.WITHDRAWAL,
            Transaction.currency == TransactionCurrency.TON,
            Transaction.status == TransactionStatus.COMPLETED
        ).scalar()
        total_withdrawals = abs(float(total_withdrawals_result)) if total_withdrawals_result else 0.0
        
        # Tasks Completed (sum of all task completions)
        # Count daily task completions
        daily_tasks_completed = db.session.query(
            func.count(user_daily_task_completions.c.user_id)
        ).filter(
            user_daily_task_completions.c.claimed == True
        ).scalar() or 0
        
        # Count campaign task completions
        campaign_tasks_completed = db.session.query(
            func.count(user_task_completion.c.user_id)
        ).filter(
            user_task_completion.c.completed_at.isnot(None)
        ).scalar() or 0
        
        total_tasks_completed = daily_tasks_completed + campaign_tasks_completed
        
        return jsonify({
            'success': True,
            'stats': {
                'totalUsers': total_users,
                'totalCoins': total_coins,
                'totalWithdrawals': total_withdrawals,
                'tasksCompleted': total_tasks_completed
            }
        })
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch dashboard statistics'
        }), 500












@app.route('/campaign/reactivate', methods=['POST'])
@jwt_required_in_app
def reactivate_campaign():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        campaign_id = data.get('campaign_id')
        
        if not user_id or not campaign_id:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        user = User.query.get(user_id)
        
        # Check if user has this campaign in their completions
        campaign_completion = db.session.query(user_task_completion).filter_by(
            user_id=user_id, 
            campaign_id=campaign_id
        ).first()
        
        # if not campaign_completion:
        #     return jsonify({'success': False, 'message': 'Campaign not found for this user'}), 404
        
        # Get the campaign details
        campaign = UserCampaign.query.get(campaign_id)
        if not campaign:
            return jsonify({'success': False, 'message': 'Campaign not found'}), 404
        
        # Calculate reactivation cost (same as original cost)
        reactivation_cost = campaign.cost
        
        if user.ad_credit < reactivation_cost:
            return jsonify({
                'success': False, 
                'message': f'Insufficient funds. Need {reactivation_cost} TON, but only have {user.ad_credit} TON'
            }), 400
        
        # Deduct from user's ad credit
        user.ad_credit -= reactivation_cost
        
        # Reset campaign completions to 0
        campaign.completions = 0
        
        # Delete ALL completed records for this user in this campaign
        # db.session.execute(
        #     user_task_completion.delete().where(
        #         (user_task_completion.c.user_id == user_id) & 
        #         (user_task_completion.c.campaign_id == campaign_id) &
        #         (user_task_completion.c.completed_at.isnot(None))
        #     )
        # )
        
        # Create a new fresh entry for the user
        # db.session.execute(
        #     user_task_completion.insert().values(
        #         user_id=user_id,
        #         campaign_id=campaign_id,
        #         started_at=func.now(),
        #         completed_at=None
        #     )
        # )
        
       
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Campaign reactivated successfully. All previous completions cleared.'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500




























































@app.route('/api/users/<int:user_id>/wallet-address', methods=['PUT'])
@jwt_required()
@admin_required
def update_user_wallet_address(user_id):
    data = request.get_json()
    wallet_address = data.get("walletAddress")

    if not wallet_address:
        return jsonify({"success": False, "message": "Wallet address is required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    user.wallet_address = wallet_address
    db.session.commit()

    return jsonify({"success": True, "user": user.to_dict()}), 200

 
 













# file: ton_send_multi_provider.py
import os
import json
import requests
from flask import Flask, jsonify
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.utils import to_nano, bytes_to_b64str








# Updated reject endpoint (no changes needed here)
@app.route('/admin/withdrawals/<int:transaction_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_withdrawal(transaction_id):
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        
        if transaction.transaction_type != TransactionType.WITHDRAWAL:
            return jsonify({'success': False, 'message': 'Transaction is not a withdrawal'}), 400
            
        if transaction.status != TransactionStatus.PENDING:
            return jsonify({'success': False, 'message': 'Transaction is not pending approval'}), 400
        
        # Get the withdrawal amount to calculate coin refund
        withdrawal_amount = abs(transaction.amount)
        coins_refund = int(withdrawal_amount * CONVERSION_RATE)
        
        # Refund the coins to user
        user = User.query.get(transaction.user_id)
        if user:
            user.coins += coins_refund
        
        # Update transaction status
        transaction.status = TransactionStatus.FAILED
        transaction.description = f"Withdrawal rejected by admin - {coins_refund} coins refunded"
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Withdrawal rejected and {coins_refund} coins refunded to user',
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error rejecting withdrawal: {str(e)}'}), 500




import requests
import os
import hashlib
import time
from flask import jsonify, request
from app import app, db

# Configuration
MNEMONIC = "shiver element initial sea behind across bus chapter dose earth write foil loyal employ city daughter cluster verify cradle citizen place burden brass fossil"
QUICKNODE_BASE = "https://flashy-hardworking-sound.ton-mainnet.quiknode.pro/0b8a7ecf4d4898861d6da8ca6097e1d5bfa2718a/"

def get_wallet_address():
    """Return the admin wallet address (replace with your own)."""
    return "UQDgvglKX5B_l9BvW9P7KB8LDgmrR2iRfwElIeDS1nMFfi7c"

def check_wallet_balance():
    """Check wallet balance using QuickNode."""
    try:
        wallet_address = get_wallet_address()
        url = QUICKNODE_BASE.rstrip("/") + "/getWalletInformation"

        print(f"Checking wallet balance for: {wallet_address}")
        response = requests.get(url, params={"address": wallet_address}, timeout=20)

        if response.status_code == 200:
            data = response.json()
            result = data.get('result', {})

            balance_nano = int(result.get('balance', 0))
            balance_ton = balance_nano / 1_000_000_000
            is_activated = result.get('account_state') != 'uninitialized'

            print(f"Wallet balance: {balance_ton} TON, Activated: {is_activated}")
            return is_activated, wallet_address, balance_ton
        else:
            print(f"Error checking balance: {response.status_code} - {response.text}")
            return False, wallet_address, 0

    except Exception as e:
        print(f"Error in check_wallet_balance: {e}")
        return False, get_wallet_address(), 0








import requests
import base64
import hashlib
import time
from tonsdk.utils import to_nano
from tonsdk.contract.wallet import Wallets, WalletVersionEnum

# Configuration
MNEMONIC = "shiver element initial sea behind across bus chapter dose earth write foil loyal employ city daughter cluster verify cradle citizen place burden brass fossil"
QUICKNODE_BASE = "https://flashy-hardworking-sound.ton-mainnet.quiknode.pro/0b8a7ecf4d4898861d6da8ca6097e1d5bfa2718a/"

def send_ton_real(to_address: str, amount_ton: float, memo: str = "") -> str:
    """
    Real TON transfer implementation with proper wallet handling
    """
    try:
        print("🚀 STARTING REAL TON TRANSFER")
        print(f"Recipient: {to_address}")
        print(f"Amount: {amount_ton} TON")
        print(f"Memo: {memo}")
        
        # 1. Create wallet from mnemonic
        mnemonics = MNEMONIC.split()
        print(f"Creating wallet from mnemonic ({len(mnemonics)} words)")
        
        # Wallets.from_mnemonics returns a tuple: (mnemonics, pub_k, priv_k, wallet)
        result = Wallets.from_mnemonics(
            mnemonics,
            WalletVersionEnum.v4r2,  # Using v4r2 instead of v3r2
            workchain=0
        )
        
        print(f"Wallet creation result type: {type(result)}")
        print(f"Result length: {len(result) if hasattr(result, '__len__') else 'N/A'}")
        
        # Extract wallet from tuple (mnemonics, pub_k, priv_k, wallet)
        if isinstance(result, (list, tuple)) and len(result) >= 4:
            wallet = result[3]  # wallet is the 4th element
            print("✅ Extracted wallet from tuple")
        else:
            raise TypeError(f"Unexpected wallet result format: {type(result)}")
        
        # 2. Get admin wallet address
        if hasattr(wallet, "address"):
            admin_address = wallet.address.to_string(True, True, True)
            print(f"✅ Admin wallet address: {admin_address}")
        else:
            raise AttributeError("Wallet object doesn't have 'address' attribute")
        
        # 3. Check wallet balance and get seqno
        url = QUICKNODE_BASE.rstrip("/") + "/getWalletInformation"
        print(f"🔍 Checking wallet info: {admin_address}")
        
        resp = requests.get(url, params={"address": admin_address}, timeout=30)
        resp.raise_for_status()
        
        wallet_info = resp.json()
        print(f"Wallet info response: {wallet_info}")
        
        result_data = wallet_info.get("result", {})
        
        # Check if wallet is activated
        if result_data.get('account_state') == 'uninitialized':
            raise Exception(f"Wallet not activated. Please send at least 0.1 TON to: {admin_address}")
        
        # Check balance
        balance_nano = int(result_data.get('balance', 0))
        balance_ton = balance_nano / 1_000_000_000
        
        if balance_ton < amount_ton:
            raise Exception(f"Insufficient balance. Available: {balance_ton:.6f} TON, Required: {amount_ton:.6f} TON")
        
        # Get seqno
        seqno = result_data.get("seqno", 0)
        print(f"✅ Wallet seqno: {seqno}, Balance: {balance_ton:.6f} TON")
        
        # 4. Create transfer message
        amount_nano = to_nano(amount_ton, "ton")
        print(f"💰 Amount in nanoTON: {amount_nano}")
        
        print("📝 Creating transfer message...")
        transfer = wallet.create_transfer_message(
            to_addr=to_address,
            amount=amount_nano,
            seqno=seqno,
            payload=memo.encode() if memo else None
        )
        print("✅ Transfer message created")
        
        # 5. Serialize to BOC (base64)
        print("🔧 Serializing to BOC...")
        boc_bytes = transfer["message"].to_boc(False)
        boc = base64.b64encode(boc_bytes).decode()
        print(f"✅ BOC created, length: {len(boc)}")
        
        # 6. Send transaction
        send_url = QUICKNODE_BASE.rstrip("/") + "/sendBoc"
        print("📤 Sending transaction to blockchain...")
        
        response = requests.post(send_url, json={"boc": boc}, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        print(f"📥 Blockchain response: {result}")
        
        tx_hash = result.get("result", "")
        
        # Ensure it's stored as a string
        if isinstance(tx_hash, dict):
            tx_hash = json.dumps(tx_hash)
        
        if not tx_hash:
            raise Exception("No transaction hash in response")




        if not tx_hash:
            # Some APIs return hash in different format
            tx_hash = result.get("hash", "")
        
        if not tx_hash:
            raise Exception("No transaction hash in response")
        
        print(f"✅ TRANSACTION SUCCESSFUL!")
        print(f"📄 Transaction hash: {tx_hash}")
        print(f"💸 Sent {amount_ton} TON to {to_address}")
        
        return tx_hash
        
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")
    except Exception as e:
        raise Exception(f"TON transfer failed: {str(e)}")


  




# ---------------------------
# Flask endpoints
# ---------------------------

@app.route('/admin/withdrawals/<int:transaction_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_withdrawal(transaction_id):
    try:
        transaction = Transaction.query.get_or_404(transaction_id)

        if transaction.transaction_type != TransactionType.WITHDRAWAL:
            return jsonify({'success': False, 'message': 'Not a withdrawal'}), 400

        if transaction.status != TransactionStatus.PENDING:
            return jsonify({'success': False, 'message': 'Not pending approval'}), 400

        user = User.query.get(transaction.user_id)
        if not user or not user.wallet_address:
            return jsonify({'success': False, 'message': 'User wallet not found'}), 400

        withdrawal_amount = abs(transaction.amount)
        wallet_address = user.wallet_address.strip()

        if withdrawal_amount <= 0:
            return jsonify({'success': False, 'message': 'Invalid amount'}), 400

        print(f"Approving withdrawal: {withdrawal_amount} TON to {wallet_address}")

        # Check admin wallet balance
        is_activated, admin_address, balance = check_wallet_balance()
        if not is_activated:
            return jsonify({
                'success': False,
                'message': f'Admin wallet not activated. Please send at least 0.1 TON to: {admin_address}'
            }), 400

        print(f"Admin wallet balance: {balance} TON")

        if balance < withdrawal_amount:
            return jsonify({
                'success': False,
                'message': f'Insufficient balance. Available: {balance:.6f} TON, Required: {withdrawal_amount:.6f} TON'
            }), 400

        if not wallet_address.startswith(('EQ', 'UQ', '0:')):
            return jsonify({'success': False, 'message': 'Invalid recipient wallet format'}), 400

        # Send TON (mocked)
        transaction_hash = send_ton_real(
            to_address=wallet_address,
            amount_ton=withdrawal_amount,
            memo=f"Withdrawal #{transaction_id}"
        )

        print(f"TON transfer successful. Transaction hash: {transaction_hash}")

        # Update transaction
        transaction.status = TransactionStatus.COMPLETED
        transaction.transaction_id_on_blockchain = transaction_hash
        transaction.description = f"Withdrawal of {withdrawal_amount} TON sent to user wallet"
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Withdrawal approved and {withdrawal_amount} TON sent',
            'transaction_hash': transaction_hash,
            'transaction': transaction.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Approve error: {str(e)}")

        try:
            transaction.status = TransactionStatus.FAILED
            transaction.description = f"Failed: {str(e)}"
            db.session.commit()
        except:
            db.session.rollback()

        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/wallet-status', methods=['GET'])
def wallet_status():
    """Check admin wallet status."""
    try:
        is_activated, address, balance = check_wallet_balance()
        return jsonify({
            'success': True,
            'activated': is_activated,
            'address': address,
            'balance': balance,
            'message': f"Wallet is {'activated' if is_activated else 'not activated'} with {balance:.6f} TON"
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500














@app.route('/admin/system-users', methods=['POST'], endpoint="create_system_user")

@jwt_required()
@admin_required
def create_system_user():
    """Create a new system user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400
        
        # Check if username already exists
        if SystemUser.get_by_username(data['username']):
            return jsonify({
                'success': False,
                'message': 'Username already exists'
            }), 400
        
        # Check if email already exists
        if SystemUser.get_by_email(data['email']):
            return jsonify({
                'success': False,
                'message': 'Email already exists'
            }), 400
        
        # Validate role
        try:
            role = UserRole(data['role'])
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid role'
            }), 400
        
        # Get current user ID for created_by
        current_user_id = get_jwt_identity()
        
        # Create new user
        new_user = SystemUser(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            role=role,
            created_by=current_user_id
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': new_user.to_dict(),
            'message': 'User created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating user: {str(e)}'
        }), 500



# System Users Management Routes
@app.route('/admin/system-users', methods=['GET'], endpoint="get_system_users")

@jwt_required()
@admin_required
def get_system_users():
    """Get all system users with pagination and search"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '', type=str)
        
        # Build query
        query = SystemUser.query
        
        # Apply search filter
        if search:
            query = query.filter(
                or_(
                    SystemUser.username.ilike(f'%{search}%'),
                    SystemUser.email.ilike(f'%{search}%'),
                    SystemUser.first_name.ilike(f'%{search}%'),
                    SystemUser.last_name.ilike(f'%{search}%')
                )
            )
        
        # Order by creation date and paginate
        users = query.order_by(SystemUser.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': users.page,
                'per_page': users.per_page,
                'total': users.total,
                'pages': users.pages
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching users: {str(e)}'
        }), 500




@app.route('/admin/system-users/<int:user_id>', methods=['PUT'] )

@jwt_required()
@admin_required
def update_system_user(user_id):
    """Update a system user"""
    try:
        user = SystemUser.query.get_or_404(user_id)
        data = request.get_json()
        
        # Get current user
        current_user_id = get_jwt_identity()
        current_user = SystemUser.query.get(current_user_id)
        
        # Prevent users from modifying their own role/status
        if user.id == current_user_id and 'role' in data:
            return jsonify({
                'success': False,
                'message': 'Cannot modify your own role'
            }), 400
        
        # Update username if provided and changed
        if 'username' in data and data['username'] != user.username:
            if SystemUser.get_by_username(data['username']):
                return jsonify({
                    'success': False,
                    'message': 'Username already exists'
                }), 400
            user.username = data['username']
        
        # Update email if provided and changed
        if 'email' in data and data['email'] != user.email:
            if SystemUser.get_by_email(data['email']):
                return jsonify({
                    'success': False,
                    'message': 'Email already exists'
                }), 400
            user.email = data['email']
        
        # Update other fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        
        if 'last_name' in data:
            user.last_name = data['last_name']
        
        if 'role' in data:
            try:
                user.role = UserRole(data['role'])
                # Update permissions based on new role
                user.permissions = user.get_default_permissions(user.role)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid role'
                }), 400
        
        if 'status' in data:
            try:
                user.status = UserStatus(data['status'])
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid status'
                }), 400
        
        # Only super admin can modify permissions directly
        if 'permissions' in data and current_user.role == UserRole.SUPER_ADMIN:
            user.permissions = data['permissions']
        
        if 'timezone' in data:
            user.timezone = data['timezone']
        
        if 'language' in data:
            user.language = data['language']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'User updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating user: {str(e)}'
        }), 500

@app.route('/admin/system-users/<int:user_id>', methods=['DELETE'],endpoint="delete_system_user")

@jwt_required()
@admin_required
def delete_system_user(user_id):
    """Delete a system user"""
    try:
        user = SystemUser.query.get_or_404(user_id)
        
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Prevent users from deleting their own account
        if user.id == current_user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot delete your own account'
            }), 400
        
        # Prevent deletion of super admin users
        if user.role == UserRole.SUPER_ADMIN:
            return jsonify({
                'success': False,
                'message': 'Cannot delete super admin users'
            }), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting user: {str(e)}'
        }), 500

@app.route('/admin/system-users/<int:user_id>/reset-password', methods=['POST'] ,endpoint="reset_system_user")

@jwt_required()
@admin_required
def reset_system_user_password(user_id):
    """Reset a system user's password"""
    try:
        user = SystemUser.query.get_or_404(user_id)
        data = request.get_json()
        
        if not data or 'new_password' not in data:
            return jsonify({
                'success': False,
                'message': 'New password is required'
            }), 400
        
        # Validate password length
        if len(data['new_password']) < 8:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 8 characters long'
            }), 400
        
        # Reset password
        user.set_password(data['new_password'])
        user.must_change_password = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Password reset successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error resetting password: {str(e)}'
        }), 500

# Optional: Get current user profile
@app.route('/admin/system-users/me', methods=['GET'],endpoint="get_system_user")

@jwt_required()
@admin_required
def get_current_system_user():
    """Get current logged-in system user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = SystemUser.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching user profile: {str(e)}'
        }), 500

# Optional: Update current user profile
@app.route('/admin/system-users/me', methods=['PUT'])

@jwt_required()
@admin_required
def update_current_system_user():
    """Update current logged-in system user profile"""
    try:
        current_user_id = get_jwt_identity()
        user = SystemUser.query.get(current_user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        data = request.get_json()
        
        # Users can only update their own basic info, not role/permissions
        allowed_fields = ['first_name', 'last_name', 'timezone', 'language']
        
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating profile: {str(e)}'
        }), 500