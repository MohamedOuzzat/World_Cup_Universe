"""Serve predictions from the trained 1X2 model.

The bundle is loaded lazily on first use so that importing this module never
fails, and so that retraining does not require a service restart to be noticed.
"""

import difflib
import logging
import threading

import joblib
import pandas as pd

from app import config
from app.ml.dataset import FEATURE_COLUMNS, INITIAL_ELO, TARGET_COLUMN

logger = logging.getLogger(__name__)

OUTCOME_LABELS = {"H": "HOME_WIN", "D": "DRAW", "A": "AWAY_WIN"}

# An unknown side is assumed to be slightly below average rather than exactly
# neutral, which keeps the model from treating a debutant as a 1500-rated team.
UNKNOWN_TEAM_ELO = INITIAL_ELO - 100.0

_bundle = None
_bundle_lock = threading.Lock()


class ModelNotTrainedError(RuntimeError):
    pass


def load_bundle(force_reload: bool = False) -> dict:
    global _bundle

    if _bundle is not None and not force_reload:
        return _bundle

    with _bundle_lock:
        if _bundle is not None and not force_reload:
            return _bundle
        if not config.MODEL_PATH.exists():
            raise ModelNotTrainedError(
                f"No model at {config.MODEL_PATH}. Train one first: "
                "python -m app.ml.train"
            )
        logger.info("Loading model bundle from %s", config.MODEL_PATH)
        _bundle = joblib.load(config.MODEL_PATH)

    return _bundle


def model_is_ready() -> bool:
    try:
        load_bundle()
        return True
    except ModelNotTrainedError:
        return False


def _normalise(name: str) -> str:
    return " ".join(name.strip().lower().split())


def resolve_team(name: str, ratings: dict[str, float]) -> tuple[float, str | None]:
    """Map a user-supplied team name to an Elo rating.

    Returns (rating, canonical_name). canonical_name is None when the team is
    unknown, and callers must key off that rather than the raw input so that
    casing never changes the result.
    """
    lookup = {_normalise(team): team for team in ratings}

    key = _normalise(name)
    if key in lookup:
        canonical = lookup[key]
        return ratings[canonical], canonical

    close = difflib.get_close_matches(key, list(lookup), n=1, cutoff=0.85)
    if close:
        canonical = lookup[close[0]]
        logger.info("Resolved %r to %r", name, canonical)
        return ratings[canonical], canonical

    logger.warning("Unknown team %r, using default rating", name)
    return UNKNOWN_TEAM_ELO, None


def predict_match(
    home_team: str,
    away_team: str,
    is_knockout: bool = False,
) -> dict:
    home_team = home_team.strip()
    away_team = away_team.strip()

    if not home_team or not away_team:
        raise ValueError("Both team names are required.")
    if _normalise(home_team) == _normalise(away_team):
        raise ValueError("Home team and away team must be different.")

    bundle = load_bundle()
    model = bundle["model"]
    ratings = bundle.get("ratings", {})
    team_form = bundle.get("team_form", {})
    mean_form = bundle.get("mean_form", {"points": 1.4, "goals": 1.2})

    home_elo, home_canonical = resolve_team(home_team, ratings)
    away_elo, away_canonical = resolve_team(away_team, ratings)

    def form_for(canonical: str | None, field: str) -> float:
        # Keyed on the canonical name so "japan" and "Japan" score identically.
        if canonical is not None and canonical in team_form:
            return float(team_form[canonical][field])
        return float(mean_form[field])

    home_form = form_for(home_canonical, "points")
    away_form = form_for(away_canonical, "points")
    home_goals = form_for(home_canonical, "goals")
    away_goals = form_for(away_canonical, "goals")

    features = pd.DataFrame(
        [
            {
                "elo_diff": home_elo - away_elo,
                "elo_mean": (home_elo + away_elo) / 2.0,
                "form_diff": home_form - away_form,
                "form_mean": (home_form + away_form) / 2.0,
                "goals_form_diff": home_goals - away_goals,
                "goals_form_mean": (home_goals + away_goals) / 2.0,
                "is_knockout": 1 if is_knockout else 0,
            }
        ]
    )[bundle.get("feature_columns", FEATURE_COLUMNS)]

    raw_label = str(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]

    labelled = {
        OUTCOME_LABELS.get(str(cls), str(cls)): round(float(p), 4)
        for cls, p in zip(model.classes_, probabilities)
    }

    return {
        "home_team": home_team,
        "away_team": away_team,
        "predicted_result": raw_label,
        "predicted_outcome": OUTCOME_LABELS.get(raw_label, raw_label),
        "probabilities": labelled,
        "confidence": round(float(max(probabilities)), 4),
        "ratings": {
            "home_elo": round(home_elo, 1),
            "away_elo": round(away_elo, 1),
            "elo_difference": round(home_elo - away_elo, 1),
        },
        "teams_recognized": home_canonical is not None and away_canonical is not None,
        "model": {
            "name": bundle.get("best_model_name"),
            "trained_at": bundle.get("trained_at"),
        },
    }