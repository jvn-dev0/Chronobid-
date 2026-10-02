from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import httpx
import uvicorn
import shutil
import os
import logging
from typing import Optional
from contextlib import asynccontextmanager
from recommender_engine import RecommenderEngine
from llm_service import LLMService

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jasper_main")

# Global Variables for AI Models
vectorizer = None
tfidf_matrix = None
questions_list = []
answers_list = []

recommender = RecommenderEngine()
llm_service = LLMService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load TF-IDF FAQ Model using absolute os.path resolution
    global vectorizer, tfidf_matrix, questions_list, answers_list
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'data', 'ChronoBid_300_FAQ_Knowledge_Base.xlsx')
    logger.info(f"Loading FAQ data from {file_path}...")
    
    try:
        if os.path.exists(file_path):
            df = pd.read_excel(file_path)
            if 'Question' in df.columns and 'Answer' in df.columns:
                questions_list = df['Question'].astype(str).tolist()
                answers_list = df['Answer'].astype(str).tolist()
                vectorizer = TfidfVectorizer(stop_words='english')
                tfidf_matrix = vectorizer.fit_transform(questions_list)
                logger.info(f"FAQ Model trained successfully with {len(questions_list)} FAQs.")
            else:
                logger.warning("FAQ Excel file missing required 'Question' or 'Answer' columns.")
        else:
            logger.warning(f"FAQ Knowledge Base file not found at {file_path}")
    except Exception as e:
        logger.error(f"Error loading FAQ model: {e}")

    # 2. Load Recommender Engine Data
    logger.info("Loading Recommender data...")
    recommender.load_data()
    
    yield
    logger.info("Shutting down JasperBot...")

app = FastAPI(title="Jasper - Master AI Orchestrator", lifespan=lifespan)

ITEM_VERIFY_URL = os.getenv("ITEM_VERIFY_URL", "http://localhost:8001")

class ChatRequest(BaseModel):
    user_role: str  # "guest", "seller", "bidder"
    user_id: Optional[int] = None  # None if guest
    message: str

@app.get("/")
def jasper_home():
    return {"message": "Hello, I am Jasper. All systems are online."}

def get_top_faq_context(query: str, top_k: int = 3) -> Optional[str]:
    """Retrieves top K matching FAQ answers formatted as context using TF-IDF similarity."""
    if not vectorizer or tfidf_matrix is None or not questions_list:
        return None

    try:
        query_vec = vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        # Get indices of top_k highest scores
        top_indices = similarities.argsort()[-top_k:][::-1]
        
        relevant_faqs = []
        for idx in top_indices:
            if similarities[idx] >= 0.15:  # Relevance threshold
                q = questions_list[idx]
                a = answers_list[idx]
                relevant_faqs.append(f"Q: {q}\nA: {a}")
                
        if relevant_faqs:
            return "\n\n".join(relevant_faqs)
        return None
    except Exception as e:
        logger.error(f"Error retrieving FAQ context: {e}")
        return None

@app.post("/chat")
async def chat_with_jasper(req: ChatRequest):
    try:
        faq_context = get_top_faq_context(req.message, top_k=3)
        result = await llm_service.chat(
            user_role=req.user_role,
            user_id=req.user_id,
            message=req.message,
            faq_context=faq_context,
            recommender_engine=recommender
        )
        return {
            "jasper_reply": result.get("jasper_reply", ""),
            "recommendations": result.get("recommendations", [])
        }
    except Exception as e:
        logger.error(f"Error in /chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify_item")
async def verify_item_route(file: UploadFile = File(...)):
    logger.info("Jasper is sending item to Verification Engine...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    temp_file = os.path.join(base_dir, f"temp_item_{file.filename}")
    
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
