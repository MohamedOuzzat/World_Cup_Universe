"""Push normalised match data into the Java backend.

The Java side must expose POST /api/matches/import for this to work; see
back-end-java MatchController.
"""

import logging

import requests

from app import config
from app.ml.dataset import KNOCKOUT_STAGES

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 30

# football-data.org stage names -> Java Match.Stage enum names.
STAGE_MAP = {
    "GROUP_STAGE": "GROUP",
    "LAST_16": "R16",
    "LAST_32": "R32",
    "QUARTER_FINALS": "QUARTER_FINAL",
    "SEMI_FINALS": "SEMI_FINAL",
    "THIRD_PLACE": "THIRD_PLACE",
    "FINAL": "FINAL",
}

STATUS_MAP = {
    "SCHEDULED": "SCHEDULED",
    "TIMED": "SCHEDULED",
    "IN_PLAY": "LIVE",
    "PAUSED": "LIVE",
    "FINISHED": "FINISHED",
    "AWARDED": "FINISHED",
    "POSTPONED": "SCHEDULED",
    "CANCELLED": "SCHEDULED",
}


def to_java_stage(stage: str | None) -> str:
    if stage in STAGE_MAP:
        return STAGE_MAP[stage]
    return "R16" if stage in KNOCKOUT_STAGES else "GROUP"


def to_java_status(status: str | None) -> str:
    return STATUS_MAP.get(status or "", "SCHEDULED")


def to_payload(matches: list[dict]) -> list[dict]:
    return [
        {
            "utcDate": m["utc_date"],
            "season": m.get("season"),
            "stage": to_java_stage(m.get("stage")),
            "groupName": m.get("group"),
            "homeTeam": m["home_team"],
            "awayTeam": m["away_team"],
            "homeScore": m.get("home_score"),
            "awayScore": m.get("away_score"),
            "venue": m.get("venue"),
            "attendance": m.get("attendance"),
            "referee": m.get("referee"),
            "status": to_java_status(m.get("status")),
        }
        for m in matches
    ]


def send_matches_to_java(matches: list[dict]) -> dict:
    if not matches:
        return {"received": 0, "imported": 0}

    url = f"{config.JAVA_API_URL}/api/matches/import"
    logger.info("POSTing %d matches to %s", len(matches), url)

    try:
        response = requests.post(
            url, json={"matches": to_payload(matches)}, timeout=REQUEST_TIMEOUT
        )
    except requests.exceptions.ConnectionError as exc:
        raise ConnectionError(
            f"Could not reach the Java backend at {config.JAVA_API_URL}. "
            "Is it running on port 8080?"
        ) from exc

    if response.status_code == 404:
        raise RuntimeError(
            "The Java backend has no POST /api/matches/import endpoint. "
            "Add it to MatchController before importing."
        )

    response.raise_for_status()
    return response.json()