from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    admin = "admin"
    guest = "guest"

# 1. Authentication Module
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    roles = relationship("UserRoleMapping", back_populates="user")
    buyer_profile = relationship("Buyer", back_populates="user", uselist=False)
    seller_profile = relationship("Seller", back_populates="user", uselist=False)
    wallet = relationship("Wallet", back_populates="user", uselist=False)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # buyer, seller, admin

class UserRoleMapping(Base):
    __tablename__ = "user_roles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    user = relationship("User", back_populates="roles")
    role = relationship("Role")

# 2. Buyer Profile
class Buyer(Base):
    __tablename__ = "buyers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    dob = Column(DateTime(timezone=True))
    gender = Column(String(20))
    trust_score = Column(Float, default=50.0)
    
    user = relationship("User", back_populates="buyer_profile")

# 3. Seller Profile
class Seller(Base):
    __tablename__ = "sellers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    shop_name = Column(String(100))
    shop_description = Column(Text)
    verification_status = Column(String(50), default="Pending") # Pending, Pending_Review, Approved, Rejected
    trust_score = Column(Float, default=50.0)
    
    # --- Application Fields (Step 3 & 4) ---
    dob = Column(String(50))
    gender = Column(String(50))
    nationality = Column(String(100))
    country = Column(String(100))
    state = Column(String(100))
    city = Column(String(100))
    street_address = Column(String(255))
    landmark = Column(String(255))
    postal_code = Column(String(50))
    id_document_type = Column(String(100))
    id_document_number = Column(String(100))
    id_expiry_date = Column(String(50))
    id_document_url = Column(String(500))
    selfie_url = Column(String(500))
    
    # --- Contact Verification (Step 5) ---
    phone_number = Column(String(50))
    phone_verified = Column(Boolean, default=False)
    
    # --- Bank Information (Step 6) ---
    bank_account_name = Column(String(150))
    bank_name = Column(String(100))
    bank_account_number = Column(String(100))
    bank_ifsc = Column(String(50))
    bank_branch_name = Column(String(100))
    bank_account_type = Column(String(50))
    
    user = relationship("User", back_populates="seller_profile")
    auctions = relationship("Auction", back_populates="seller")

# 4. Auction Module
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)

class Auction(Base):
    __tablename__ = "auctions"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    title = Column(String(200), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    reserve_price = Column(Float, nullable=False)
    status = Column(String(50), default="Draft") # Draft, Live, Ended
    
    seller = relationship("Seller", back_populates="auctions")
    item = relationship("AuctionItem", back_populates="auction", uselist=False)
    bids = relationship("Bid", back_populates="auction")

class AuctionItem(Base):
    __tablename__ = "auction_items"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), unique=True)
    description = Column(Text, nullable=False)
    condition = Column(String(100))
    material = Column(String(100))
    ai_authenticity_score = Column(Float)
    ai_estimated_price = Column(Float)
    
    auction = relationship("Auction", back_populates="item")
    images = relationship("AuctionImage", back_populates="item")

class AuctionImage(Base):
    __tablename__ = "auction_images"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("auction_items.id"))
    image_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    
    item = relationship("AuctionItem", back_populates="images")

# 5. Bidding Module
class Bid(Base):
    __tablename__ = "bids"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    bid_amount = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    auction = relationship("Auction", back_populates="bids")
    buyer = relationship("Buyer")

class WinningBid(Base):
    __tablename__ = "winning_bids"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), unique=True)
    bid_id = Column(Integer, ForeignKey("bids.id"))
    amount = Column(Float, nullable=False)

# 6. Escrow & Wallet Module
class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    balance = Column(Float, default=0.0)
    locked_balance = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="wallet")

class Escrow(Base):
    __tablename__ = "escrow"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    locked_amount = Column(Float, nullable=False)
    status = Column(String(50), default="Locked") # Locked, Released, Transferred

# 7. Payment Module
class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    gateway_transaction_id = Column(String(200))
    status = Column(String(50), default="Pending") # Pending, Success, Failed
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# 8. Shipping Module
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    winning_bid_id = Column(Integer, ForeignKey("winning_bids.id"))
    status = Column(String(50), default="Pending_Payment") # Pending_Payment, Paid, Shipped, Delivered

class Shipping(Base):
    __tablename__ = "shipping"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    courier_name = Column(String(100))
    tracking_number = Column(String(100))
    shipping_status = Column(String(50), default="Processing")

# 9. Review Module
class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text)

# 10. Notification Module
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# 11. Support Module
class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Open") # Open, In_Progress, Closed

# 12. Admin Module
class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    permission_level = Column(Integer, default=1) # 1=Basic, 2=Superadmin
