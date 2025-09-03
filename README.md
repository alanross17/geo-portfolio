# 🌍 Geo Portfolio

A playful geolocation guessing game with a Flask backend and a React + Leaflet frontend.

## ✨ Features
- 🗺️ Interactive map where you drop a pin to guess the photo's location
- 🖼️ Gallery of real-world photos served by the backend
- 📏 Instant feedback showing distance and score
- 🔁 Session scoreboard so you can keep beating your best

## 🧰 Tech Stack
- Backend: 🐍 [Flask](https://flask.palletsprojects.com/) with CORS support
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
python app.py
```

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
This launches both the API (on port 8080) and the frontend (on port 5173).

## 🔌 API Endpoints
- `GET /api/images` – list of available images (no coordinates)
- `GET /api/image/<id>` – details for a single image
- `POST /api/guess` – send `{ image_id, guess: { lat, lng } }` and receive score & solution
- Images are served from `/images/<filename>`

## 🖼️ Adding Your Own Photos
1. Drop images into `backend/static/images/`
2. Add entries to `backend/images.json` with `id`, `file`, `lat`, `lng`, and optional `title`/`subtitle`
3. Restart the backend and enjoy! 🌟

## 📜 License
This project is provided as-is for learning and fun. Feel free to adapt it to your needs.