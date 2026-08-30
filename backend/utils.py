import logging
import os

from config import BASE_URL


logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


def build_public_url(relative_url: str) -> str:
    rel = relative_url.lstrip("/")
    if BASE_URL:
        return f"{BASE_URL}/{rel}"
    return f"/{rel}"