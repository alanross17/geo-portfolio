import os
from math import radians, sin, cos, asin, sqrt
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sqlalchemy import select

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
    # simple score: 5000 max, decreases with distance (tweak as you like)
    # 0 at ~ 20,000 km; feel free to change curve later
    score = max(0, int(5000 * (1 - min(dist_m, 20_000_000) / 20_000_000)))

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
