from pathlib import Path

from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

FOOTBALL_DATA_TOKEN = os.getenv("FOOTBALL_DATA_TOKEN", "")
FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4"
WORLD_CUP_CODE = "WC"

JAVA_API_URL = os.getenv("JAVA_API_URL", "http://localhost:8080")

MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "match_model.joblib"))
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
MATCHES_CSV = DATA_DIR / "matches.csv"
METRICS_JSON = DATA_DIR / "metrics.json"

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# The free tier allows 10 calls per minute. Stay well under it.
REQUESTS_PER_MINUTE = 8
REQUEST_TIMEOUT = 30


def require_token() -> str:
    if not FOOTBALL_DATA_TOKEN:
        raise RuntimeError(
            "FOOTBALL_DATA_TOKEN is not set. Copy .env.example to .env and add "
            "your free token from https://www.football-data.org/client/register"
        )
    return FOOTBALL_DATA_TOKEN