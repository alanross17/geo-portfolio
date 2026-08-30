import json
from flask import request

from utils import build_public_url
from database import Image
from models import GameSession, GuessLog
from image_resources import build_image_resource

# Helpers for API and webservice processing live here


# --- Analytics and Client Logging ---
def get_client_ip() -> str | None:
    """
    Return the IP address of the current client request.

    The address is resolved using the following priority:

    1. ``CF-Connecting-IP``, when the request was proxied through Cloudflare.
    2. The first address in ``X-Forwarded-For``, representing the original
       client in a standard proxy chain.
    3. Flask's ``request.remote_addr`` value as a fallback.

    Returns:
        The client's IP address, or ``None`` if no address is available.

    Security:
        Forwarded IP headers can be spoofed when the application is directly
        accessible by clients. Only trust these values when requests are
        restricted to Cloudflare or another trusted reverse proxy.
    """
    # 1. Prefer Cloudflare header (if you’ve enabled it)
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip

    # 2. Fall back to X-Forwarded-For (left-most is original client)
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()

    # 3. Last resort
    return request.remote_addr


def get_client_geo_from_cf() -> dict[str, str | None]:
    """
    Return Cloudflare-provided geographic information for the current client.

    Geographic values are read from headers added by Cloudflare. Depending on
    the Cloudflare configuration and available features, some or all of these
    headers may be absent.

    Returns:
        A dictionary containing the following geographic fields:

        - ``country``: Two-letter country code from ``CF-IPCountry``.
        - ``region``: State, province, or regional name from ``CF-Region``.
        - ``city``: City name from ``CF-IPCity``.
        - ``lat``: Approximate latitude from ``CF-IPLat``.
        - ``lon``: Approximate longitude from ``CF-IPLon``.

        Each value is returned as a string or ``None`` when its corresponding
        header is unavailable.

    Security:
        These headers should only be trusted when direct access to the
        application is blocked and requests are guaranteed to pass through
        Cloudflare.
    """
    return {
        "country": request.headers.get("CF-IPCountry"),
        "region": request.headers.get("CF-Region"),
        "city": request.headers.get("CF-IPCity"),
        "lat": request.headers.get("CF-IPLat"),
        "lon": request.headers.get("CF-IPLon"),
    }

# --- Session data helpers ---
def serialize_image(image: Image) -> dict:
    return build_image_resource(image, build_public_url)


def serialize_session(game_session: GameSession, images_lookup: dict) -> dict:
    rounds = json.loads(game_session.rounds_json or "[]")
    image_ids = [i for i in game_session.image_order.split(",") if i]
    next_image = None
    if not game_session.finished and len(rounds) < len(image_ids):
        current_id = image_ids[len(rounds)]
        img = images_lookup.get(current_id)
        if img:
            next_image = serialize_image(img)

    return {
        "session_id": game_session.id,
        "round_limit": game_session.round_limit,
        "rounds_played": len(rounds),
        "total_score": game_session.total_score,
        "bonus_total": game_session.bonus_total,
        "finished": game_session.finished,
        "next_image": next_image,
    }


def current_image_for_session(game_session: GameSession, images_lookup: dict):
    rounds = json.loads(game_session.rounds_json or "[]")
    order_ids = [i for i in game_session.image_order.split(",") if i]
    if len(rounds) >= len(order_ids):
        return None
    img_id = order_ids[len(rounds)]
    return images_lookup.get(img_id)


def parse_guess_payload(data):
    if not isinstance(data, dict):
        return None, "Invalid JSON payload"

    guess = data.get("guess")
    if not isinstance(guess, dict):
        return None, "Missing guess payload"

    try:
        guess_lat = float(guess.get("lat"))
        guess_lng = float(guess.get("lng"))
    except (TypeError, ValueError):
        return None, "Invalid or missing guess coordinates"

    return {"lat": guess_lat, "lng": guess_lng}, None


def record_guess(
    session,
    *,
    session_id: str | None,
    image_id: str,
    guess_lat: float,
    guess_lng: float,
    distance_meters: float,
):
    log_entry = GuessLog(
        session_id=session_id,
        image_id=image_id,
        guess_lat=guess_lat,
        guess_lng=guess_lng,
        distance_meters=round(distance_meters, 2),
    )
    session.add(log_entry)

