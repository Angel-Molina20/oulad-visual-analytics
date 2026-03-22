import os
import zipfile
from pathlib import Path

REQUIRED_FILES = {
    "studentVle.csv",
    "vle.csv",
    "studentInfo.csv",
    "courses.csv",
    "assessments.csv",
    "studentAssessment.csv",
}

def main():
    raw_dir = Path(os.getenv("RAW_DIR", "/data/raw"))
    oulad_dir = raw_dir / "oulad"
    oulad_dir.mkdir(parents=True, exist_ok=True)

    zips = list(oulad_dir.glob("*.zip"))
    if not zips:
        raise SystemExit(f"No encontré ZIP en {oulad_dir}. Coloca OULAD.zip ahí.")

    zip_path = zips[0]
    extract_dir = oulad_dir / "csv"
    extract_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(extract_dir)

    # Algunos zips vienen con subcarpeta, busca recursivo
    found = {p.name for p in extract_dir.rglob("*.csv")}
    missing = REQUIRED_FILES - found
    if missing:
        raise SystemExit(f"Faltan CSV: {sorted(missing)}. Encontrados: {sorted(list(found))[:15]} ...")

    print("OK: OULAD extraído y validado.")
    print("Ruta CSV:", extract_dir)

if __name__ == "__main__":
    main()