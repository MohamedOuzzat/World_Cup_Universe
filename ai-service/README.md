# World Cup AI Service

Fetches World Cup data from football-data.org, trains a 1X2 match-outcome model,
and serves predictions over HTTP for the Java backend and Next.js frontend.

## Setup

```powershell
py -m pip install -r requirements.txt
copy .env.example .env      # then paste your token into FOOTBALL_DATA_TOKEN
```

Get a free token at https://www.football-data.org/client/register

The World Cup is one of the 12 competitions on the free tier. That tier allows
10 calls per minute and covers fixtures, results and tables. Goal scorers are a
paid feature, so `Goal` rows are only populated on a paid plan.

## Train

```powershell
py -m app.ml.train
```

Responses are cached under `data/raw/`, so re-running is cheap. Use `--force` to
refetch from the API. Outputs:

| Path | Contents |
|---|---|
| `models/match_model.joblib` | model bundle (model, ratings, form, metrics) |
| `data/matches.csv` | feature matrix with the 1X2 target |
| `data/team_ratings.csv` | final Elo table |
| `data/metrics.json` | holdout metrics for every candidate model |

Training fetches each World Cup edition separately, so the first run takes a few
minutes under the rate limit.

## Serve

```powershell
py -m uvicorn app.main:app --reload --port 8000
```

| Endpoint | Purpose |
|---|---|
| `GET /health` | liveness plus whether a model is loaded |
| `GET /model` | selected model, holdout metrics, top Elo ratings |
| `GET /teams` | every known team with its rating |
| `POST /predict` | 1X2 prediction for a fixture |
| `POST /admin/import` | fetch matches and push them to the Java backend |
| `GET /seasons` | World Cup editions covered |

```powershell
curl.exe -X POST http://localhost:8000/predict `
  -H "Content-Type: application/json" `
  -d '{\"home_team\": \"Brazil\", \"away_team\": \"Morocco\"}'
```

`/predict` returns the probabilities for all three outcomes, not just a label:

```json
{
  "predicted_outcome": "HOME_WIN",
  "probabilities": {"HOME_WIN": 0.60, "DRAW": 0.22, "AWAY_WIN": 0.18},
  "ratings": {"home_elo": 1625.2, "away_elo": 1454.3, "elo_difference": 170.9},
  "teams_recognized": true
}
```

Set `teams_recognized` to false in the UI when it comes back false: the team was
absent from the training data and was rated from the population prior, so the
prediction is weak.

## Design notes

**Evaluation is chronological.** The last 20% of matches by kickoff date are held
out rather than sampled randomly. World Cup matches are strongly time-ordered, so
a random split would let the model learn from matches that happened after the ones
it is scored on. Accuracy on a random split is meaningless here.

**Elo ratings are leak-free.** Ratings and rolling form are computed by walking
matches in kickoff order and reading each team's strength *before* the match is
played. Including the match being predicted in its own rating is the most common
way an Elo model looks brilliant in training and fails on live data.

**Features are symmetric and the venue is neutral.** Every feature is a
difference and a mean (`elo_diff`, `elo_mean`, ...) rather than separate home and
away columns, because the World Cup is played at neutral venues and "home" is just
fixture ordering. Roughly half of all matches are additionally presented with the
sides swapped to remove any residual ordering bias in the source data.

**Neutrality is enforced, not assumed.** `NeutralOutcomeClassifier` splits the
problem into draw-versus-decisive (driven by level features) and which-side-won
(driven by difference features). Swapping the sides negates every difference
feature, which flips the second stage to exactly `1 - p` and leaves the first
untouched, so probabilities mirror exactly. Both stages avoid the intercept and
centring that would otherwise reintroduce a home advantage.

`py -m app.ml.train` asserts this property on real rows and **rejects** any
candidate that fails it, so it cannot regress silently. Decision-tree models are
structurally incapable of mirroring and are always rejected.

**Model selection is on log loss**, which is what the API surfaces as
probabilities and is much harder to game than accuracy. A majority-class baseline
is reported alongside so the numbers can be read honestly; on neutral-venue data
the baseline is weak, and beating it on accuracy is not the bar.