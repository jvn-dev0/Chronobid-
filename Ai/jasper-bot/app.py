from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import httpx
import uvicorn
import shutil
import os
from contextlib import asynccontextmanager
from recommender_engine import RecommenderEngine

# Global Variables for AI Models
vectorizer = None
tfidf_matrix = None
questions_list = []
answers_list = []
recommender = RecommenderEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load TF-IDF FAQ Model
    global vectorizer, tfidf_matrix, questions_list, answers_list
    file_path = os.path.join(os.path.dirname(__file__), 'data', 'ChronoBid_300_FAQ_Knowledge_Base.xlsx')
    print(f"Loading FAQ data from {file_path}...")
    try:
        df = pd.read_excel(file_path)
        if 'Question' in df.columns and 'Answer' in df.columns:
            questions_list = df['Question'].astype(str).tolist()
            answers_list = df['Answer'].astype(str).tolist()
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(questions_list)
            print(f"FAQ Model trained successfully with {len(questions_list)} FAQs.")
    except Exception as e:
        print(f"Error loading FAQ model: {e}")

    # 2. Load Recommender Data
    print("Loading Recommender data...")
    recommender.load_data()
    
    yield
    print("Shutting down JasperBot...")

app = FastAPI(title="Jasper - Master AI Orchestrator", lifespan=lifespan)

ITEM_VERIFY_URL = "http://localhost:8001"

class ChatRequest(BaseModel):
    user_role: str # "guest", "seller", "bidder"
    user_id: int = None # None if guest
    message: str

@app.get("/")
def jasper_home():
    return {"message": "Hello, I am Jasper. All systems are online."}

def get_faq_answer(query: str):
    if not vectorizer or tfidf_matrix is None:
        return "Pardon me, but my FAQ knowledge base is currently offline."
    
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    best_idx = similarities.argmax()
    
    if similarities[best_idx] < 0.2:
        return None
    return answers_list[best_idx]

@app.post("/chat")
async def chat_with_jasper(req: ChatRequest):
    message_lower = req.message.lower()
    
    # 1. GUEST MODE
    if req.user_role.lower() == "guest":
        answer = get_faq_answer(req.message)
        if answer:
            return {"jasper_reply": answer}
        return {"jasper_reply": "I'm sorry, I couldn't find an exact answer to that question. Please try rephrasing or register for an account to contact support."}
            
    # 2. BIDDER MODE (Recommendations & FAQ)
    elif req.user_role.lower() == "bidder":
        # Handle recommendation request
        if "recommend" in message_lower or "suggest" in message_lower or "what should i bid on" in message_lower:
            if not req.user_id:
                return {"jasper_reply": "I need to know who you are to make personalized recommendations!"}
                
            res = recommender.get_recommendations(req.user_id, top_n=3)
            
            if isinstance(res, dict) and "error" in res:
                return {"jasper_reply": f"Sorry, I couldn't generate recommendations: {res['error']}"}
            
            if not res:
                return {"jasper_reply": "I couldn't find any good recommendations for you right now."}
                
            # Formatting the response specifically as requested by the user
            user = recommender.users_df[recommender.users_df['user_id'] == req.user_id]
            if user.empty:
                return {"jasper_reply": "I couldn't find your profile in my records."}
                
            escrow = float(user.iloc[0]['escrow_balance'])
            
            # Get search history
            user_history = recommender.behavior_df[recommender.behavior_df['user_id'] == req.user_id]
            searched_item_ids = user_history[user_history['action_type'] == 'search']['item_id'].tolist()
            searched_categories = set()
            for i_id in searched_item_ids:
                item = recommender.items_df[recommender.items_df['item_id'] == i_id]
                if not item.empty:
                    searched_categories.add(item.iloc[0]['category'])
                    
            search_str = ", ".join(searched_categories) if searched_categories else "various antiques"
            
            item_texts = []
            for item in res:
                can_afford = "You have enough in escrow to cover the base price." if escrow >= item['price'] else "You might need to add funds to your escrow to win this."
                item_texts.append(f"• **{item['title']}** (${item['price']}) - {can_afford}")
                
            recs_str = "\n".join(item_texts)
            
            return {"jasper_reply": f"Based on your recent searches for {search_str} and your current escrow balance of ${escrow:,.2f}, I recommend the following items you can safely bid on:\n\n{recs_str}"}

        # Fallback to FAQ for bidder
        answer = get_faq_answer(req.message)
        if answer:
            return {"jasper_reply": answer}
            
        return {"jasper_reply": "As a bidder, I can recommend items or answer questions about ChronoBid. What do you need help with?"}
        
    # 3. SELLER MODE
    elif req.user_role.lower() == "seller":
        answer = get_faq_answer(req.message)
        if answer:
            return {"jasper_reply": answer}
        return {"jasper_reply": "Welcome back to your seller suite. You can submit items for verification or check your dashboard."}

    return {"jasper_reply": "I'm not sure how to assist with that role. Are you a guest, seller, or bidder?"}

@app.post("/verify_item")
async def verify_item_route(file: UploadFile = File(...)):
    print("Jasper is sending item to Verification Engine...")
    temp_file = f"temp_item_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(temp_file, "rb") as f:
                files = {"file": (file.filename, f, file.content_type)}
                response = await client.post(f"{ITEM_VERIFY_URL}/verify", files=files)
                
        if os.path.exists(temp_file):
            os.remove(temp_file)
            
        if response.status_code == 200:
            return {
                "jasper_status": "Success",
                "message_to_seller": "Your item has been processed and sent to Admin for final approval.",
                "admin_report": response.json()
            }
        else:
            raise HTTPException(status_code=response.status_code, detail="Verification Engine failed.")
            
    except httpx.RequestError as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=503, detail="The Verification Engine is currently offline.")
