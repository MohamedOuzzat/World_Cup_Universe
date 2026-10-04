"""An exactly venue-neutral 1X2 classifier.

A plain multinomial logistic regression is only *approximately* neutral on
neutral-venue data. Mirroring the two sides of a fixture only swaps HOME_WIN and
AWAY_WIN exactly if the fitted coefficients satisfy three separate constraints:
the difference coefficients must be equal and opposite, the level coefficients
equal, and the intercepts equal. A freely fitted model satisfies those only when
the data happens to be perfectly balanced, so a small residual home bias always
survives.

This model removes the ambiguity by splitting the task in two:

  1. Draw or decisive, predicted from the level features only (how strong and
     evenly matched the two sides are). This cannot depend on ordering at all.
  2. Which side won, predicted from the difference features only.

Swapping the sides negates every difference feature, which flips stage two's
output to exactly 1 - p while leaving stage one untouched. Probabilities
therefore mirror exactly, by construction rather than by luck.
"""

import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.linear_model import LogisticRegression

HOME, DRAW, AWAY = "H", "D", "A"
CLASS_ORDER = [AWAY, DRAW, HOME]


class NeutralOutcomeClassifier(BaseEstimator, ClassifierMixin):
    def __init__(
        self,
        C: float = 1.0,
        max_iter: int = 2000,
        balanced: bool = False,
        random_state: int = 42,
    ) -> None:
        self.C = C
        self.max_iter = max_iter
        self.balanced = balanced
        self.random_state = random_state

    @property
    def classes_(self):
        return np.array(CLASS_ORDER)

    @staticmethod
    def _split_columns(columns):
        diff = [c for c in columns if c.endswith("_diff")]
        level = [c for c in columns if not c.endswith("_diff")]
        if not diff or not level:
            raise ValueError(
                "NeutralOutcomeClassifier needs both '_diff' and level features; "
                f"got diff={diff}, level={level}"
            )
        return diff, level

    def fit(self, X, y):  # noqa: N803 - sklearn convention
        frame = X if hasattr(X, "loc") else None
        if frame is None:
            raise TypeError("NeutralOutcomeClassifier requires a DataFrame.")

        self.feature_columns_ = list(frame.columns)
        self.diff_columns_, self.level_columns_ = self._split_columns(self.feature_columns_)

        labels = np.asarray(y)
        class_weight = "balanced" if self.balanced else None
        decisive = labels != DRAW

        # Stage 1: draw versus decisive, from level features only.
        self.draw_clf_ = LogisticRegression(
            C=self.C,
            max_iter=self.max_iter,
            class_weight=class_weight,
            random_state=self.random_state,
        ).fit(frame[self.level_columns_], (labels == DRAW).astype(int))

        # Stage 2: which side won, from difference features only.
        #
        # Fitted without an intercept and without centring. Negating the inputs
        # only negates the output if there is no additive constant to absorb:
        # logit(x) = w.x + b and logit(-x) = -w.x + b are exact opposites only
        # when b == 0. Any intercept, including one reintroduced by centring
        # inside a scaler, leaves a residual home bias. Dropping it costs almost
        # nothing here because the dataset is balanced so the optimal intercept
        # is already near zero.
        self.side_clf_ = LogisticRegression(
            C=self.C,
            max_iter=self.max_iter,
            class_weight=class_weight,
            fit_intercept=False,
            random_state=self.random_state,
        ).fit(
            frame.loc[decisive, self.diff_columns_],
            (labels[decisive] == HOME).astype(int),
        )
        return self

    def predict_proba(self, X):  # noqa: N803 - sklearn convention
        frame = X if hasattr(X, "loc") else None
        if frame is None:
            raise TypeError("NeutralOutcomeClassifier requires a DataFrame.")

        draw_p = self.draw_clf_.predict_proba(frame[self.level_columns_])[:, 1]
        home_p = self.side_clf_.predict_proba(frame[self.diff_columns_])[:, 1]

        decisive_p = 1.0 - draw_p
        # Column order follows CLASS_ORDER: away, draw, home.
        return np.column_stack([decisive_p * (1.0 - home_p), draw_p, decisive_p * home_p])

    def predict(self, X):  # noqa: N803 - sklearn convention
        return np.asarray(CLASS_ORDER)[np.argmax(self.predict_proba(X), axis=1)]