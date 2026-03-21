import os
from pathlib import Path

def main():
    raw_dir = Path(os.getenv("RAW_DIR", "/data/raw"))
    processed_dir = Path(os.getenv("PROCESSED_DIR", "/data/processed"))
    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", "/data/artifacts"))

    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    print("SMOKE OK")
    print("RAW_DIR:", raw_dir)
    print("PROCESSED_DIR:", processed_dir)
    print("ARTIFACTS_DIR:", artifacts_dir)
    print("RAW files:", [p.name for p in raw_dir.glob("*")][:20])

if __name__ == "__main__":
    main()