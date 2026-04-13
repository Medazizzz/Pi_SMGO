import joblib
from flask import Flask, request, jsonify

app = Flask(__name__)

# =========================
# SENTIMENT MODEL
# =========================
sentiment_model = joblib.load("model/sentiment_model.pkl")
vectorizer = joblib.load("model/tfidf_vectorizer.pkl")

# =========================
# SENTIMENT ROUTE
# =========================
@app.route("/predict-sentiment", methods=["POST"])
def predict_sentiment():
    data = request.get_json()
    comment = data.get("comment", "")

    if not comment.strip():
        return jsonify({"error": "comment is required"}), 400

    vectorized = vectorizer.transform([comment])
    prediction = sentiment_model.predict(vectorized)[0]

    return jsonify({"sentiment": prediction})

if __name__ == "__main__":
    app.run(port=5000, debug=True)