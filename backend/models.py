from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Image(Base):
    __tablename__ = "images"

    id = Column(String(128), primary_key=True)
    relative_url = Column(String(255), nullable=False)
    title = Column(String(255))
    subtitle = Column(String(255))
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

class GameSession(Base):
    __tablename__ = "game_sessions"

    id = Column(String(64), primary_key=True)
    image_order = Column(Text, nullable=False)
    round_limit = Column(Integer, nullable=False, default=5)
    rounds_json = Column(Text, nullable=False, default="[]")
    total_score = Column(Integer, nullable=False, default=0)
    bonus_total = Column(Integer, nullable=False, default=0)
    finished = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    score = Column(Integer, nullable=False)
    session_id = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)