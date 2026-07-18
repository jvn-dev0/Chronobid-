from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import os
import sys
import httpx
from dotenv import load_dotenv

# Add the Database folder to the path so we can use our SQLAlchemy models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Database')))
from database import get_db
import models
import models_phase2
import models_phase3_ai
from sqlalchemy.orm import Session

load_dotenv()

app = FastAPI(title="Jasper Orchestrator Bot")

# OpenAI API (using dummy or real if provided)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class ChatRequest(BaseModel):
    user_id: int
    role: str # "buyer" or "seller"
    message: str

@app.post("/api/jasper/chat")
async def chat_with_jasper(request: ChatRequest):
    """
    General conversational endpoint for Jasper.
    """
    # Simple Mock AI response for now. 
    # If using OpenAI, we would use openai.ChatCompletion.create() here.
    if request.role == "seller":
        response_msg = f"Good day! I am Jasper, your Chronobid Seller Assistant. I see you said: '{request.message}'. How can I help you list your antique today?"
    else:
        response_msg = f"Greetings! I am Jasper, your Chronobid Bidding Guide. I see you said: '{request.message}'. Are you looking for a specific vintage item?"

    return {"jasper_response": response_msg}


class VerificationRequest(BaseModel):
    user_id: int
    auction_item_id: int
    image_url: str

@app.post("/api/jasper/verify-item")
async def verify_item_via_jasper(request: VerificationRequest, db: Session = Depends(get_db)):
    """
    Jasper takes the image, sends it to the Item Verification Engine,
    and logs the result in the newly created database tables!
    """
    # 1. Jasper routes to the background Engine
    engine_url = os.getenv("ITEM_VERIFICATION_API_URL")
    
    # Simulate the Engine's response (since the engine is on another port)
    # In production: async with httpx.AsyncClient() as client: response = await client.post(...)
    mock_engine_response = {
        "authenticity_score": 92.5,
        "ai_confidence": 0.98,
        "museum_matches": ["https://metmuseum.org/art/collection/search/123"],
        "report_details": "Item appears to be authentic Victorian era."
    }

    # 2. Jasper saves the log to our database!
    new_report = models_phase3_ai.AIVerificationReport(
        auction_item_id=request.auction_item_id,
        authenticity_score=mock_engine_response["authenticity_score"],
        ai_confidence=mock_engine_response["ai_confidence"],
        museum_matches=mock_engine_response["museum_matches"],
        report_details=mock_engine_response["report_details"]
    )
    
    try:
        db.add(new_report)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    # 3. Jasper talks back to the user
    return {
        "jasper_response": "I have submitted your antique to the verification department. My initial scans look promising! I've logged the AI report securely in our database.",
        "log_id": new_report.id
    }
