import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import zipfile
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from wordcloud import WordCloud
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize



app = Flask(__name__)
CORS(app) 

df = pd.read_csv('spotify_millsongdata.csv')

top_artists = df['artist'].value_counts().head(10)
print("\nTop 10 Artists:")
    
df = df.drop('link', axis=1).reset_index(drop=True)

all_lyrics = " ".join(df['text'].dropna())
wordcloud = WordCloud(width=800, height=400, background_color="white").generate(all_lyrics)
  
stop_words = set(stopwords.words('english'))
     

def preprocess_text(text):
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    text = text.lower()
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    return " ".join(tokens)
     

df['cleaned_text'] = df['text'].apply(preprocess_text)
     




# Vectorization with TF-IDF
tfidf_vectorizer = TfidfVectorizer(max_features=5000)
tfidf_matrix = tfidf_vectorizer.fit_transform(df['cleaned_text'])
     


from sklearn.metrics.pairwise import linear_kernel

def recommend_songs(song_name, tfidf_matrix=tfidf_matrix, df=df, top_n=5):
    idx = df[df['song'].str.lower() == song_name.lower()].index
    if len(idx) == 0:
        return "Song not found in the dataset!"
    
    idx = idx[0]

    # Efficient cosine similarity for just one row
    cosine_similarities = linear_kernel(tfidf_matrix[idx], tfidf_matrix).flatten()

    # Get top N matches excluding the song itself
    sim_scores = sorted(list(enumerate(cosine_similarities)), key=lambda x: x[1], reverse=True)[1:top_n+1]
    song_indices = [i[0] for i in sim_scores]

    return df[['artist', 'song']].iloc[song_indices]





import traceback

@app.route("/recommend", methods=["POST", "OPTIONS"])
def recommend():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    try:
        data = request.get_json()
        print("Received data:", data)

        if not data or "song" not in data:
            return jsonify({"error": "No song provided"}), 400
        
        song_name = data["song"]
        recommendations = recommend_songs(song_name)
        if isinstance(recommendations, str):
            return jsonify({"error": recommendations}), 404

        return jsonify({"recommendations": recommendations.to_dict(orient="records")}), 200
    
    except Exception as e:
        traceback.print_exc()  # Print full error info in console
        return jsonify({"error": "Server error"}), 500


if __name__ == "__main__":
    app.run(debug=True)

