# OULAD Visual Analytics

Aplicación de visual analytics para analizar la actividad semanal de estudiantes en un LMS usando el dataset OULAD. El proyecto construye métricas de interacción, perfiles de aprendizaje, alertas de riesgo académico y una pantalla de evaluación del modelo predictivo para apoyar el seguimiento docente.

## Funcionalidades

- Dashboard web con indicadores por curso, semana, estudiante y cluster.
- Pipeline de datos para ingesta, generación de eventos, features semanales, clustering y mart analítico.
- Alertas de riesgo basadas en caída de actividad, baja interacción y baja diversidad de recursos.
- Modelo predictivo multiclase para estimar el resultado académico final.
- Métricas del modelo: accuracy, F1 weighted, métricas por fold, distribución de clases e importancia de variables.
- Configuración de pesos del modelo de riesgo y registro de feedback docente.

## Arquitectura

El proyecto está dividido en cuatro piezas principales:

- `frontend/`: aplicación React + Vite + Material UI. Expone la interfaz en `http://localhost:5173`.
- `backend/`: API FastAPI. Expone datos analíticos, feedback, configuración de riesgo y metadata del clasificador en `http://localhost:8000`.
- `worker/`: pipeline batch que procesa OULAD y genera archivos Parquet y artefactos de modelos.
- `data/`: volumen compartido con datos raw, datasets procesados y artefactos entrenados.

Servicios de Docker Compose:

- `db`: PostgreSQL 16 para feedback, auditoría y configuración operacional.
- `api`: backend FastAPI.
- `worker`: ejecuta el pipeline completo.
- `web`: frontend Vite.
- `pgadmin`: administración opcional de PostgreSQL en `http://localhost:5050`.

## Requisitos

Para ejecución con Docker:

- Docker
- Docker Compose
- Dataset OULAD en `data/raw/oulad/`

Para ejecución local:

- Python 3.12
- Node.js 22+
- PostgreSQL 16 o el servicio `db` de Docker Compose

## Datos

Coloca el dataset OULAD en:

```text
data/raw/oulad/
```

La estructura esperada es:

```text
data/
  raw/
    oulad/
      OULAD.zip
      csv/
        assessments.csv
        courses.csv
        studentAssessment.csv
        studentInfo.csv
        studentRegistration.csv
        studentVle.csv
        vle.csv
```

El pipeline genera:

```text
data/processed/events.parquet
data/processed/weekly_features.parquet
data/processed/weekly_features_clustered.parquet
data/processed/mart.parquet
data/processed/mart_clean.parquet
```

Y los artefactos:

```text
data/artifacts/clustering/kmeans.joblib
data/artifacts/clustering/scaler.joblib
data/artifacts/clustering/meta.json
data/artifacts/clustering/cluster_labels.json
data/artifacts/classifier/classifier.joblib
data/artifacts/classifier/label_encoder.joblib
data/artifacts/classifier/classifier_meta.json
```

## Ejecución Con Docker

Levanta toda la aplicación:

```bash
docker compose up --build
```

URLs principales:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- Healthcheck: `http://localhost:8000/health`
- PgAdmin: `http://localhost:5050`
- PostgreSQL: `localhost:5432`

El servicio `worker` ejecuta automáticamente:

```bash
python -m run_pipeline
```

Si modificas código del backend con los contenedores levantados, reinicia la API:

```bash
docker compose restart api
```

Si modificas el pipeline o necesitas regenerar datos y modelos:

```bash
docker compose run --rm worker
```

## Pipeline

El pipeline completo está definido en [worker/run_pipeline.py](worker/run_pipeline.py):

1. `jobs.00_smoke`: verifica rutas y carpetas base.
2. `jobs.01_ingest_oulad`: prepara la ingesta del dataset OULAD.
3. `jobs.02_build_events`: construye eventos normalizados.
4. `jobs.03_weekly_features`: agrega features semanales por estudiante.
5. `jobs.04_cluster_profiles`: entrena clustering y asigna perfiles.
6. `jobs.05_build_mart`: construye el mart analítico.
7. `jobs.06_clean_mart`: limpia y estabiliza el mart para consumo.
8. `jobs.07_cluster_labels`: genera etiquetas descriptivas de clusters.
9. `jobs.08_train_classifier`: entrena el clasificador predictivo y guarda métricas.

Ejecutar un job puntual dentro del contenedor:

```bash
docker compose run --rm worker python -m jobs.08_train_classifier
```

## Ejecución Local

### 1. Base De Datos

Puedes usar solo PostgreSQL desde Docker:

```bash
docker compose up db
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="postgresql+psycopg://tfm:tfm@localhost:5432/tfm"
export DATA_DIR="$PWD/../data"
export PROCESSED_DIR="$DATA_DIR/processed"
export ARTIFACTS_DIR="$DATA_DIR/artifacts"

uvicorn app.main:app --host 0.0.0.0 --port 8000
```

En fish:

```fish
source .venv/bin/activate.fish
```

### 3. Worker

```bash
cd worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export DATABASE_URL="postgresql+psycopg://tfm:tfm@localhost:5432/tfm"
export DATA_DIR="$PWD/../data"
export RAW_DIR="$DATA_DIR/raw"
export PROCESSED_DIR="$DATA_DIR/processed"
export ARTIFACTS_DIR="$DATA_DIR/artifacts"

python -m run_pipeline
```

Ejecutar un job específico:

```bash
python -m jobs.00_smoke
python -m jobs.08_train_classifier
```

### 4. Frontend

```bash
cd frontend
npm install
VITE_API_URL="http://localhost:8000" npm run dev -- --host 0.0.0.0 --port 5173
```

Abre:

```text
http://localhost:5173
```

## API Principal

Endpoints de consulta:

- `GET /health`
- `GET /courses`
- `POST /analytics/reload`
- `GET /analytics/courses/{course_id}/overview`
- `GET /analytics/courses/{course_id}/weeks`
- `GET /analytics/courses/{course_id}/students`
- `GET /analytics/courses/{course_id}/profiles`
- `GET /analytics/courses/{course_id}/alerts?week_id=10&top=20`
- `GET /analytics/students/{user_id}/trajectory?course_id=AAA_2013J`
- `GET /analytics/classifier/meta`
- `GET /analytics/courses/{course_id}/cluster-outcomes`

Endpoints operacionales:

- `GET /ops/alerts/feedback`
- `POST /ops/alerts/feedback`
- `GET /ops/risk-config/active`
- `POST /ops/risk-config`
- `POST /ops/audit-events`
- `GET /meta/cluster-labels`

Ejemplo:

```bash
curl http://localhost:8000/analytics/classifier/meta
```

## Variables De Entorno

Backend y worker:

- `DATABASE_URL`: conexión SQLAlchemy a PostgreSQL.
- `DATA_DIR`: raíz de datos.
- `RAW_DIR`: datos originales, usado por el worker.
- `PROCESSED_DIR`: archivos Parquet generados.
- `ARTIFACTS_DIR`: modelos y metadata entrenada.

Frontend:

- `VITE_API_URL`: URL base de la API. Por defecto: `http://localhost:8000`.

PostgreSQL:

- `POSTGRES_DB`: por defecto `tfm`.
- `POSTGRES_USER`: por defecto `tfm`.
- `POSTGRES_PASSWORD`: por defecto `tfm`.

## Verificaciones Rápidas

API:

```bash
curl http://localhost:8000/health
```

Cursos disponibles:

```bash
curl http://localhost:8000/courses
```

Metadata del modelo predictivo:

```bash
curl http://localhost:8000/analytics/classifier/meta
```

Frontend:

```bash
cd frontend
npm run build
```

Nota: el frontend requiere Node.js 22+. Con Node 14, Vite puede fallar por sintaxis moderna de JavaScript.

## Solución De Problemas

Si la pantalla de modelo predictivo no muestra accuracy o F1:

1. Regenera el clasificador:

   ```bash
   docker compose run --rm worker python -m jobs.08_train_classifier
   ```

2. Reinicia la API:

   ```bash
   docker compose restart api
   ```

3. Verifica el endpoint:

   ```bash
   curl http://localhost:8000/analytics/classifier/meta
   ```

Si la API responde sin datos o con errores de mart:

```bash
docker compose run --rm worker
docker compose restart api
```

Si cambiaste artefactos o Parquet mientras la API estaba levantada:

```bash
curl -X POST http://localhost:8000/analytics/reload
```

Si el frontend no conecta con la API, revisa `VITE_API_URL` y que CORS permita el origen local configurado.

## Notas De Desarrollo

- El backend monta `./backend/app` dentro del contenedor, pero no usa autoreload. Reinicia `api` tras cambios en Python.
- El frontend monta `./frontend` y Vite sí recarga cambios durante desarrollo.
- Los datos de `data/` se comparten entre `api` y `worker`.
- El modelo predictivo usa los artefactos en `data/artifacts/classifier/`.
- El mart analítico consumido por la API es `data/processed/mart_clean.parquet`.
