from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from database import Base

# Authentication Phase 2
class OTPVerification(Base):
    __tablename__ = "otp_verification"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    otp_code = Column(String(10), nullable=False)
    otp_type = Column(String(20)) # email, phone
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PasswordReset(Base):
    __tablename__ = "password_reset"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String(100), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    jwt_token = Column(String(500), nullable=False)
    ip_address = Column(String(50))
    device_info = Column(String(255))
    expires_at = Column(DateTime(timezone=True), nullable=False)

class LoginHistory(Base):
    __tablename__ = "login_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    login_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(50))
    device_info = Column(String(255))

# Auction Phase 2
class Subcategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String(100), nullable=False)

class AuctionTag(Base):
    __tablename__ = "auction_tags"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    tag = Column(String(50), nullable=False)

class AuctionHistory(Base):
    __tablename__ = "auction_history"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    status = Column(String(50))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

# Bidding Phase 2
class BidHistory(Base):
    __tablename__ = "bid_history"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    bid_amount = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50))

class AutoBid(Base):
    __tablename__ = "auto_bids"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    max_amount = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)

# Wallet & Escrow Phase 2
class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"
    id = Column(Integer, primary_key=True, index=True)
    escrow_id = Column(Integer, ForeignKey("escrow.id"))
    amount = Column(Float, nullable=False)
    action = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Deposit(Base):
    __tablename__ = "deposits"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float, nullable=False)
    gateway_id = Column(String(100))
    status = Column(String(50))

class Withdrawal(Base):
    __tablename__ = "withdrawals"
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    amount = Column(Float, nullable=False)
    bank_account_info = Column(String(255))
    status = Column(String(50))

# Payment Phase 2
class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    method_type = Column(String(50))
    details = Column(String(255))
    is_default = Column(Boolean, default=False)

class Refund(Base):
    __tablename__ = "refunds"
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    amount = Column(Float, nullable=False)
    reason = Column(String(255))
    status = Column(String(50))

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    total_amount = Column(Float, nullable=False)
    invoice_url = Column(String(500))
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class Commission(Base):
    __tablename__ = "commission"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    amount = Column(Float, nullable=False)
    status = Column(String(50))

# Shipping Phase 2
class Courier(Base):
    __tablename__ = "couriers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    tracking_url_template = Column(String(500))

class DeliveryStatus(Base):
    __tablename__ = "delivery_status"
    id = Column(Integer, primary_key=True, index=True)
    shipping_id = Column(Integer, ForeignKey("shipping.id"))
    status = Column(String(50))
    location = Column(String(200))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

# Reviews & Notifications Phase 2
class ReviewReply(Base):
    __tablename__ = "review_replies"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"))
    replier_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class NotificationSetting(Base):
    __tablename__ = "notification_settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email_alerts = Column(Boolean, default=True)
    sms_alerts = Column(Boolean, default=False)
    push_alerts = Column(Boolean, default=True)

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("support_tickets.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class FAQ(Base):
    __tablename__ = "faq"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)

# Admin & Logs Phase 2
class SellerApproval(Base):
    __tablename__ = "seller_approvals"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))
    status = Column(String(50))
    comments = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AuctionApproval(Base):
    __tablename__ = "auction_approvals"
    id = Column(Integer, primary_key=True, index=True)
    auction_id = Column(Integer, ForeignKey("auctions.id"))
    admin_id = Column(Integer, ForeignKey("admins.id"))
    status = Column(String(50))
    comments = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class UserReport(Base):
    __tablename__ = "user_reports"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reported_user_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="Pending")

class FraudLog(Base):
    __tablename__ = "fraud_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    activity_type = Column(String(100))
    risk_score = Column(Float)
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20))
    message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admins.id"))
    action = Column(String(255))
    target_table = Column(String(50))
    target_id = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
