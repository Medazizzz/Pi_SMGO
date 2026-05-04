import joblib
from flask import Flask, request, jsonify

app = Flask(__name__)

sentiment_model = joblib.load("model/sentiment_model.pkl")
vectorizer = joblib.load("model/tfidf_vectorizer.pkl")


@app.route("/predict-sentiment", methods=["POST"])
def predict_sentiment():
    data = request.get_json()
    comment = data.get("comment", "")

    if not comment.strip():
        return jsonify({"error": "comment is required"}), 400

    text = comment.lower()

    negative_words = [
        "hate", "bad", "bade", "terrible", "awful",
        "boring", "worst", "dislike", "not good"
    ]

    positive_words = [
        "love", "good", "great", "amazing", "excellent",
        "perfect", "nice", "best", "like"
    ]

    if any(word in text for word in negative_words):
        return jsonify({"sentiment": "NEGATIF"})

    if any(word in text for word in positive_words):
        return jsonify({"sentiment": "POSITIF"})

    vectorized = vectorizer.transform([comment])
    prediction = sentiment_model.predict(vectorized)[0]

    return jsonify({"sentiment": prediction})


if __name__ == "__main__":
    app.run(port=5000, debug=True)