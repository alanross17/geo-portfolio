import json
import random
import uuid
import os
from math import radians, sin, cos, asin, sqrt, exp
from typing import List
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import select

from database import Image, get_session, init_db
from models import GameSession, LeaderboardEntry

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_PATH = os.path.join(BASE_DIR, "static", "images")
FRONTEND_BUILD = os.path.join(BASE_DIR, "static", "app")

app = Flask(__name__, static_folder=FRONTEND_BUILD, static_url_path="/")
CORS(app)  # dev-friendly; in prod you may restrict origins

# Initialize database and seed from the legacy JSON file if it's present.
init_db(os.path.join(BASE_DIR, "images.json"))

BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")

ROUND_LIMIT = 5
BONUS_RADIUS_METERS = 25_000
BONUS_POINTS = 500


def build_public_url(relative_url: str) -> str:
    rel = relative_url.lstrip("/")
    if BASE_URL:
        return f"{BASE_URL}/{rel}"
    return f"/{rel}"


def serialize_image(image: Image) -> dict:
    return {
        "id": image.id,
        "title": image.title,
        "subtitle": image.subtitle,
        "url": build_public_url(image.relative_url),
    }

def haversine(lat1, lon1, lat2, lon2):
    # returns distance in meters
    R = 6371000.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * asin(sqrt(a))

def calc_score(dist_m) -> int:
    # score function
    # exponential decay, emphasizes close guesses
    D_MAX = 20_000_0000 # (m) max scorable distance, based on the rough maximum distance between places on a globe
    SCORE_MAX = 5000 # the maximum allowable score (perfect guess)
    LAMBDA = 4_000_000 # is a “scale” parameter (in m). Roughly: distance where score has dropped to ~37% of max.

    # Example scores with λ = 4000:
    # 0 km → 5000
    # 1,000 km → ~3,894
    # 2,000 km → ~3,033
    # 5,000 km → ~1,433
    # 10,000 km → ~410
    # 20,000 km → ~34

    if dist_m > D_MAX:
        return 0

    return round(SCORE_MAX * exp(-dist_m / LAMBDA))

def choose_image_order(session) -> List[str]:
    images = session.scalars(select(Image)).all()
    if not images:
        raise ValueError("No images available")
    ids = [img.id for img in images]
    random.shuffle(ids)
    return ids[: ROUND_LIMIT + 2]


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

def compute_bonus(distance_meters: float) -> int:
    return BONUS_POINTS if distance_meters <= BONUS_RADIUS_METERS else 0

def current_image_for_session(game_session: GameSession, images_lookup: dict):
    rounds = json.loads(game_session.rounds_json or "[]")
    order_ids = [i for i in game_session.image_order.split(",") if i]
    if len(rounds) >= len(order_ids):
        return None
    img_id = order_ids[len(rounds)]
    return images_lookup.get(img_id)

# All API Stuff
@app.get("/api/images")
def api_images():
    with get_session() as session:
        images = session.scalars(select(Image)).all()
    safe = [serialize_image(image) for image in images]
    return jsonify(safe)

@app.get("/api/image/<image_id>")
def api_image(image_id):
    with get_session() as session:
        image = session.get(Image, image_id)
    if not image:
        return jsonify({"error": "not found"}), 404
    safe = serialize_image(image)
    return jsonify(safe)

# Serve images
@app.get("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_PATH, filename)

@app.post("/api/guess")
def api_guess():
    data = request.get_json(force=True)
    image_id = data.get("image_id")
    guess = data.get("guess", {})
    guess_lat = float(guess.get("lat"))
    guess_lng = float(guess.get("lng"))

    with get_session() as session:
        image = session.get(Image, image_id)
    if not image:
        return jsonify({"error": "not found"}), 404

    dist_m = haversine(guess_lat, guess_lng, image.lat, image.lng)
    score = calc_score(dist_m)

    payload = {
        "distance_meters": round(dist_m, 2),
        "score": score,
        "solution": {
            "lat": image.lat,
            "lng": image.lng,
            "title": image.title,
            "subtitle": image.subtitle,
        },
    }
    return jsonify(payload)

@app.post("/api/session")
def api_start_session():
    with get_session() as session:
        order = choose_image_order(session)
        order_str = ",".join(order)
        game_session = GameSession(
            id=uuid.uuid4().hex,
            image_order=order_str,
            round_limit=ROUND_LIMIT,
        )
        session.add(game_session)
        session.flush()
        images_lookup = {img.id: img for img in session.scalars(select(Image)).all()}
        payload = serialize_session(game_session, images_lookup)
    return jsonify(payload)

@app.post("/api/session/<session_id>/guess")
def api_session_guess(session_id):
    data = request.get_json(force=True)
    guess = data.get("guess", {})
    guess_lat = float(guess.get("lat"))
    guess_lng = float(guess.get("lng"))

    with get_session() as session:
        game_session = session.get(GameSession, session_id)
        if not game_session:
            return jsonify({"error": "session not found"}), 404
        if game_session.finished:
            return jsonify({"error": "session finished"}), 400

        images_lookup = {img.id: img for img in session.scalars(select(Image)).all()}
        image = current_image_for_session(game_session, images_lookup)
        if not image:
            return jsonify({"error": "no more rounds"}), 400

        dist_m = haversine(guess_lat, guess_lng, image.lat, image.lng)
        score = calc_score(dist_m)
        round_bonus = compute_bonus(dist_m)
        total_round_score = score + round_bonus

        rounds = json.loads(game_session.rounds_json or "[]")
        rounds.append(
            {
                "distance_meters": round(dist_m, 2),
                "score": score,
                "roundBonus": round_bonus,
                "totalScore": total_round_score,
                "solution": {
                    "lat": image.lat,
                    "lng": image.lng,
                    "title": image.title,
                    "subtitle": image.subtitle,
                },
                "guess": {"lat": guess_lat, "lng": guess_lng},
            }
        )

        game_session.rounds_json = json.dumps(rounds)
        game_session.total_score += total_round_score
        game_session.bonus_total += round_bonus
        if len(rounds) >= game_session.round_limit:
            game_session.finished = True

        session.add(game_session)
        session.flush()

        next_image = current_image_for_session(game_session, images_lookup)
        payload = {
            "round": rounds[-1],
            "totals": {
                "total_score": game_session.total_score,
                "bonus_total": game_session.bonus_total,
                "rounds_played": len(rounds),
                "round_limit": game_session.round_limit,
                "finished": game_session.finished,
            },
            "next_image": serialize_image(next_image) if next_image else None,
        }
    return jsonify(payload)


@app.get("/api/session/<session_id>/summary")
def api_session_summary(session_id):
    with get_session() as session:
        game_session = session.get(GameSession, session_id)
        if not game_session:
            return jsonify({"error": "session not found"}), 404
        rounds = json.loads(game_session.rounds_json or "[]")
    return jsonify(
        {
            "total_score": game_session.total_score,
            "bonus_total": game_session.bonus_total,
            "rounds_played": len(rounds),
            "round_limit": game_session.round_limit,
            "finished": game_session.finished,
            "rounds": rounds,
        }
    )


@app.get("/api/leaderboard")
def api_leaderboard():
    with get_session() as session:
        entries = (
            session.query(LeaderboardEntry)
            .order_by(LeaderboardEntry.score.desc(), LeaderboardEntry.created_at.asc())
            .limit(25)
            .all()
        )
    payload = [
        {"name": entry.name, "score": entry.score, "session_id": entry.session_id}
        for entry in entries
    ]
    return jsonify(payload)


@app.post("/api/leaderboard")
def api_add_leaderboard():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    session_id = data.get("session_id")

    if not name or not session_id:
        return jsonify({"error": "name and session_id required"}), 400

    with get_session() as session:
        game_session = session.get(GameSession, session_id)
        if not game_session or not game_session.finished:
            return jsonify({"error": "session not complete"}), 400

        entry = LeaderboardEntry(name=name[:128], score=game_session.total_score, session_id=session_id)
        session.add(entry)
        session.flush()

        entries = (
            session.query(LeaderboardEntry)
            .order_by(LeaderboardEntry.score.desc(), LeaderboardEntry.created_at.asc())
            .limit(25)
            .all()
        )
        payload = [
            {"name": item.name, "score": item.score, "session_id": item.session_id}
            for item in entries
        ]
    return jsonify(payload)

# (Optional) serve built frontend in production
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    index_path = os.path.join(FRONTEND_BUILD, "index.html")
    if os.path.exists(index_path):
        return app.send_static_file("index.html")
    return jsonify({"status": "frontend not built"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8080")))
