import subprocess
import sys

JOBS = [
    "jobs.00_smoke",
    "jobs.01_ingest_oulad",
    "jobs.02_build_events",
    "jobs.03_weekly_features",
    "jobs.04_cluster_profiles",
    "jobs.05_build_mart",
    "jobs.06_clean_mart",
    "jobs.07_cluster_labels",
    "jobs.08_train_classifier",
]

def run(job: str):
    print(f"\n=== Running {job} ===")
    r = subprocess.run([sys.executable, "-m", job], check=False)
    if r.returncode != 0:
        raise SystemExit(f"Fallo en {job} con código {r.returncode}")

def main():
    for job in JOBS:
        run(job)
    print("\nPipeline completo OK")

if __name__ == "__main__":
    main()