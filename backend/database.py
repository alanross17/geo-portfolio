import json
import os
from contextlib import contextmanager

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from models import Base, GameSession, GuessLog, Image, LeaderboardEntry

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "images.db")

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    database_url = make_url(DATABASE_URL)
    # MySQL's historical ``utf8`` character set only stores three-byte
    # characters. Emoji require utf8mb4 on both the connection and columns.
    if database_url.get_backend_name() == "mysql":
        database_url = database_url.update_query_dict({"charset": "utf8mb4"})
    DATABASE_URL = database_url
    engine_kwargs = {}
else:
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    engine_kwargs = {"connect_args": {"check_same_thread": False}}

engine = create_engine(DATABASE_URL, future=True, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)


def _ensure_mysql_utf8mb4(connection) -> None:
    """Upgrade the image catalog's textual columns for four-byte Unicode."""
    if connection.dialect.name != "mysql":
        return

    requires_conversion = connection.scalar(text("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'images'
              AND CHARACTER_SET_NAME IS NOT NULL
              AND CHARACTER_SET_NAME <> 'utf8mb4'
        )
    """))
    if requires_conversion:
        connection.execute(text(
            "ALTER TABLE images CONVERT TO CHARACTER SET utf8mb4 "
            "COLLATE utf8mb4_unicode_ci"
        ))


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

    # This project historically used create_all without Alembic. create_all()
    # creates missing tables but does not modify existing ones, so reconcile
    # the small set of schema additions expected by the current application.
    inspector = inspect(engine)

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("images")
    }
    existing_indexes = {
        index["name"]
        for index in inspector.get_indexes("images")
    }

    additions = {
        "image_uid": "VARCHAR(32)",
        "original_filename": "VARCHAR(255)",
        "original_format": "VARCHAR(16)",
        "original_location": "VARCHAR(255)",
        "width": "INTEGER",
        "height": "INTEGER",
        "aspect_ratio": "NUMERIC(16,8)",
        "generated_variants": "TEXT",
        "processing_status": "VARCHAR(32)",
        "processing_version": "INTEGER",
        "variant_generation": "VARCHAR(32)",
    }

    with engine.begin() as connection:
        for name, sql_type in additions.items():
            if name not in existing_columns:
                connection.execute(
                    text(f"ALTER TABLE images ADD COLUMN {name} {sql_type}")
                )

        if "ix_images_image_uid" not in existing_indexes:
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX ix_images_image_uid "
                    "ON images(image_uid)"
                )
            )

        # create_all() cannot change the charset of an existing MySQL table.
        # Convert after adding columns so titles, subtitles, and original file
        # names can all contain emoji on both old and new installations.
        _ensure_mysql_utf8mb4(connection)

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
            
            ig_link = item.get("ig_link") or item.get("ig_links") or item.get("igLink")

            image = Image(
                id=item["id"],
                relative_url=relative_url.strip("/"),
                title=item.get("title"),
                subtitle=item.get("subtitle"),
                ig_link=ig_link,
                lat=float(item["lat"]),
                lng=float(item["lng"]),
            )
            session.add(image)

        # session is committed automatically by context manager