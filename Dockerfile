# -------------------------------
# 1) Build React/Vite frontend
# -------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install deps
COPY frontend/package*.json ./
RUN npm ci

# Build
COPY frontend/ .
RUN npm run build


# -------------------------------
# 2) Build Flask backend + bundle frontend
# -------------------------------
FROM python:3.12-slim AS backend

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (adjust if you need DB drivers, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Install backend deps
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt gunicorn

# Copy backend code
COPY backend/ ./backend

# Copy built frontend into backend/static
# (Vite is configured to output to ../backend/static)
COPY --from=frontend-build /app/backend/static ./backend/static

WORKDIR /app/backend

# Expose app port (internal; reverse proxy will front this)
EXPOSE 8080

# DATABASE_URL (and other secrets) must come from env at runtime
# ENV DATABASE_URL="mysql+pymysql://user:pass@host:3306/geo_portfolio"

# Run via gunicorn in production
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
