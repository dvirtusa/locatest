# Stage 1: build React frontend
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim AS backend
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY locatest/ ./locatest/

# Copy built frontend (Vite outDir: '../static' resolves to /app/static)
COPY --from=frontend /app/static ./static

ENV STATIC_FILES_DIR=static
ENV PORT=8080

EXPOSE 8080

CMD ["gunicorn", "locatest.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120"]
