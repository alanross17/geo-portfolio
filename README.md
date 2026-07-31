# 🌍 Geo Portfolio

Photo portfolio, but in the from of GeoGuessr. Came out of an idea to try to find a more creative way to make a photo website. Also an excuse to practice working in React and merge my photo and development portfolios.

## ✨ Features
- 🗺️ Interactive map where you drop a pin to guess the photo's location
- 🖼️ Gallery of real-world photos served by the backend
- 📏 Instant feedback showing distance and score
- 🔁 Session scoreboard so you can keep beating your best

## 🧰 Tech Stack
- Backend: 🐍 [Flask](https://flask.palletsprojects.com/) with CORS support
- Database: 🗄️ [SQLAlchemy](https://www.sqlalchemy.org/) with MySQL (or SQLite for local dev)
- Frontend: ⚛️ [React](https://react.dev/) powered by [Vite](https://vitejs.dev/)
- Mapping: 🗺️ [Leaflet](https://leafletjs.com/) via [react-leaflet](https://react-leaflet.js.org/)
- Styling: 🎨 [Tailwind CSS](https://tailwindcss.com/)
- Containerization: 🐳 Docker & docker-compose

## 📁 Project Structure
```
geo-portfolio/
├── backend/     # Flask API and image catalog
├── frontend/    # React UI (Vite + Tailwind)
└── docker-compose.yml
```

## 🚀 Quick Start
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Optional: point to MySQL
export DATABASE_URL="mysql+pymysql://user:pass@host:3306/geo_portfolio"
# Required to enable the unlinked /admin page (use a generated password hash).
export FLASK_SECRET_KEY="a-long-random-secret"
export ADMIN_PASSWORD_HASH="$(python -c 'from werkzeug.security import generate_password_hash; print(generate_password_hash("choose-a-password"))')"
python app.py
```

If no `DATABASE_URL` is provided, the app falls back to a local SQLite file (`backend/images.db`). On first run, the database is auto-populated from `backend/images.json` when present.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then open <http://localhost:5173> and start guessing!

### Using Docker
```bash
docker-compose up --build
```
This launches both the API (on port 8080) and the frontend (on port 5173). Set the `DATABASE_URL` environment variable to point at your MySQL instance before building if you don't want the default SQLite database.

## 🔌 API Endpoints
- `GET /api/images` – list of available images (no coordinates)
- `GET /api/image/<id>` – details for a single image
- `POST /api/guess` – send `{ image_id, guess: { lat, lng } }` and receive score & solution
- `POST /api/session` – start a multi-round game session; response includes session ID, round limit, and the next image
- `POST /api/session/<session_id>/guess` – submit a guess within a session; response includes round details, updated totals, and the next image
- `GET /api/session/<session_id>/summary` – fetch the full summary for a session (totals and all rounds)
- `GET /api/leaderboard` – retrieve the top leaderboard entries
- `POST /api/leaderboard` – submit a finished session score to the leaderboard
- Responsive images are served from `/images/<image-id>/<variant>.<jpg|webp>`

## 🖼️ Adding Your Own Photos
1. Drop images into `data/images/`
2. Insert a new row into the `images` table with fields: `id`, `relative_url` (e.g. `images/my-photo.jpg`), `lat`, `lng`, and optional `title`/`subtitle`
3. Restart the backend and enjoy! 🌟

> New installations should use the admin upload rather than inserting files
> directly. The manual steps above describe only the legacy catalog format.

## Responsive image storage and rollout

Admin uploads keep the untouched bytes at
`originals/<image-id>/original.<source-extension>` and generated public files at
`variants/<image-id>/<variant>.<format>` beneath `IMAGE_STORAGE_ROOT` (default
`backend/media/images`). Random UUID-hex IDs prevent filename collisions.

The manifest in `backend/image_processing.py` defines placeholder (40), thumb
(320), small (640), medium (1280), large (1920), and xlarge (2560) long edges.
Images are EXIF-oriented and never enlarged; xlarge is only made above 1920 px.
JPEG is progressive at quality 86, WebP uses quality 84/method 6, and the JPEG
placeholder uses quality 35. Public files omit EXIF/GPS/ICC metadata and JPEG
alpha is composited on white; the original remains byte-for-byte unchanged.

Resources expose `id`, dimensions, numeric `aspectRatio`, `placeholder`, grouped
`sources`, and `fallbackUrl`. Transitional `url` aliases the large (or largest)
JPEG. Admin responses add original filename/format, status/version, and an
authenticated `/api/admin/images/<image-id>/original` URL, but never paths.

```bash
flask --app app migrate-images --dry-run
flask --app app migrate-images
flask --app app migrate-images --regenerate
```

Migration is per-record, restartable, preserves stable IDs and legacy files,
continues after failures, and returns non-zero for any failure. Roll back with a
database backup and retained legacy files. Increment `PROCESSING_VERSION` and run
`--regenerate` after future manifest changes. The database-guarded legacy
`/images/<filename>` route remains temporarily and logs use.

To seed via JSON for quick demos, you can still place entries in `backend/images.json`; they are only imported automatically when the database is empty.

### Admin settings
The unlinked `/admin` route lets an administrator add photos and edit titles, subtitles, and Instagram links. It is only enabled when both `FLASK_SECRET_KEY` and `ADMIN_PASSWORD_HASH` are configured. The backend uses an HttpOnly, SameSite signed session cookie; set `SESSION_COOKIE_SECURE=false` only for local HTTP development. Uploaded JPEG, PNG, and WebP files are validated and stored in `backend/static/images/`, while their paths and metadata remain in the database.

## 📜 License
This project is provided as-is for learning and fun. Feel free to adapt it to your needs.