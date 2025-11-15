import os
from math import radians, sin, cos, asin, sqrt, exp
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import select
import logging

from database import Image, get_session, init_db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_PATH = os.path.join(BASE_DIR, "static", "images")
FRONTEND_BUILD = os.path.join(BASE_DIR, "static", "app")

app = Flask(__name__, static_folder=FRONTEND_BUILD, static_url_path="/")
CORS(app)  # dev-friendly; in prod you may restrict origins

# Initialize database and seed from the legacy JSON file if it's present.
init_db(os.path.join(BASE_DIR, "images.json"))

BASE_URL = os.environ.get("PUBLIC_BASE_URL", "").rstrip("/")


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

@app.get("/api/images")
def api_images():
    with get_session() as session:
        images = session.scalars(select(Image)).all()
    safe = [serialize_image(image) for image in images]
    return jsonify(safe)

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

    score = dist_m
    if dist_m > D_MAX:
        score = 0
    else:
        score = round(SCORE_MAX * exp( -dist_m / LAMBDA))

    return score

@app.get("/api/image/<image_id>")
def api_image(image_id):
    with get_session() as session:
        image = session.get(Image, image_id)
    if not image:
        return jsonify({"error": "not found"}), 404
    safe = serialize_image(image)
    return jsonify(safe)

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

# Serve images
@app.get("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_PATH, filename)

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
