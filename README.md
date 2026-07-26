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
- Images are served from `/images/<filename>`

## 🖼️ Adding Your Own Photos
1. Drop images into `backend/static/images/`
2. Insert a new row into the `images` table with fields: `id`, `relative_url` (e.g. `images/my-photo.jpg`), `lat`, `lng`, and optional `title`/`subtitle`
3. Restart the backend and enjoy! 🌟

To seed via JSON for quick demos, you can still place entries in `backend/images.json`; they are only imported automatically when the database is empty.

### Admin settings
The unlinked `/admin` route lets an administrator add photos and edit titles, subtitles, and Instagram links. It is only enabled when both `FLASK_SECRET_KEY` and `ADMIN_PASSWORD_HASH` are configured. The backend uses an HttpOnly, SameSite signed session cookie; set `SESSION_COOKIE_SECURE=false` only for local HTTP development. Uploaded JPEG, PNG, GIF, and WebP files are validated and stored in `backend/static/images/`, while their paths and metadata remain in the database.

## 📜 License
This project is provided as-is for learning and fun. Feel free to adapt it to your needs.