from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from routers import auth, auctions, bids, wallet, shipping, admin, admin_users, admin_auctions, admin_finance, admin_system, seller, escrow, notifications

app = FastAPI(title="ChronoBid Core Backend API")

# Configure CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all of our routers
# Mount uploads directory for static file serving
uploads_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=uploads_dir), name="api_uploads")

app.include_router(auth.router)
app.include_router(auctions.router)
app.include_router(bids.router)
app.include_router(wallet.router)
app.include_router(shipping.router)
app.include_router(admin.router)
app.include_router(admin_users.router)
app.include_router(admin_auctions.router)
app.include_router(admin_finance.router)
app.include_router(admin_system.router)
app.include_router(seller.router)
app.include_router(escrow.router)
app.include_router(notifications.router)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    import traceback
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    )

from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

@app.get("/api/version")
def get_version():
    return {"version": "1.0.1", "commit": "diagnostic-v1"}

@app.get("/api/db-test")
def db_test(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        res = db.execute(text("SELECT count(*) FROM users")).fetchone()
        return {"status": "connected", "user_count": res[0]}
    except Exception as e:
        return {"status": "error", "error": str(e), "type": type(e).__name__}

@app.get("/")
def read_root():
    return {"message": "Welcome to ChronoBid Core Backend API! System is online."}

