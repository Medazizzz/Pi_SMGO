import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("dataset.csv")

X = df["comment"]
y = df["label"]

vectorizer = TfidfVectorizer()
X_vectorized = vectorizer.fit_transform(X)

model = LogisticRegression()
model.fit(X_vectorized, y)

os.makedirs("model", exist_ok=True)

joblib.dump(model, "model/sentiment_model.pkl")
joblib.dump(vectorizer, "model/tfidf_vectorizer.pkl")

print("Model trained and saved")