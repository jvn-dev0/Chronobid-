import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import sys

def load_data(file_path):
    try:
        df = pd.read_excel(file_path)
        # Assuming columns are 'Question' and 'Answer' or similar
        # Fallback to 1st and 2nd columns if named differently
        if 'Question' not in df.columns or 'Answer' not in df.columns:
            df.columns = ['Question', 'Answer'] + list(df.columns[2:])
            
        questions = df['Question'].astype(str).tolist()
        answers = df['Answer'].astype(str).tolist()
        return questions, answers
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def get_best_answer(user_query, questions, answers, vectorizer, tfidf_matrix):
    query_vec = vectorizer.transform([user_query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    best_idx = similarities.argmax()
    
    if similarities[best_idx] < 0.2:
        return "I'm sorry, I couldn't find an answer to that question in my knowledge base."
    
    return answers[best_idx]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided."}))
        sys.exit(1)
        
    user_query = sys.argv[1]
    
    # Load and Train
    questions, answers = load_data('data/ChronoBid_300_FAQ_Knowledge_Base.xlsx')
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(questions)
    
    # Predict
    answer = get_best_answer(user_query, questions, answers, vectorizer, tfidf_matrix)
    
    print(json.dumps({
        "query": user_query,
        "answer": answer
    }))
