import random
from datetime import datetime, timedelta
from sqlalchemy import delete, exists, or_, select

from config import (
    UNUSED_SESSION_MAX_AGE_MINUTES,
    DB_PURGE_RUN_CHANCE,
)
from database import Image
from models import GameSession, GuessLog
from utils import logger


# Helpers for DB management live here

def maybe_purge_unused_sessions(session):
    """
    Randomly run cleanup of stale, unused game sessions.

    Cleanup is performed with the probability configured by
    ``DB_PURGE_RUN_CHANCE``. This allows stale sessions to be removed
    periodically without running a database cleanup query on every request.

    Args:
        session: The SQLAlchemy database session used to execute the cleanup.

    Note:
        This function does not explicitly commit the transaction. Any deleted
        sessions are committed or rolled back with the caller's transaction.
    """
    if random.random() < DB_PURGE_RUN_CHANCE:
        purge_unused_sessions(session)


def purge_unused_sessions(session) -> int:
    """
    Delete stale game sessions that have never recorded a guess.

    A session is considered stale when it was created more than
    ``UNUSED_SESSION_MAX_AGE_MINUTES`` ago. Sessions referenced by at least
    one ``GuessLog`` record are preserved regardless of age.

    Args:
        session: The SQLAlchemy database session used to execute the deletion.

    Returns:
        The number of game-session records deleted. Returns ``0`` when no
        eligible sessions were found or when the database does not report an
        affected-row count.

    Note:
        This function executes the deletion but does not explicitly commit it.
        The caller is responsible for committing or rolling back the enclosing
        transaction.
    """

    cutoff = datetime.utcnow() - timedelta(minutes=UNUSED_SESSION_MAX_AGE_MINUTES)
    stmt = delete(GameSession).where(
        GameSession.created_at < cutoff,
        ~exists().where(GuessLog.session_id == GameSession.id),
    )
    result = session.execute(stmt)
    deleted_rows = result.rowcount or 0
    if deleted_rows:
        logger.info("Purged %s unused sessions", deleted_rows)
    return deleted_rows


def find_image(db_session, image_id):
    """
    Find an image by its database ID or public image UID.

    The supplied identifier is compared against both ``Image.id`` and
    ``Image.image_uid``. The first matching image is returned.

    Args:
        db_session: The SQLAlchemy database session used to perform the query.
        image_id: The database ID or public UID of the requested image.

    Returns:
        The matching ``Image`` instance, or ``None`` if no image has either
        identifier.
    """
    return db_session.scalar(select(Image).where(or_(Image.id == image_id, Image.image_uid == image_id)))