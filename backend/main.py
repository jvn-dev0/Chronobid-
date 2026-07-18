from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, auctions, bids, wallet, shipping, admin

app = FastAPI(title="ChronoBid Core Backend API")

# Configure CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all of our routers
app.include_router(auth.router)
app.include_router(auctions.router)
app.include_router(bids.router)
app.include_router(wallet.router)
app.include_router(shipping.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to ChronoBid Core Backend API! System is online."}
