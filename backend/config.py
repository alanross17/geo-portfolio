import os

BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_PATH = os.environ.get("IMAGE_STORAGE_ROOT", os.path.join(BASE_DIR, "media", "images"))
FRONTEND_BUILD = os.path.join(BASE_DIR, "static", "app")
FRONTEND_ASSETS = os.path.join(FRONTEND_BUILD, "assets")

UNUSED_SESSION_MAX_AGE_MINUTES = int(os.environ.get("UNUSED_SESSION_MAX_AGE_MINUTES", "60"))
DB_PURGE_RUN_CHANCE = 0.05 # ~5% chance

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MiB

ROUND_LIMIT = 5
BONUS_RADIUS_METERS = 25_000
BONUS_POINTS = 500
