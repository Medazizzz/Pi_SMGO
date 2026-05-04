from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"
RAW_DATA_PATH = DATA_DIR / "raw_recommendation_dataset.csv"
CLEAN_DATA_PATH = DATA_DIR / "clean_recommendation_dataset.csv"
MODEL_PATH = MODEL_DIR / "content_recommender.joblib"

CATEGORY_POOL = ["MOVIE", "SERIES", "DOCUMENTARY"]
TYPE_POOL = ["FILM", "SERIES", "DOCUMENTARY"]
GENRE_POOL = [
    "Action",
    "Comedy",
    "Drama",
    "Thriller",
    "Romance",
    "Sci-Fi",
    "Family",
    "Animation",
    "History",
    "Sports",
    "Horror",
    "Adventure",
]

CONTENT_BLUEPRINTS = [
    ("MOVIE", "FILM", ["Action", "Adventure"]),
    ("MOVIE", "FILM", ["Comedy", "Family"]),
    ("MOVIE", "FILM", ["Drama", "Romance"]),
    ("MOVIE", "FILM", ["Sci-Fi", "Action"]),
    ("SERIES", "SERIES", ["Drama", "Thriller"]),
    ("SERIES", "SERIES", ["Comedy", "Family"]),
    ("SERIES", "SERIES", ["Action", "Adventure"]),
    ("DOCUMENTARY", "DOCUMENTARY", ["History", "Sports"]),
    ("DOCUMENTARY", "DOCUMENTARY", ["Science", "Nature"]),
]

USER_PROFILES = [
    {"preferred_categories": ["MOVIE"], "preferred_types": ["FILM"], "preferred_genres": ["Action", "Adventure"]},
    {"preferred_categories": ["SERIES"], "preferred_types": ["SERIES"], "preferred_genres": ["Drama", "Thriller"]},
    {"preferred_categories": ["DOCUMENTARY"], "preferred_types": ["DOCUMENTARY"], "preferred_genres": ["History", "Sports"]},
    {"preferred_categories": ["MOVIE", "SERIES"], "preferred_types": ["FILM", "SERIES"], "preferred_genres": ["Comedy", "Family"]},
    {"preferred_categories": ["MOVIE", "DOCUMENTARY"], "preferred_types": ["FILM", "DOCUMENTARY"], "preferred_genres": ["Sci-Fi", "Action", "History"]},
    {"preferred_categories": ["SERIES", "DOCUMENTARY"], "preferred_types": ["SERIES", "DOCUMENTARY"], "preferred_genres": ["Drama", "Sports", "Thriller"]},
]


@dataclass
class TrainedBundle:
    pipeline: Pipeline
    feature_columns: list[str]
    train_score: float
    test_mae: float
    test_r2: float


def _ensure_directories() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


def _random_content_seed(index: int) -> dict:
    category, content_type, genres = CONTENT_BLUEPRINTS[index % len(CONTENT_BLUEPRINTS)]
    return {
        "content_category": category,
        "content_type": content_type,
        "primary_genre": genres[0],
        "content_genres": genres,
        "view_count": int(np.random.randint(20, 5000)),
        "days_since_publish": int(np.random.randint(0, 900)),
    }


def _build_messy_dataset(sample_size: int = 2500) -> pd.DataFrame:
    rows: list[dict] = []
    rng = np.random.default_rng(42)

    for index in range(sample_size):
        user_profile = USER_PROFILES[index % len(USER_PROFILES)]
        content_seed = _random_content_seed(index)
        if index % 17 == 0:
            content_seed["content_category"] = np.nan
        if index % 23 == 0:
            user_profile = {**user_profile, "preferred_genres": []}
        if index % 29 == 0:
            content_seed["view_count"] = np.nan

        category_match = 1.0 if content_seed["content_category"] in user_profile["preferred_categories"] else 0.0
        type_match = 1.0 if content_seed["content_type"] in user_profile["preferred_types"] else 0.0
        genre_overlap = len(set(content_seed["content_genres"]).intersection(user_profile["preferred_genres"]))
        genre_overlap_ratio = genre_overlap / max(len(content_seed["content_genres"]), 1)
        popularity = np.log1p(content_seed.get("view_count") or 0)
        freshness = max(0.0, 1.0 - min(content_seed["days_since_publish"], 900) / 900.0)

        score = (
            0.34 * category_match
            + 0.28 * type_match
            + 0.24 * genre_overlap_ratio
            + 0.10 * freshness
            + 0.04 * min(popularity / 9.0, 1.0)
            + rng.normal(0.0, 0.03)
        )
        score = float(np.clip(score, 0.0, 1.0))

        rows.append(
            {
                "preferred_category": user_profile["preferred_categories"][0] if user_profile["preferred_categories"] else None,
                "preferred_type": user_profile["preferred_types"][0] if user_profile["preferred_types"] else None,
                "preferred_genre": user_profile["preferred_genres"][0] if user_profile["preferred_genres"] else None,
                "content_category": content_seed["content_category"],
                "content_type": content_seed["content_type"],
                "primary_genre": content_seed["primary_genre"],
                "category_match": category_match,
                "type_match": type_match,
                "genre_overlap_count": genre_overlap,
                "genre_overlap_ratio": genre_overlap_ratio,
                "view_count": content_seed["view_count"],
                "log_views": popularity,
                "days_since_publish": content_seed["days_since_publish"],
                "freshness_score": freshness,
                "label": score,
            }
        )

    raw_df = pd.DataFrame(rows)
    duplicates = raw_df.sample(frac=0.08, random_state=7)
    raw_df = pd.concat([raw_df, duplicates], ignore_index=True)

    for column in ["preferred_category", "content_category", "preferred_genre", "view_count"]:
        null_indices = raw_df.sample(frac=0.06, random_state=hash(column) % 97).index
        raw_df.loc[null_indices, column] = np.nan

    raw_df.to_csv(RAW_DATA_PATH, index=False)
    cleaned_df = raw_df.dropna().drop_duplicates().reset_index(drop=True)
    cleaned_df.to_csv(CLEAN_DATA_PATH, index=False)
    return cleaned_df


def _train_pipeline(df: pd.DataFrame) -> TrainedBundle:
    feature_columns = [
        "preferred_category",
        "preferred_type",
        "preferred_genre",
        "content_category",
        "content_type",
        "primary_genre",
        "category_match",
        "type_match",
        "genre_overlap_count",
        "genre_overlap_ratio",
        "view_count",
        "log_views",
        "days_since_publish",
        "freshness_score",
    ]

    X = df[feature_columns]
    y = df["label"]

    categorical_features = ["preferred_category", "preferred_type", "preferred_genre", "content_category", "content_type", "primary_genre"]
    numeric_features = [column for column in feature_columns if column not in categorical_features]

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("numeric", "passthrough", numeric_features),
        ]
    )

    model = XGBRegressor(
        n_estimators=280,
        max_depth=6,
        learning_rate=0.07,
        subsample=0.88,
        colsample_bytree=0.82,
        random_state=42,
        objective="reg:squarederror",
        n_jobs=1,
    )

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", model),
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    mae = float(mean_absolute_error(y_test, predictions))
    r2 = float(r2_score(y_test, predictions))
    train_score = float(pipeline.score(X_train, y_train))

    bundle = TrainedBundle(
        pipeline=pipeline,
        feature_columns=feature_columns,
        train_score=train_score,
        test_mae=mae,
        test_r2=r2,
    )
    joblib.dump(
        {
            "pipeline": bundle.pipeline,
            "feature_columns": bundle.feature_columns,
            "train_score": bundle.train_score,
            "test_mae": bundle.test_mae,
            "test_r2": bundle.test_r2,
        },
        MODEL_PATH,
    )
    return bundle


def train_and_save_model() -> TrainedBundle:
    _ensure_directories()
    cleaned_df = _build_messy_dataset()
    return _train_pipeline(cleaned_df)


if __name__ == "__main__":
    bundle = train_and_save_model()
    print("Model trained and saved to:", MODEL_PATH)
    print({"train_score": bundle.train_score, "test_mae": bundle.test_mae, "test_r2": bundle.test_r2})
