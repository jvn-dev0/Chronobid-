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

class GoogleLogin(BaseModel):
    credential: str
    role: Optional[str] = "buyer"  # Default role for new signups via Google

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

class DepositRequest(BaseModel):
    amount: float
    payment_method: str # e.g. 'Credit Card', 'UPI'

class WithdrawRequest(BaseModel):
    amount: float
    bank_account: str

class WalletTransactionResponse(BaseModel):
    id: int
    amount: float
    transaction_type: str
    timestamp: datetime

    class Config:
        from_attributes = True

# ─── Shipping Schemas ──────────────────────────────────────────────────────────
class ShippingUpdate(BaseModel):
    order_id: int
    courier_name: str
    tracking_number: str

class ShippingResponse(BaseModel):
    id: int
    order_id: int
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    shipping_status: str

    class Config:
        from_attributes = True

# ─── Admin Schemas ────────────────────────────────────────────────────────────
class AdminActionRequest(BaseModel):
    auction_id: int
    action: str # "Approve" or "Reject"
    comments: Optional[str] = None

# ─── Order & Finalization Schemas ──────────────────────────────────────────────
class OrderResponse(BaseModel):
    id: int
    auction_id: int
    buyer_id: int
    amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FinalizeResponse(BaseModel):
    message: str
    auction_status: str
    winning_bid: Optional[float] = None
    order_id: Optional[int] = None

# ─── Seller Application Schemas ────────────────────────
class SellerApplicationRequest(BaseModel):
    # Step 3: Personal Information
    dob: str
    gender: str
    nationality: str
    country: str
    state: str
    city: str
    street_address: str
    landmark: Optional[str] = None
    postal_code: str
    
    # Step 4: Identity Verification
    id_document_type: str
    id_document_number: str
    id_expiry_date: Optional[str] = None
    id_document_url: str
    selfie_url: str

    # Step 5: Contact Verification
    phone_number: Optional[str] = None
    phone_verified: Optional[bool] = False

    # Step 6: Bank Information
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch_name: Optional[str] = None
    bank_account_type: Optional[str] = None
