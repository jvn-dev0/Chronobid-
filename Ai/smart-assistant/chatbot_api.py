from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn
import os

app = FastAPI(title="Chronobid Smart Assistant API")

# Global variables to hold the trained model
vectorizer = None
tfidf_matrix = None
questions_list = []
answers_list = []

class QueryRequest(BaseModel):
    query: str

@app.on_event("startup")
def load_and_train_model():
    global vectorizer, tfidf_matrix, questions_list, answers_list
    
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'ChronoBid_300_FAQ_Knowledge_Base.xlsx')
    print(f"Loading data from {file_path}...")
    
    try:
        df = pd.read_excel(file_path)
        if 'Question' in df.columns and 'Answer' in df.columns:
            questions_list = df['Question'].astype(str).tolist()
            answers_list = df['Answer'].astype(str).tolist()
            
            # Train the TF-IDF model
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(questions_list)
            print("Model trained successfully with {} FAQs.".format(len(questions_list)))
        else:
            print("Error: Excel file must contain 'Question' and 'Answer' columns.")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.post("/ask")
def ask_question(request: QueryRequest):
    if not vectorizer or not tfidf_matrix is not None:
        return {"error": "Model not loaded properly."}
        
    query_vec = vectorizer.transform([request.query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    best_idx = similarities.argmax()
    
    # Confidence threshold
    if similarities[best_idx] < 0.2:
        return {
            "query": request.query,
            "answer": "I'm sorry, I couldn't find an exact answer to that question. Please try rephrasing or contact support.",
            "confidence": float(similarities[best_idx])
        }
        
    return {
        "query": request.query,
        "answer": answers_list[best_idx],
        "confidence": float(similarities[best_idx]),
        "matched_question": questions_list[best_idx]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
