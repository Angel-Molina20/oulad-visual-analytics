FROM python:3.12-slim

WORKDIR /worker
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /worker/requirements.txt
RUN pip install --no-cache-dir -U pip \
 && pip install --no-cache-dir -r /worker/requirements.txt

COPY jobs /worker/jobs
COPY common /worker/common

CMD ["python", "-m", "jobs.00_smoke"]