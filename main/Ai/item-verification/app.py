import os
import shutil
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from verification_engine import VerificationEngine

app = FastAPI(title="Chronobid Item Verification API")

# Initialize engine globally
engine = VerificationEngine()

@app.on_event("startup")
def startup_event():
    print("Starting up verification API...")
    # Try to load embeddings if dataset exists
    engine.load_dataset_embeddings()

@app.post("/verify")
async def verify_item(file: UploadFile = File(...)):
    if not file.filename:
        return JSONResponse(status_code=400, content={"error": "No file provided"})
        
    # Save the uploaded file temporarily
    temp_dir = "temp_uploads"
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
        
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Run the verification engine
    try:
        report = engine.verify_item(temp_path)
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
    if "error" in report:
        return JSONResponse(status_code=500, content=report)
        
    return report

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
