"""Turn raw World Cup matches into a leak-free training set.

The important part of this module is ordering. Elo ratings and rolling form are
computed by walking matches in kickoff order and capturing each team's strength
*before* the match is played. A model trained on ratings that already contain
the result of the match being predicted looks great in training and fails on
live data.
"""

import hashlib
import logging
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from app.services.fifa_service import normalize_match

logger = logging.getLogger(__name__)

# World Cup matches are played at neutral venues, so "home" and "away" are just
# fixture ordering. Every feature is therefore expressed symmetrically (a
# difference and a mean) rather than as separate home/away columns. Separate
# columns are collinear with the difference term and let the model invent a
# home advantage that does not exist in this competition.
FEATURE_COLUMNS = [
    "elo_diff",
    "elo_mean",
    "form_diff",
    "form_mean",
    "goals_form_diff",
    "goals_form_mean",
    "is_knockout",
]

TARGET_COLUMN = "result"

HOME_WIN, DRAW, AWAY_WIN = "H", "D", "A"

K_FACTOR = 32.0
INITIAL_ELO = 1500.0
FORM_WINDOW = 5

KNOCKOUT_STAGES = {"LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"}


def expected_score(rating_a: float, rating_b: float) -> float:
    return 1.0 / (1.0 + 10.0 ** ((rating_b - rating_a) / 400.0))


def outcome_label(home_score: float, away_score: float) -> str:
    if home_score > away_score:
        return HOME_WIN
    if home_score < away_score:
        return AWAY_WIN
    return DRAW


def points_and_goals(home_score: float, away_score: float) -> tuple[float, float, float, float]:
    """Return (home_pts, away_pts, home_goals, away_goals) for one result."""
    if home_score > away_score:
        return 3.0, 0.0, home_score, 0.0
    if home_score < away_score:
        return 0.0, 3.0, 0.0, away_score
    return 1.0, 1.0, 0.0, 0.0


@dataclass
class TeamHistory:
    ratings: dict[str, float] = field(default_factory=dict)
    points: dict[str, list[float]] = field(default_factory=dict)
    goals: dict[str, list[float]] = field(default_factory=dict)

    def rating(self, team: str) -> float:
        return self.ratings.get(team, INITIAL_ELO)

    def recent_points(self, team: str) -> float:
        window = self.points.get(team, [])[-FORM_WINDOW:]
        return float(np.mean(window)) if window else INITIAL_ELO / 400.0

    def recent_goals(self, team: str) -> float:
        window = self.goals.get(team, [])[-FORM_WINDOW:]
        return float(np.mean(window)) if window else 0.0

    def record(self, team: str, rating: float, points: float, goals: float) -> None:
        self.ratings[team] = rating
        self.points.setdefault(team, []).append(points)
        self.goals.setdefault(team, []).append(goals)


def _rating_update(
    home_elo: float, away_elo: float, actual_home: float, actual_away: float
) -> tuple[float, float]:
    """Standard Elo with a score-draw margin, so draws move ratings less."""
    expected_home = expected_score(home_elo, away_elo)
    expected_away = 1.0 - expected_home

    margin = 1.0 if actual_home != actual_away else 0.6
    change = K_FACTOR * margin * (actual_home - expected_home)

    return home_elo + change, away_elo - change


def should_swap_sides(match) -> bool:
    """Decide whether to present this fixture with the two sides swapped.

    Deterministically swaps roughly half the matches so the dataset carries no
    artificial home bias.

    A cryptographic hash is required here. crc32 looks like a reasonable stable
    choice but is linear over GF(2), which makes its low bit a fixed linear form
    of the input bits. football-data.org match ids are sequential integers, so
    that bit is emphatically not uniform across them and the swap ends up badly
    biased, which reintroduces exactly the home advantage this is meant to
    remove. blake2b is also stable across processes, unlike hash(), which salts
    strings per run.
    """
    key = match.match_id
    if key is None:
        key = f"{match.home_team}|{match.away_team}|{match.utc_date}"
    digest = hashlib.blake2b(str(key).encode("utf-8"), digest_size=8).digest()
    return digest[-1] & 1 == 1


def build_training_frame(matches: list[dict]) -> pd.DataFrame:
    """Build the feature matrix and 1X2 target from raw match dicts."""
    records = [m for m in (normalize_match(m) for m in matches) if m is not None]
    if not records:
        raise ValueError("No usable matches to train on.")

    frame = pd.DataFrame(records)
    frame["utc_date"] = pd.to_datetime(frame["utc_date"], utc=True, format="ISO8601")
    frame = frame.sort_values("utc_date").reset_index(drop=True)

    # Knockout matches can end level after 90 minutes. A draw is still the most
    # common single outcome there, so treat level as a draw rather than guessing
    # a penalty shootout winner we do not have data for.
    finished = frame[frame["status"] == "FINISHED"].copy()
    finished = finished.dropna(subset=["home_score", "away_score"])
    finished["home_score"] = finished["home_score"].astype(float)
    finished["away_score"] = finished["away_score"].astype(float)
    logger.info("Training on %d finished matches", len(finished))

    history = TeamHistory()
    rows: list[dict] = []

    for match in finished.itertuples(index=False):
        # football-data.org orders the two sides arbitrarily, and past editions
        # are not exactly balanced, so training on that ordering would teach a
        # home advantage that does not exist at a neutral venue.
        if should_swap_sides(match):
            home, away = match.away_team, match.home_team
            home_score, away_score = match.away_score, match.home_score
        else:
            home, away = match.home_team, match.away_team
            home_score, away_score = match.home_score, match.away_score

        home_elo = history.rating(home)
        away_elo = history.rating(away)

        home_form = history.recent_points(home)
        away_form = history.recent_points(away)
        home_goals = history.recent_goals(home)
        away_goals = history.recent_goals(away)

        rows.append(
            {
                "match_id": match.match_id,
                "utc_date": match.utc_date,
                "season": match.season,
                "stage": match.stage,
                "home_team": home,
                "away_team": away,
                "home_score": home_score,
                "away_score": away_score,
                "elo_diff": home_elo - away_elo,
                "elo_mean": (home_elo + away_elo) / 2.0,
                "form_diff": home_form - away_form,
                "form_mean": (home_form + away_form) / 2.0,
                "goals_form_diff": home_goals - away_goals,
                "goals_form_mean": (home_goals + away_goals) / 2.0,
                "is_knockout": 1 if match.stage in KNOCKOUT_STAGES else 0,
                TARGET_COLUMN: outcome_label(home_score, away_score),
            }
        )

        home_pts, away_pts, home_goals_scored, away_goals_scored = points_and_goals(
            home_score, away_score
        )
        new_home_elo, new_away_elo = _rating_update(
            home_elo, away_elo, home_pts / 3.0, away_pts / 3.0
        )
        history.record(home, new_home_elo, home_pts, home_goals_scored)
        history.record(away, new_away_elo, away_pts, away_goals_scored)

    return pd.DataFrame(rows)


def final_ratings(training_frame: pd.DataFrame) -> pd.DataFrame:
    """Recompute the end-of-history Elo table for reporting."""
    history = TeamHistory()
    for match in training_frame.itertuples(index=False):
        home_elo = history.rating(match.home_team)
        away_elo = history.rating(match.away_team)
        home_pts, away_pts, home_goals, away_goals = points_and_goals(
            match.home_score, match.away_score
        )
        new_home, new_away = _rating_update(
            home_elo, away_elo, home_pts / 3.0, away_pts / 3.0
        )
        history.record(match.home_team, new_home, home_pts, home_goals)
        history.record(match.away_team, new_away, away_pts, away_goals)

    table = pd.DataFrame(
        [{"team": team, "elo": rating} for team, rating in history.ratings.items()]
    )
    table["matches"] = table["team"].map(lambda t: len(history.points.get(t, [])))
    # Carried into the model bundle so live predictions use the same form
    # feature the model was trained on, instead of a rough rating proxy.
    table["form_points"] = table["team"].map(history.recent_points)
    table["form_goals"] = table["team"].map(history.recent_goals)
    return table.sort_values("elo", ascending=False).reset_index(drop=True)