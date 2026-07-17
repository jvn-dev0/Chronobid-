from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from identity_pipeline import IdentityPipeline
import shutil
import os

app = FastAPI(title="Chronobid Identity Verification API")
pipeline = IdentityPipeline()

# Ensure temp directory exists for uploads
os.makedirs("temp_uploads", exist_ok=True)

@app.post("/verify_identity")
async def verify_identity(
    seller_id: str = Form(...),
    id_card: UploadFile = File(...),
    selfie: UploadFile = File(...)
):
    try:
        # Save uploaded files temporarily
        id_path = f"temp_uploads/{seller_id}_id.jpg"
        selfie_path = f"temp_uploads/{seller_id}_selfie.jpg"
        
        with open(id_path, "wb") as buffer:
            shutil.copyfileobj(id_card.file, buffer)
            
        with open(selfie_path, "wb") as buffer:
            shutil.copyfileobj(selfie.file, buffer)
            
        # Run the AI pipeline
        report = pipeline.run_full_pipeline(seller_id, id_path, selfie_path)
        
        # Clean up temp files
        os.remove(id_path)
        os.remove(selfie_path)
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
