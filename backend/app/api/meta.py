from fastapi import APIRouter
from pathlib import Path
import os
import json

router = APIRouter(prefix="/meta")


@router.get("/cluster-labels")
def cluster_labels():
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts")) / "clustering"
    path = artifacts_dir / "cluster_labels.json"
    if not path.exists():
        return {"clusters": [], "note": "No existe cluster_labels.json. Ejecuta job 06."}

    data = json.loads(path.read_text(encoding="utf-8"))
    return {"clusters": data}