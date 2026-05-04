from __future__ import annotations

from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request

from train_model import MODEL_PATH, train_and_save_model

BASE_DIR = Path(__file__).resolve().parent
app = Flask(__name__)


class ModelBundle:
    def __init__(self, pipeline, feature_columns, train_score, test_mae, test_r2):
        self.pipeline = pipeline
        self.feature_columns = feature_columns
        self.train_score = train_score
        self.test_mae = test_mae
        self.test_r2 = test_r2


def load_bundle() -> ModelBundle:
    try:
        if not MODEL_PATH.exists():
            trained = train_and_save_model()
            return ModelBundle(trained.pipeline, trained.feature_columns, trained.train_score, trained.test_mae, trained.test_r2)

        bundle = joblib.load(MODEL_PATH)
        if isinstance(bundle, dict):
            return ModelBundle(
                bundle["pipeline"],
                bundle.get("feature_columns", []),
                bundle.get("train_score", 0.0),
                bundle.get("test_mae", 0.0),
                bundle.get("test_r2", 0.0),
            )

        if hasattr(bundle, "pipeline"):
            return ModelBundle(
                bundle.pipeline,
                getattr(bundle, "feature_columns", []),
                getattr(bundle, "train_score", 0.0),
                getattr(bundle, "test_mae", 0.0),
                getattr(bundle, "test_r2", 0.0),
            )
    except Exception:
        trained = train_and_save_model()
        return ModelBundle(trained.pipeline, trained.feature_columns, trained.train_score, trained.test_mae, trained.test_r2)

    trained = train_and_save_model()
    return ModelBundle(trained.pipeline, trained.feature_columns, trained.train_score, trained.test_mae, trained.test_r2)


MODEL_BUNDLE = load_bundle()


def _normalize_values(values: Any) -> list[str]:
    if values is None:
        return []
    if isinstance(values, str):
        return [values]
    if isinstance(values, list):
        return [str(item) for item in values if item is not None and str(item).strip()]
    return [str(values)]


def _parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _build_feature_row(content: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    user_categories = [item.upper() for item in _normalize_values(user.get("preferredCategories") or user.get("preferred_categories"))]
    user_types = [item.upper() for item in _normalize_values(user.get("preferredTypes") or user.get("preferred_types"))]
    user_genres = [item.lower() for item in _normalize_values(user.get("preferredGenres") or user.get("preferred_genres"))]

    content_category = str(content.get("category") or "UNKNOWN").upper()
    content_type = str(content.get("contentType") or content.get("type") or content.get("content_type") or "UNKNOWN").upper()
    genres = [str(item).lower() for item in _normalize_values(content.get("genres") or content.get("genreIds") or content.get("genre_ids"))]
    primary_genre = genres[0] if genres else "unknown"

    category_match = 1.0 if content_category in user_categories else 0.0
    type_match = 1.0 if content_type in user_types else 0.0
    genre_overlap_count = float(len(set(genres).intersection(user_genres)))
    genre_overlap_ratio = genre_overlap_count / max(len(genres), 1)

    view_count = float(content.get("viewCount") or content.get("view_count") or 0)
    log_views = float(np.log1p(view_count))

    publish_date = _parse_date(content.get("publishAt") or content.get("releaseDate") or content.get("publishedAt") or content.get("publish_at"))
    if publish_date is None:
        freshness_score = 0.0
        days_since_publish = 365.0
    else:
        age_days = max((datetime.utcnow() - publish_date).days, 0)
        days_since_publish = float(age_days)
        freshness_score = max(0.0, 1.0 - min(age_days, 900) / 900.0)

    return {
        "preferred_category": user_categories[0] if user_categories else "UNKNOWN",
        "preferred_type": user_types[0] if user_types else "UNKNOWN",
        "preferred_genre": user_genres[0] if user_genres else "unknown",
        "content_category": content_category,
        "content_type": content_type,
        "primary_genre": primary_genre,
        "category_match": category_match,
        "type_match": type_match,
        "genre_overlap_count": genre_overlap_count,
        "genre_overlap_ratio": genre_overlap_ratio,
        "view_count": view_count,
        "log_views": log_views,
        "days_since_publish": days_since_publish,
        "freshness_score": freshness_score,
    }


def _build_reason(row: dict[str, Any]) -> str:
    reasons: list[str] = []
    if row["category_match"] > 0:
        reasons.append("matches your preferred category")
    if row["type_match"] > 0:
        reasons.append("matches your preferred content type")
    if row["genre_overlap_count"] > 0:
        reasons.append("shares genres you like")
    if row["freshness_score"] >= 0.7:
        reasons.append("recently published")
    if row["view_count"] >= 1000:
        reasons.append("popular content")
    if not reasons:
        reasons.append("balanced content profile")
    return ", ".join(reasons)


@app.get("/health")
def health() -> tuple[Any, int]:
    return jsonify(
        {
            "status": "ok",
            "modelPath": str(MODEL_PATH),
            "trainScore": getattr(MODEL_BUNDLE, "train_score", None),
            "testMae": getattr(MODEL_BUNDLE, "test_mae", None),
            "testR2": getattr(MODEL_BUNDLE, "test_r2", None),
        }
    ), 200


@app.post("/recommend")
def recommend() -> tuple[Any, int]:
    payload = request.get_json(silent=True) or {}
    user = payload.get("user") or {}
    contents = payload.get("contents") or []
    limit = int(payload.get("limit") or 6)

    if not contents:
        return jsonify([]), 200

    rows = [_build_feature_row(content, user) for content in contents]
    frame = pd.DataFrame(rows)
    predictions = np.asarray(MODEL_BUNDLE.pipeline.predict(frame), dtype=float)
    predictions = np.clip(predictions, 0.0, 1.0)

    recommendations: list[dict[str, Any]] = []
    for content, score, row in zip(contents, predictions.tolist(), rows):
        recommendations.append(
            {
                "contentId": content.get("contentId") or content.get("id"),
                "title": content.get("title") or "Untitled",
                "description": content.get("description"),
                "category": (content.get("category") or "MOVIE").upper(),
                "genres": _normalize_values(content.get("genres") or content.get("genreIds") or content.get("genre_ids")),
                "viewCount": int(content.get("viewCount") or content.get("view_count") or 0),
                "engagementScore": float(round(score * 100, 3)),
                "recommendationScore": float(round(score * 100, 3)),
                "reason": _build_reason(row),
            }
        )

    recommendations.sort(key=lambda item: item["recommendationScore"], reverse=True)
    return jsonify(recommendations[:limit]), 200


@app.post("/train")
def retrain() -> tuple[Any, int]:
    bundle = train_and_save_model()
    global MODEL_BUNDLE
    MODEL_BUNDLE = ModelBundle(bundle.pipeline, bundle.feature_columns, bundle.train_score, bundle.test_mae, bundle.test_r2)
    return jsonify(
        {
            "message": "model retrained",
            "trainScore": bundle.train_score,
            "testMae": bundle.test_mae,
            "testR2": bundle.test_r2,
            "modelPath": str(MODEL_PATH),
        }
    ), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5055, debug=False)
