"""Authentication, validation, and storage helpers for the small admin area."""

from __future__ import annotations

import imghdr
import os
import uuid
from functools import wraps
from pathlib import Path
from urllib.parse import urlparse

from flask import current_app, jsonify, request, session
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename

from models import Image


ALLOWED_IMAGE_TYPES = {"jpeg": "jpg", "png": "png", "gif": "gif", "webp": "webp"}
MAX_TEXT_LENGTH = 255


class ValidationError(ValueError):
    pass


def admin_configured() -> bool:
    return bool(current_app.config.get("ADMIN_PASSWORD_HASH") and current_app.secret_key)


def require_admin(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not admin_configured():
            return jsonify({"error": "Admin authentication is not configured"}), 503
        if not session.get("is_admin"):
            return jsonify({"error": "Admin authentication required"}), 401
        return view(*args, **kwargs)

    return wrapped


def verify_password(password: object) -> bool:
    password_hash = current_app.config.get("ADMIN_PASSWORD_HASH")
    return isinstance(password, str) and bool(password_hash) and check_password_hash(password_hash, password)


def normalize_optional_text(value: object, field_name: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be text")
    normalized = value.strip()
    if len(normalized) > MAX_TEXT_LENGTH:
        raise ValidationError(f"{field_name} must be at most {MAX_TEXT_LENGTH} characters")
    return normalized or None


def validate_instagram_link(value: object) -> str | None:
    link = normalize_optional_text(value, "Instagram link")
    if not link:
        return None
    parsed = urlparse(link)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValidationError("Instagram link must be a valid http(s) URL")
    return link


def parse_coordinates(lat_value: object, lng_value: object) -> tuple[float, float]:
    try:
        lat, lng = float(lat_value), float(lng_value)
    except (TypeError, ValueError):
        raise ValidationError("A map location is required") from None
    if not -90 <= lat <= 90 or not -180 <= lng <= 180:
        raise ValidationError("Location coordinates are out of range")
    return lat, lng


def metadata_from_payload(payload: dict) -> dict:
    return {
        "title": normalize_optional_text(payload.get("title"), "Title"),
        "subtitle": normalize_optional_text(payload.get("subtitle"), "Subtitle"),
        "ig_link": validate_instagram_link(payload.get("igLink")),
    }


def save_uploaded_image(upload, images_path: str) -> str:
    if not upload or not upload.filename:
        raise ValidationError("An image file is required")
    filename = secure_filename(upload.filename)
    if not filename:
        raise ValidationError("The uploaded filename is invalid")

    # Inspect image content rather than accepting a browser-provided MIME type.
    image_type = imghdr.what(upload.stream)
    upload.stream.seek(0)
    if image_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError("Unsupported image type. Use JPEG, PNG, GIF, or WebP")

    extension = ALLOWED_IMAGE_TYPES[image_type]
    stored_filename = f"{uuid.uuid4().hex}.{extension}"
    Path(images_path).mkdir(parents=True, exist_ok=True)
    destination = os.path.join(images_path, stored_filename)
    try:
        upload.save(destination)
    except OSError as exc:
        raise ValidationError("Unable to store the uploaded image") from exc
    return stored_filename


def remove_stored_image(images_path: str, stored_filename: str) -> None:
    try:
        os.remove(os.path.join(images_path, stored_filename))
    except FileNotFoundError:
        pass


def serialize_admin_image(image: Image, build_public_url) -> dict:
    return {
        "id": image.id,
        "title": image.title,
        "subtitle": image.subtitle,
        "igLink": image.ig_link,
        "url": build_public_url(image.relative_url),
        "lat": image.lat,
        "lng": image.lng,
    }