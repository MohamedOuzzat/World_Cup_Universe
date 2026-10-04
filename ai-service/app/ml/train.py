"""Train the 1X2 match-outcome model.

Run with:  python -m app.ml.train

Evaluation uses a chronological holdout rather than a random split. World Cup
matches are strongly time-ordered, so a random split would let the model learn
from matches that happened after the ones it is being scored on, and the reported
accuracy would be meaningless.
"""

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, log_loss
from sklearn.pipeline import Pipeline

from app import config
from app.ml import dataset
from app.ml.dataset import FEATURE_COLUMNS, TARGET_COLUMN
from app.ml.model import NeutralOutcomeClassifier
from app.services.fifa_service import FootballDataClient

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

HOLDOUT_FRACTION = 0.2


def candidate_models() -> dict[str, Pipeline]:
    """Candidates evaluated on the holdout; the best log loss wins.

    Class weighting is left to the search rather than assumed. World Cup draws
    are rare relative to deciders, so upweighting them can improve log loss
    while making plain accuracy worse than always picking the majority result.
    """
    return {
        "neutral": Pipeline(
            [("clf", NeutralOutcomeClassifier(max_iter=2000))]
        ),
        "neutral_balanced": Pipeline(
            [("clf", NeutralOutcomeClassifier(max_iter=2000, balanced=True))]
        ),
        "boosted": Pipeline(
            [
                (
                    "clf",
                    HistGradientBoostingClassifier(
                        max_depth=4,
                        learning_rate=0.06,
                        max_iter=300,
                        l2_regularization=1.0,
                        random_state=42,
                    ),
                )
            ]
        ),
    }


def chronological_split(frame: pd.DataFrame, fraction: float = HOLDOUT_FRACTION):
    cutoff_index = int(len(frame) * (1 - fraction))
    train = frame.iloc[:cutoff_index]
    test = frame.iloc[cutoff_index:]
    return train, test


def evaluate(model: Pipeline, test: pd.DataFrame) -> dict[str, float]:
    features = test[FEATURE_COLUMNS]
    truth = test[TARGET_COLUMN]

    predicted = model.predict(features)
    probabilities = model.predict_proba(features)

    return {
        "accuracy": float(accuracy_score(truth, predicted)),
        "balanced_accuracy": float(balanced_accuracy_score(truth, predicted)),
        "log_loss": float(log_loss(truth, probabilities, labels=model.classes_)),
    }


def naive_baseline(train: pd.DataFrame, test: pd.DataFrame) -> dict[str, float]:
    """Always predict the most common training outcome."""
    majority = train[TARGET_COLUMN].mode().iloc[0]
    predicted = [majority] * len(test)
    classes = sorted(train[TARGET_COLUMN].unique())
    probabilities = np.full(
        (len(test), len(classes)),
        1.0 / len(classes) if len(classes) > 1 else 1.0,
    )
    truth = test[TARGET_COLUMN]
    return {
        "accuracy": float(accuracy_score(truth, predicted)),
        "balanced_accuracy": float(balanced_accuracy_score(truth, predicted)),
        "log_loss": float(log_loss(truth, probabilities, labels=classes)),
    }


def check_neutrality(model: Pipeline, frame: pd.DataFrame, tolerance: float = 1e-9) -> bool:
    """Assert that swapping the two sides exactly mirrors the probabilities.

    World Cup matches are played at neutral venues, so the API must not invent a
    home advantage. This is checked on real rows rather than left to review,
    because the failure mode is subtle: an intercept or a centring scaler
    anywhere in the pipeline reintroduces the bias without breaking accuracy.
    """
    sample = frame[FEATURE_COLUMNS].head(200)
    swapped = sample.copy()
    for column in FEATURE_COLUMNS:
        if column.endswith("_diff"):
            swapped[column] = -swapped[column]

    forward = model.predict_proba(sample)
    reverse = model.predict_proba(swapped)

    # Column order is (away, draw, home), so mirroring swaps the outer two.
    ok = bool(
        np.allclose(forward[:, 0], reverse[:, 2], atol=tolerance)
        and np.allclose(forward[:, 1], reverse[:, 1], atol=tolerance)
        and np.allclose(forward[:, 2], reverse[:, 0], atol=tolerance)
    )
    if not ok:
        worst = float(np.max(np.abs(forward - reverse[:, ::-1])))
        raise AssertionError(
            f"Model is not venue-neutral: probabilities are not mirrored when the "
            f"sides are swapped (max deviation {worst:.3e}). Check for an "
            "intercept or centring step on the difference features."
        )
    return True


def train(force: bool = False) -> dict:
    client = FootballDataClient()
    raw_matches = client.get_all_world_cup_matches(use_cache=not force)

    frame = dataset.build_training_frame(raw_matches)
    frame.to_csv(config.MATCHES_CSV, index=False)
    logger.info("Wrote %d rows to %s", len(frame), config.MATCHES_CSV)

    train_frame, test_frame = chronological_split(frame)
    logger.info(
        "Train %d matches (%s..%s), holdout %d matches (%s..%s)",
        len(train_frame),
        train_frame["utc_date"].min().date(),
        train_frame["utc_date"].max().date(),
        len(test_frame),
        test_frame["utc_date"].min().date(),
        test_frame["utc_date"].max().date(),
    )

    results = {}
    for name, model in candidate_models().items():
        model.fit(train_frame[FEATURE_COLUMNS], train_frame[TARGET_COLUMN])
        results[name] = evaluate(model, test_frame)
        logger.info("%-17s %s", name, results[name])

    # Venue neutrality is a correctness property, not a nice-to-have, so a model
    # that fails it is rejected rather than ranked.
    rejected: list[str] = []
    for name, model in candidate_models().items():
        try:
            model.fit(train_frame[FEATURE_COLUMNS], train_frame[TARGET_COLUMN])
            check_neutrality(model, frame)
            logger.info("%-17s venue-neutral", name)
        except AssertionError as exc:
            logger.warning("%-17s rejected: %s", name, exc)
            rejected.append(name)
            results.pop(name, None)

    if not results:
        raise RuntimeError("No candidate model satisfied the neutrality check.")

    baseline = naive_baseline(train_frame, test_frame)
    logger.info("%-17s %s", "baseline", baseline)

    # Log loss is the metric that matters: it is what the API returns as
    # probabilities, and it is far harder to game than raw accuracy.
    best_name = min(results, key=lambda n: results[n]["log_loss"])
    logger.info("Selected %s on holdout log loss", best_name)

    if results[best_name]["accuracy"] < baseline["accuracy"]:
        logger.warning(
            "%s beats the majority-class baseline on log loss (%.4f vs %.4f) but not "
            "on accuracy (%.4f vs %.4f). The probabilities are more trustworthy "
            "than the top-line accuracy here.",
            best_name,
            results[best_name]["log_loss"],
            baseline["log_loss"],
            results[best_name]["accuracy"],
            baseline["accuracy"],
        )

    final_model = candidate_models()[best_name]
    final_model.fit(frame[FEATURE_COLUMNS], frame[TARGET_COLUMN])
    check_neutrality(final_model, frame)

    ratings = dataset.final_ratings(frame)
    ratings.to_csv(config.DATA_DIR / "team_ratings.csv", index=False)

    bundle = {
        "model": final_model,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "best_model_name": best_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_train": len(train_frame),
        "n_test": len(test_frame),
        "n_features": len(frame),
        "metrics": results,
        "baseline": baseline,
        "holdout_seasons": sorted(test_frame["season"].dropna().unique().tolist()),
        "ratings": dict(zip(ratings["team"], ratings["elo"])),
        "team_form": {
            team: {
                "points": float(points),
                "goals": float(goals),
            }
            for team, points, goals in zip(
                ratings["team"], ratings["form_points"], ratings["form_goals"]
            )
        },
        "class_distribution": {
            k: int(v) for k, v in frame[TARGET_COLUMN].value_counts().items()
        },
        # Population averages, used as the neutral prior for teams the model
        # has never seen. form_mean is already the per-match average of both
        # sides, so its mean is the population mean.
        "mean_form": {
            "points": float(frame["form_mean"].mean()),
            "goals": float(frame["goals_form_mean"].mean()),
        },
    }

    joblib.dump(bundle, config.MODEL_PATH)
    logger.info("Saved model to %s", config.MODEL_PATH)

    summary = {k: v for k, v in bundle.items() if k not in {"model", "ratings"}}
    config.METRICS_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print("\nTop 15 teams by Elo:")
    print(ratings.head(15).to_string(index=False))
    print(f"\nBest model: {best_name}")
    print(json.dumps(results[best_name], indent=2))
    return bundle


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the World Cup 1X2 model.")
    parser.add_argument(
        "--force", action="store_true", help="Ignore the cached API responses."
    )
    train(force=parser.parse_args().force)