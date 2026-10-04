/**
 * Types mirroring the Java entities and the Python prediction service.
 *
 * Field names follow the Java DTOs exactly (camelCase, Spring's default), so
 * responses need no remapping. Anything the backend does not yet expose is
 * optional and the UI degrades gracefully instead of rendering "undefined".
 */

export type MatchStage =
  | "GROUP"
  | "R16"
  | "QUARTER_FINAL"
  | "SEMI_FINAL"
  | "THIRD_PLACE"
  | "FINAL";

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export interface Team {
  id: number;
  name: string;
  country: string;
  flagUrl: string | null;
  fifaRanking: number | null;
}

export interface Stadium {
  id: number;
  name: string;
  city: string;
  capacity: number | null;
}

export interface Player {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  position: string;
  shirtNumber: number | null;
  nationality: string | null;
  dateOfBirth: string | null;
  club: string | null;
  photoUrl: string | null;
}

export interface ManOfTheMatch {
  playerId?: number;
  name: string;
  teamName: string;
  rating?: number | null;
}

export interface Goal {
  id: number;
  scorer: string;
  minute: number;
  teamId: number;
  teamName: string;
  ownGoal: boolean;
  penalty: boolean;
}

export interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  dateTime: string;
  groupName: string;
  stage: MatchStage;
  homeScore: number | null;
  awayScore: number | null;
  stadium: Stadium | null;
  attendance: number | null;
  referee: string | null;
  status: MatchStatus;
  goals?: Goal[];
  manOfTheMatch?: ManOfTheMatch | null;
}

export interface EloTeam {
  name: string;
  elo: number;
}

/** Mirrors the Python service's PredictionResponse. */
export interface PredictionResponse {
  home_team: string;
  away_team: string;
  predicted_result: "H" | "D" | "A";
  predicted_outcome: "HOME_WIN" | "DRAW" | "AWAY_WIN";
  probabilities: {
    HOME_WIN: number;
    DRAW: number;
    AWAY_WIN: number;
  };
  confidence: number;
  ratings: {
    home_elo: number;
    away_elo: number;
    elo_difference: number;
  };
  teams_recognized: boolean;
  model: {
    name: string | null;
    trained_at: string | null;
  };
}

export interface ModelInfo {
  name: string | null;
  trained_at: string | null;
  n_train: number | null;
  n_test: number | null;
  n_features: number | null;
  metrics: Record<string, { accuracy: number; balanced_accuracy: number; log_loss: number }>;
  baseline: { accuracy: number; balanced_accuracy: number; log_loss: number } | null;
  holdout_seasons: string[] | null;
  class_distribution: Record<string, number> | null;
  feature_columns: string[] | null;
  top_ratings: { team: string; elo: number }[];
}

/**
 * Every fetch returns where its data came from. The UI surfaces this so a
 * fallback is never mistaken for a live result.
 */
export interface Sourced<T> {
  data: T;
  live: boolean;
  error?: string;
}