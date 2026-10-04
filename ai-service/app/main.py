"""FastAPI service for World Cup data and match predictions.

Run with:  python -m app.main      (or: uvicorn app.main:app --reload)
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.schemas.prediction import (
    ImportRequest,
    ImportResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services import java_service
from app.services.fifa_service import FootballDataClient, WORLD_CUP_SEASONS
from app.services.prediction import (
    ModelNotTrainedError,
    load_bundle,
    model_is_ready,
    predict_match,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="World Cup AI Service",
    description="World Cup match data and 1X2 outcome predictions.",
    version="0.1.0",
)

# The Next.js frontend runs on a different origin, so the browser needs CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_trained": model_is_ready()}


@app.get("/model")
def model_info() -> dict:
    try:
        bundle = load_bundle()
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    ratings = bundle.get("ratings", {})
    top = sorted(ratings.items(), key=lambda kv: kv[1], reverse=True)[:20]

    return {
        "name": bundle.get("best_model_name"),
        "trained_at": bundle.get("trained_at"),
        "n_train": bundle.get("n_train"),
        "n_test": bundle.get("n_test"),
        "n_features": bundle.get("n_features"),
        "metrics": bundle.get("metrics"),
        "baseline": bundle.get("baseline"),
        "holdout_seasons": bundle.get("holdout_seasons"),
        "class_distribution": bundle.get("class_distribution"),
        "feature_columns": bundle.get("feature_columns"),
        "top_ratings": [{"team": t, "elo": round(r, 1)} for t, r in top],
    }


@app.get("/teams")
def teams() -> dict:
    try:
        bundle = load_bundle()
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    ratings = bundle.get("ratings", {})
    return {
        "count": len(ratings),
        "teams": [
            {"name": team, "elo": round(rating, 1)}
            for team, rating in sorted(ratings.items(), key=lambda kv: kv[1], reverse=True)
        ],
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    try:
        return PredictionResponse(**predict_match(
            home_team=request.home_team,
            away_team=request.away_team,
            is_knockout=request.is_knockout,
        ))
    except ModelNotTrainedError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/import", response_model=ImportResponse)
def import_matches(request: ImportRequest) -> ImportResponse:
    """Fetch World Cup matches and push them into the Java backend."""
    try:
        client = FootballDataClient()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    logger.info("Importing matches from football-data.org")
    raw = client.get_all_world_cup_matches()
    from app.services.fifa_service import normalize_match

    matches = [m for m in (normalize_match(x) for x in raw) if m is not None]

    try:
        result = java_service.send_matches_to_java(matches)
    except ConnectionError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ImportResponse(**result)


@app.get("/seasons")
def seasons() -> dict:
    return {"seasons": WORLD_CUP_SEASONS}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)