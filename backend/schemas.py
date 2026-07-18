from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ─── Auth Schemas ────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    username: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: str  # "buyer" or "seller"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

# ─── Auction Schemas ──────────────────────────────────────────────────────────
class AuctionCreate(BaseModel):
    title: str
    category_id: int
    start_time: datetime
    end_time: datetime
    reserve_price: float
    description: str
    condition: Optional[str] = None
    material: Optional[str] = None

class AuctionResponse(BaseModel):
    id: int
    title: str
    reserve_price: float
    status: str
    start_time: datetime
    end_time: datetime

    class Config:
        from_attributes = True

# ─── Bid Schemas ──────────────────────────────────────────────────────────────
class BidPlace(BaseModel):
    auction_id: int
    bid_amount: float

class BidResponse(BaseModel):
    id: int
    auction_id: int
    bid_amount: float
    timestamp: datetime

    class Config:
        from_attributes = True

# ─── Wallet Schemas ───────────────────────────────────────────────────────────
class WalletResponse(BaseModel):
    id: int
    balance: float
    locked_balance: float

    class Config:
        from_attributes = True
