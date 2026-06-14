from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class InstagramAccount(Base):
    __tablename__ = "instagram_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_username = Column(String, nullable=False)
    password_encrypted = Column(String, nullable=True)
    monitoring_status = Column(String, default="stopped", nullable=False)
    session_started_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="instagram_accounts")
    posts = relationship("Post", back_populates="account", cascade="all, delete-orphan")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    instagram_post_id = Column(String, unique=True, index=True, nullable=False)
    account_id = Column(Integer, ForeignKey("instagram_accounts.id"), nullable=False, index=True)
    post_url = Column(String, nullable=False)

    account = relationship("InstagramAccount", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")