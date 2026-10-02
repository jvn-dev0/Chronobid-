import os
import uuid
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, Form, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from PIL import Image

from config import settings
from verification_engine import VerificationEngine, CHRONOBID_CATEGORIES

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] req_id=%(threadName)s: %(message)s"
)
logger = logging.getLogger("chronobid_ai")

engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    logger.info("🚀 Starting up ChronoBid AI Verification Service...")
    engine = VerificationEngine()
    engine.load_dataset_embeddings()
    yield
    logger.info("🛑 Shutting down AI Verification Service...")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "dataset_loaded": engine.dataset_loaded if engine else False,
        "registered_categories": len(CHRONOBID_CATEGORIES)
    }

@app.get("/categories")
def get_categories():
    return {"categories": CHRONOBID_CATEGORIES}

@app.post("/verify")
@limiter.limit("30/minute")
def verify_item(
    request: Request,
    file: UploadFile = File(...),
    declared_category: str = Form(None),
    declared_title: str = Form(None)
):
    req_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    logger.info(f"[{req_id}] Incoming verify request for file: {file.filename}")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type and file.content_type.lower() not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Only JPEG, PNG, and WEBP are allowed."
        )

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_filename = f"{uuid.uuid4()}.jpg"
    temp_path = os.path.join(temp_dir, temp_filename)

    try:
        contents = file.file.read()
        if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum allowed size ({settings.MAX_FILE_SIZE_MB} MB)."
            )

        with open(temp_path, "wb") as f:
            f.write(contents)

        try:
            with Image.open(temp_path) as img:
                img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

        report = engine.verify_item(
            image_path=temp_path,
            declared_category=declared_category,
            declared_title=declared_title,
            upload_id=req_id
        )

        elapsed = round(time.time() - start_time, 3)
        logger.info(f"[{req_id}] Verification complete in {elapsed}s | Decision={report.get('decision')}")
        return report

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"[{req_id}] Internal verification error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal AI verification failure",
                "message": "The AI verification engine encountered an unexpected error. Please retry."
            }
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
