import json, os, random
from math import radians, sin, cos, asin, sqrt
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_PATH = os.path.join(BASE_DIR, "static", "images")
FRONTEND_BUILD = os.path.join(BASE_DIR, "static", "app")

app = Flask(__name__, static_folder=FRONTEND_BUILD, static_url_path="/")
CORS(app)  # dev-friendly; in prod you may restrict origins

with open(os.path.join(BASE_DIR, "images.json"), "r") as f:
    CATALOG = json.load(f)

# Ensure each catalog item has a public URL:
BASE_URL = os.environ.get("PUBLIC_BASE_URL", "")
for item in CATALOG:
    # If a PUBLIC_BASE_URL env var is set, prefix image URLs with it so that
    # the frontend can resolve images correctly when the backend is served
    # behind a proxy or a non-root path.
    base = BASE_URL.rstrip("/")
    item["url"] = f"{base}/images/{item['file']}" if base else f"/images/{item['file']}"

def haversine(lat1, lon1, lat2, lon2):
    # returns distance in meters
    R = 6371000.0
    dlat = radians(lat2-lat1)
    dlon = radians(lon2-lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))

@app.get("/api/images")
def api_images():
    # Don’t leak coordinates here—frontend doesn’t need them for listing.
    safe = [{k: v for k, v in i.items() if k not in ("lat","lng")} for i in CATALOG]
    return jsonify(safe)

@app.get("/api/image/<image_id>")
def api_image(image_id):
    item = next((i for i in CATALOG if i["id"] == image_id), None)
    if not item:
        return jsonify({"error": "not found"}), 404
    # don’t send coords here either
    safe = {k: v for k, v in item.items() if k not in ("lat","lng")}
    return jsonify(safe)

@app.post("/api/guess")
def api_guess():
    data = request.get_json(force=True)
    image_id = data.get("image_id")
    guess = data.get("guess", {})
    guess_lat = float(guess.get("lat"))
    guess_lng = float(guess.get("lng"))

    item = next((i for i in CATALOG if i["id"] == image_id), None)
    if not item:
        return jsonify({"error": "not found"}), 404

    dist_m = haversine(guess_lat, guess_lng, item["lat"], item["lng"])
    # simple score: 5000 max, decreases with distance (tweak as you like)
    # 0 at ~ 20,000 km; feel free to change curve later
    score = max(0, int(5000 * (1 - min(dist_m, 20_000_000)/20_000_000)))

    payload = {
        "distance_meters": round(dist_m, 2),
        "score": score,
        "solution": {
            "lat": item["lat"],
            "lng": item["lng"],
            "title": item.get("title"),
            "subtitle": item.get("subtitle")
        }
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
