"""Request and response models for the prediction and import endpoints."""

from typing import Literal

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    home_team: str = Field(..., min_length=2, examples=["Brazil"])
    away_team: str = Field(..., min_length=2, examples=["Morocco"])
    is_knockout: bool = Field(
        False, description="Knockout matches are weighted differently in the model."
    )


class TeamRatings(BaseModel):
    home_elo: float
    away_elo: float
    elo_difference: float


class ModelInfo(BaseModel):
    name: str | None = None
    trained_at: str | None = None


class PredictionResponse(BaseModel):
    home_team: str
    away_team: str
    predicted_result: Literal["H", "D", "A"]
    predicted_outcome: Literal["HOME_WIN", "DRAW", "AWAY_WIN"]
    probabilities: dict[str, float]
    confidence: float
    ratings: TeamRatings
    teams_recognized: bool = Field(
        ..., description="False when a team was unknown and rated from the prior."
    )
    model: ModelInfo


class ImportedMatch(BaseModel):
    """A match pushed from Python into the Java backend."""

    utc_date: str
    season: str | None = None
    stage: str
    group_name: str | None = None
    home_team: str
    away_team: str
    home_score: int | None = None
    away_score: int | None = None
    venue: str | None = None
    attendance: int | None = None
    referee: str | None = None
    status: str = "FINISHED"


class ImportRequest(BaseModel):
    matches: list[ImportedMatch]


class ImportResponse(BaseModel):
    received: int
    imported: int