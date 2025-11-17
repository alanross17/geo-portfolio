# 🌍 Geo Portfolio

A playful geolocation guessing game with a Flask backend and a React + Leaflet frontend.

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

## 📜 License
This project is provided as-is for learning and fun. Feel free to adapt it to your needs.