"""Client for the football-data.org v4 API, focused on the World Cup competition.

Free tier (https://www.football-data.org/client/register) covers the World Cup
but is limited to 10 calls per minute and provides fixtures, results and league
tables only. Goal scorers are a paid feature, so we read them when present but
never depend on them.
"""

import json
import logging
import time
from pathlib import Path
from typing import Any, Iterable

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from app import config

logger = logging.getLogger(__name__)

# Every World Cup edition, oldest first. 2026 is the current/active season.
WORLD_CUP_SEASONS = [
    1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974,
    1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014,
    2018, 2022, 2026,
]


class RateLimiter:
    """Keeps us under the free tier's requests-per-minute ceiling."""

    def __init__(self, per_minute: int) -> None:
        self.min_interval = 60.0 / per_minute
        self._last_call = 0.0

    def wait(self) -> None:
        elapsed = time.monotonic() - self._last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self._last_call = time.monotonic()


class FootballDataClient:
    def __init__(self, token: str | None = None, cache_dir: Path | None = None) -> None:
        self.token = token or config.require_token()
        self.cache_dir = cache_dir or config.RAW_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.limiter = RateLimiter(config.REQUESTS_PER_MINUTE)

        self.session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=1.5,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET"}),
            raise_on_status=False,
        )
        self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self.session.headers.update(
            {"X-Auth-Token": self.token, "Accept": "application/json"}
        )

    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        url = f"{config.FOOTBALL_DATA_BASE_URL}{path}"
        self.limiter.wait()
        response = self.session.get(url, params=params, timeout=config.REQUEST_TIMEOUT)

        if response.status_code == 403:
            raise PermissionError(
                f"{path} is not in your plan. The World Cup is included in the "
                "free tier, but check your token has not expired."
            )
        response.raise_for_status()
        return response.json()

    def get_world_cup_season(self, season: int, use_cache: bool = True) -> list[dict[str, Any]]:
        """Return raw match objects for one World Cup edition."""
        cache_file = self.cache_dir / f"wc_{season}.json"

        if use_cache and cache_file.exists():
            logger.info("cache hit: %s", cache_file.name)
            return json.loads(cache_file.read_text(encoding="utf-8"))

        payload = self._get(
            f"/competitions/{config.WORLD_CUP_CODE}/matches", params={"season": season}
        )
        matches = payload.get("matches", [])
        cache_file.write_text(json.dumps(matches, indent=2), encoding="utf-8")
        logger.info("fetched %d matches for %d", len(matches), season)
        return matches

    def get_all_world_cup_matches(
        self, seasons: Iterable[int] | None = None, use_cache: bool = True
    ) -> list[dict[str, Any]]:
        """Fetch every edition we can. Unavailable seasons are logged, not fatal."""
        collected: list[dict[str, Any]] = []
        failed: list[int] = []

        for season in seasons or WORLD_CUP_SEASONS:
            try:
                collected.extend(self.get_world_cup_season(season, use_cache=use_cache))
            except Exception as exc:  # noqa: BLE001 - one bad season must not stop the run
                failed.append(season)
                logger.warning("season %s unavailable: %s", season, exc)

        if failed:
            logger.warning("skipped seasons: %s", failed)
        return collected


def _team_name(team: dict[str, Any] | None) -> str | None:
    if not team:
        return None
    return team.get("name") or team.get("shortName")


def _team_code(team: dict[str, Any] | None) -> str | None:
    if not team:
        return None
    return team.get("tla") or team.get("shortName")


def _full_time_score(match: dict[str, Any]) -> tuple[int | None, int | None]:
    score = match.get("score") or {}
    full_time = score.get("fullTime") or {}
    return full_time.get("home"), full_time.get("away")


def normalize_match(match: dict[str, Any]) -> dict[str, Any] | None:
    """Flatten one raw API match into a stable record.

    Returns None when the match has no usable kickoff time or team names, which
    keeps malformed rows out of the training set instead of poisoning it.
    """
    utc_date = match.get("utcDate")
    home = _team_name(match.get("homeTeam"))
    away = _team_name(match.get("awayTeam"))

    if not utc_date or not home or not away:
        logger.warning("skipping match %s: missing date or teams", match.get("id"))
        return None

    home_score, away_score = _full_time_score(match)
    referees = match.get("referees") or []

    return {
        "match_id": match.get("id"),
        "utc_date": utc_date,
        "season": match.get("season", {}).get("startDate", "")[:4],
        "status": match.get("status"),
        "stage": match.get("stage"),
        "group": match.get("group"),
        "home_team": home,
        "home_team_code": _team_code(match.get("homeTeam")),
        "away_team": away,
        "away_team_code": _team_code(match.get("awayTeam")),
        "home_score": home_score,
        "away_score": away_score,
        "winner": (match.get("score") or {}).get("winner"),
        "venue": match.get("venue"),
        "attendance": match.get("attendance"),
        "referee": referees[0].get("name") if referees else None,
        # Free tier omits goal scorers; kept for forward compatibility.
        "goals": match.get("goals") or [],
    }