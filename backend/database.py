import json
import os
from contextlib import contextmanager

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from models import Base, GameSession, Image, LeaderboardEntry

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "images.db")

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    engine_kwargs = {}
else:
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    engine_kwargs = {"connect_args": {"check_same_thread": False}}

engine = create_engine(DATABASE_URL, future=True, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)


@contextmanager
def get_session() -> Session:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db(seed_file: str | None = None) -> None:
    """Create tables and optionally seed from a JSON file when empty."""
    Base.metadata.create_all(bind=engine)

    if not seed_file or not os.path.exists(seed_file):
        return

    with get_session() as session:
        has_rows = session.scalars(select(Image.id)).first()
        if has_rows:
            return

        with open(seed_file, "r", encoding="utf8mb4") as fh:
            payload = json.load(fh)

        for item in payload:
            relative_url = item.get("relative_url")
            file_name = item.get("file")
            if not relative_url and file_name:
                relative_url = os.path.join("images", file_name)
            if not relative_url:
                raise ValueError(f"Image entry {item.get('id')} is missing a relative URL")

            image = Image(
                id=item["id"],
                relative_url=relative_url.strip("/"),
                title=item.get("title"),
                subtitle=item.get("subtitle"),
                lat=float(item["lat"]),
                lng=float(item["lng"]),
            )
            session.add(image)

        # session is committed automatically by context manager