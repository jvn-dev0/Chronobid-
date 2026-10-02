from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
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
    ai_data: Optional[dict] = None
    image_url: Optional[str] = None

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
class SellerStep3Request(BaseModel):
    full_name: str
    dob: str
    gender: str
    nationality: str
    country: str
    state: str
    city: str
    street_address: str
    landmark: Optional[str] = None
    postal_code: str

class SellerStep4Request(BaseModel):
    id_document_type: str
    id_document_number: Optional[str] = None
    id_expiry_date: Optional[str] = None
    id_document_url: str
    selfie_url: str

class SellerStep4VerifyRequest(BaseModel):
    id_document_type: str
    id_document_number: Optional[str] = None
    id_expiry_date: Optional[str] = None
    id_document_url: str
    selfie_url: str

class SellerMetricsDetail(BaseModel):
    face_similarity_score: float
    face_similarity_percentage: float
    face_match_status: str
    ocr_confidence: float
    ocr_status: str
    name_match_score: float

class SellerExtractedData(BaseModel):
    document_type: Optional[str] = None
    extracted_name: Optional[str] = None
    extracted_dob: Optional[str] = None
    extracted_doc_number: Optional[str] = None
    raw_doc_number: Optional[str] = None

class SellerStep4VerifyResponse(BaseModel):
    success: bool
    verification_status: str
    message: str
    reason: Optional[str] = None
    metrics: Optional[SellerMetricsDetail] = None
    extracted_data: Optional[SellerExtractedData] = None
    discrepancies: Optional[List[str]] = []
    debug_metadata: Optional[Dict[str, Any]] = None

class SellerSendOtpRequest(BaseModel):
    phone_number: str

class SellerSendOtpResponse(BaseModel):
    success: bool
    message: str
    phone_number: str
    resend_after_seconds: int = 60

class SellerVerifyOtpRequest(BaseModel):
    phone_number: str
    otp_code: str

class SellerVerifyOtpResponse(BaseModel):
    success: bool
    message: str
    phone_verified: bool = True

class SellerStep5Request(BaseModel):
    phone_number: str
    phone_verified: bool = True

class SellerIfscLookupRequest(BaseModel):
    bank_ifsc: str

class SellerIfscLookupResponse(BaseModel):
    success: bool
    bank_name: Optional[str] = None
    bank_branch_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    message: Optional[str] = None

class SellerBankVerifyRequest(BaseModel):
    bank_account_name: str
    bank_account_number: str
    confirm_account_number: str
    bank_ifsc: str
    bank_account_type: str

class SellerBankVerifyResponse(BaseModel):
    success: bool
    message: str
    verified_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch_name: Optional[str] = None
    bank_ifsc: Optional[str] = None
    masked_account_number: Optional[str] = None

class SellerStep6Request(BaseModel):
    bank_account_name: str
    bank_name: str
    bank_account_number: str
    bank_ifsc: str
    bank_branch_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_verified: Optional[bool] = True

class SellerApplicationDetail(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    street_address: Optional[str] = None
    landmark: Optional[str] = None
    postal_code: Optional[str] = None
    id_document_type: Optional[str] = None
    id_document_number: Optional[str] = None
    id_expiry_date: Optional[str] = None
    id_document_url: Optional[str] = None
    selfie_url: Optional[str] = None
    phone_number: Optional[str] = None
    phone_verified: Optional[bool] = False
    bank_account_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch_name: Optional[str] = None
    bank_account_type: Optional[str] = None
    bank_verified: Optional[bool] = False
    extracted_name: Optional[str] = None
    extracted_dob: Optional[str] = None
    extracted_doc_number: Optional[str] = None
    face_match_score: Optional[float] = None
    face_match_status: Optional[str] = None
    ocr_status: Optional[str] = None
    verification_reason: Optional[str] = None

class SellerOnboardingStatusResponse(BaseModel):
    completed: bool
    current_step: int
    next_step: str
    verification_status: str
    steps_completed: dict
    application: SellerApplicationDetail

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

# ─── Bidding Page Schemas ────────────────────────────────────────────────────────
from typing import List

class BidHistoryItem(BaseModel):
    id: int
    bid_amount: float
    timestamp: datetime
    buyer_name: str

    class Config:
        from_attributes = True

class AuctionDetailResponse(AuctionResponse):
    description: Optional[str] = None
    condition: Optional[str] = None
    material: Optional[str] = None
    seller_name: str
    current_highest_bid: Optional[float] = None
    bid_history: List[BidHistoryItem] = []

# ─── Escrow Schemas ──────────────────────────────────────────────────────────
class EscrowResponse(BaseModel):
    id: int
    auction_id: int
    locked_amount: float
    status: str
    auction_title: Optional[str] = None
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None

    class Config:
        from_attributes = True

