from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import httpx
import uvicorn
import shutil
import os

app = FastAPI(title="Jasper - Master AI Orchestrator")

# Microservice URLs (Internal Network)
# Note: Identity Verification (Port 8003) is a standalone module
# that works directly in the Seller Registration UI, not through Jasper.
SMART_ASSISTANT_URL = "http://localhost:8000"
ITEM_VERIFY_URL = "http://localhost:8001"
RECOMMENDER_URL = "http://localhost:8002"

class ChatRequest(BaseModel):
    user_role: str # "guest", "seller", "bidder"
    user_id: int = None # None if guest
    message: str

@app.get("/")
def jasper_home():
    return {"message": "Hello, I am Jasper. All systems are online."}

@app.post("/chat")
async def chat_with_jasper(req: ChatRequest):
    """
    Main Chat Interface. Jasper changes his behavior based on the role.
    """
    # 1. GUEST MODE (FAQ)
    if req.user_role.lower() == "guest":
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(f"{SMART_ASSISTANT_URL}/ask", json={"question": req.message})
                if response.status_code == 200:
                    answer = response.json().get("answer")
                    return {"jasper_reply": answer}
        except httpx.RequestError:
            return {"jasper_reply": "Pardon me, but the Smart Assistant engine seems to be offline. Please register and login for further assistance."}
            
    # 2. BIDDER MODE (Recommendations)
    elif req.user_role.lower() == "bidder":
        if "recommend" in req.message.lower() or "suggest" in req.message.lower():
            if not req.user_id:
                return {"jasper_reply": "I need your User ID to make personalized recommendations."}
                
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(f"{RECOMMENDER_URL}/recommend", json={"user_id": req.user_id, "top_n": 3})
                    if response.status_code == 200:
                        recs = response.json().get("recommendations", [])
                        item_names = ", ".join([f"{r['title']} (${r['price']})" for r in recs])
                        return {"jasper_reply": f"Based on your budget and history, I highly recommend: {item_names}"}
            except httpx.RequestError:
                return {"jasper_reply": "I apologize, the Recommender Engine is currently resting."}
        
        return {"jasper_reply": "As a bidder, I can help you find items or explain the auction rules. What do you need?"}
        
    # 3. SELLER MODE
    elif req.user_role.lower() == "seller":
        return {"jasper_reply": "Welcome back to your seller suite. You can submit items for verification or check your dashboard."}

    return {"jasper_reply": "I'm not sure how to assist with that role. Are you a guest, seller, or bidder?"}


@app.post("/verify_item")
async def verify_item_route(file: UploadFile = File(...)):
    """
    Silent route triggered by the Seller UI to verify an item image.
    Jasper hands it to port 8001.
    """
    print("Jasper is sending item to Verification Engine...")
    
    # Save file temporarily to pass to the other API
    temp_file = f"temp_item_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(temp_file, "rb") as f:
                files = {"file": (file.filename, f, file.content_type)}
                response = await client.post(f"{ITEM_VERIFY_URL}/verify", files=files)
                
        os.remove(temp_file)
        
        if response.status_code == 200:
            result = response.json()
            # Jasper formats the response for the admin/seller UI
            return {
                "jasper_status": "Success",
                "message_to_seller": "Your item has been processed and sent to Admin for final approval.",
                "admin_report": result
            }
        else:
            raise HTTPException(status_code=response.status_code, detail="Verification Engine failed.")
            
    except httpx.RequestError as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=503, detail=f"Verification Engine is offline: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8004)
