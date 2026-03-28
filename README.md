# oulad-visual-analytics
Aplicacion de visual analytics para analizar actividad de estudiantes en un LMS usando OULAD. Genera metricas semanales, perfiles de aprendizaje y dashboards interactivos para apoyar decisiones docentes.

## Requisitos
- Docker y Docker Compose (para ejecucion con contenedores).
- Python 3.12 (backend y worker, si se ejecuta local).
- Node.js 22+ (frontend, si se ejecuta local).
- Dataset OULAD en `data/raw/oulad/` (ver seccion de datos).

## Estructura clave
- `backend/`: API FastAPI (puerto 8000).
- `frontend/`: Vite + React (puerto 5173).
- `worker/`: pipeline de procesamiento y clustering.
- `data/`: datos raw/processed/artifacts montados en contenedores.

## Datos
Coloca el dataset OULAD en `data/raw/oulad/`. La carpeta ya contiene un ejemplo con `OULAD.zip` y CSVs en `data/raw/oulad/csv/`.

## Ejecutar con Docker (recomendado)
Levanta base de datos, API, worker y frontend:

```bash
cd oulad-visual-analytics
docker compose up --build
```

Servicios y puertos:
- API: `http://localhost:8000` (health: `http://localhost:8000/health`).
- Frontend: `http://localhost:5173`.
- Postgres: `localhost:5432`.

Variables en `docker-compose.yml` (con defaults):
- `POSTGRES_DB=tfm`, `POSTGRES_USER=tfm`, `POSTGRES_PASSWORD=tfm`.
- `DATABASE_URL=postgresql+psycopg://...`.
- `DATA_DIR=/data`, `RAW_DIR=/data/raw`, `PROCESSED_DIR=/data/processed`, `ARTIFACTS_DIR=/data/artifacts`.
- `VITE_API_URL=http://localhost:8000`.

## Ejecutar local (sin Docker)
### 1) Base de datos
Puedes usar Docker solo para Postgres:

```bash
cd oulad-visual-analytics
docker compose up db
```

### 2) Backend (FastAPI)

```bash
cd oulad-visual-analytics/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://tfm:tfm@localhost:5432/tfm"
export DATA_DIR="$PWD/../data"
export PROCESSED_DIR="$DATA_DIR/processed"
export ARTIFACTS_DIR="$DATA_DIR/artifacts"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Si usas fish, activa el entorno con:

```fish
source .venv/bin/activate.fish
```

### 3) Worker (pipeline)

```bash
cd oulad-visual-analytics/worker
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg://tfm:tfm@localhost:5432/tfm"
export DATA_DIR="$PWD/../data"
export RAW_DIR="$DATA_DIR/raw"
export PROCESSED_DIR="$DATA_DIR/processed"
export ARTIFACTS_DIR="$DATA_DIR/artifacts"
python -m jobs.00_smoke
```

Ejecutar un job especifico (ejemplo):

```bash
python -m jobs.01_ingest_oulad
```

### 4) Frontend (Vite)

```bash
cd oulad-visual-analytics/frontend
npm install
VITE_API_URL="http://localhost:8000" npm run dev -- --host 0.0.0.0 --port 5173
```

Abre `http://localhost:5173` en el navegador.

## Verificaciones rapidas
- API: `GET http://localhost:8000/health` debe devolver `{ "status": "ok" }`.
- Worker: `python -m jobs.00_smoke` imprime las rutas y verifica carpetas.

## Notas
- Las carpetas de `data/` se montan en contenedores con Docker Compose.
- Si cambias el puerto del backend, ajusta `VITE_API_URL` en el frontend.
