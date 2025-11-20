from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base, Mapped, mapped_column

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

    # User Info
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    country: Mapped[str | None] = mapped_column(String(2), nullable=True)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    score = Column(Integer, nullable=False)
    session_id = Column(String(64), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class GuessLog(Base):
    __tablename__ = "guess_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=True)
    image_id = Column(String(128), nullable=False)
    guess_lat = Column(Float, nullable=False)
    guess_lng = Column(Float, nullable=False)
    distance_meters = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)