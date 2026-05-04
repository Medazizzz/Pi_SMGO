# XGBoost Recommendation Service

This service trains and serves a content recommendation model with XGBoost.

## What it does
- Generates a messy synthetic dataset with duplicate rows and missing values.
- Cleans the data using `dropna()` and `drop_duplicates()`.
- Trains an XGBoost regressor.
- Saves the trained pipeline with `joblib`.
- Serves `/recommend` and `/health` through Flask.

## Files
- `train_model.py` trains the model and writes `model/content_recommender.joblib`.
- `app.py` loads the saved model and serves predictions.
- `sample_request.json` is a ready-to-run test payload.
- `test_client.py` sends the sample request to the Flask app.

## Install
```bash
cd ai-service
python -m pip install -r requirements.txt
```

## Train
```bash
python train_model.py
```

## Run the service
```bash
python app.py
```

## Test the service
```bash
python test_client.py
```

## API
### `GET /health`
Returns model metrics and service status.

### `POST /recommend`
Request body example:
```json
{
  "limit": 6,
  "user": {
    "preferredCategories": ["MOVIE", "SERIES"],
    "preferredTypes": ["FILM", "SERIES"],
    "preferredGenres": ["Action", "Adventure", "Drama"]
  },
  "contents": [
    {
      "contentId": "1",
      "title": "Galaxy Run",
      "category": "MOVIE",
      "contentType": "FILM",
      "genres": ["Action", "Sci-Fi"],
      "viewCount": 2400,
      "releaseDate": "2025-09-10T10:00:00"
    }
  ]
}
```

## Better recommendation idea
If you want a stronger version later, the next step would be a hybrid recommender:
- XGBoost for ranking
- plus collaborative signals from reservations/watch history
- plus content similarity from genres and tags

That is better than using category or type alone.
