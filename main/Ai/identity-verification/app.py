from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Optional
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
    selfie: UploadFile = File(...),
    profile_name: Optional[str] = Form(None),
    profile_dob: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    doc_number: Optional[str] = Form(None)
):
    """
    Biometric Facial Verification & Local OCR API.
    Processes:
    - ID card image + Selfie photo
    - Verifies facial embeddings with DeepFace / OpenCV
    - Runs local OCR & regex field parser
    - Matches with seller profile data
    """
    id_path = ""
    selfie_path = ""
    try:
        # Save uploaded files temporarily
        id_ext = os.path.splitext(id_card.filename or ".jpg")[1] or ".jpg"
        selfie_ext = os.path.splitext(selfie.filename or ".jpg")[1] or ".jpg"
        id_path = f"temp_uploads/{seller_id}_id_{os.urandom(4).hex()}{id_ext}"
        selfie_path = f"temp_uploads/{seller_id}_selfie_{os.urandom(4).hex()}{selfie_ext}"
        
        with open(id_path, "wb") as buffer:
            shutil.copyfileobj(id_card.file, buffer)
            
        with open(selfie_path, "wb") as buffer:
            shutil.copyfileobj(selfie.file, buffer)
            
        # Run the full AI verification pipeline
        report = pipeline.run_full_verification(
            seller_id=seller_id,
            id_image_path=id_path,
            selfie_image_path=selfie_path,
            profile_name=profile_name or "",
            profile_dob=profile_dob or "",
            doc_type=doc_type or "",
            doc_number=doc_number or ""
        )
        
        return report
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp files
        if id_path and os.path.exists(id_path):
            try:
                os.remove(id_path)
            except Exception:
                pass
        if selfie_path and os.path.exists(selfie_path):
            try:
                os.remove(selfie_path)
            except Exception:
                pass

@app.get("/health")
def health():
    return {"status": "ok", "service": "Identity Verification AI"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
