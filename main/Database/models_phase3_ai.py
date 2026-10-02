from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base

# Phase 3: AI Tables
class AIVerificationReport(Base):
    __tablename__ = "ai_verification_reports"
    id = Column(Integer, primary_key=True, index=True)
    auction_item_id = Column(Integer, ForeignKey("auction_items.id"))
    authenticity_score = Column(Float)
    ai_confidence = Column(Float)
    museum_matches = Column(JSON) # Stores list of matched museum URLs
    report_details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class IdentityVerificationReport(Base):
    __tablename__ = "identity_verification_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ocr_confidence = Column(Float)
    face_match_confidence = Column(Float)
    liveness_score = Column(Float)
    duplicate_risk_score = Column(Float)
    status = Column(String(50)) # Pass, Fail, Manual_Review
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class RecommendationLog(Base):
    __tablename__ = "recommendation_log"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyers.id"))
    recommended_auction_id = Column(Integer, ForeignKey("auctions.id"))
    match_score = Column(Float)
    interaction = Column(String(50)) # Viewed, Bid, Ignored
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class ImageEmbedding(Base):
    __tablename__ = "image_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("auction_images.id"))
    vector_data = Column(Text) # Depending on DB support, might use pgvector, but Text/JSON works for basic storage
    model_version = Column(String(50))

class PricePrediction(Base):
    __tablename__ = "price_predictions"
    id = Column(Integer, primary_key=True, index=True)
    auction_item_id = Column(Integer, ForeignKey("auction_items.id"))
    predicted_min = Column(Float)
    predicted_max = Column(Float)
    confidence_score = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AIFraudDetectionLog(Base):
    __tablename__ = "ai_fraud_detection_logs"
    id = Column(Integer, primary_key=True, index=True)
    target_type = Column(String(50)) # User, Bid, Auction
    target_id = Column(Integer)
    risk_score = Column(Float)
    flagged_reason = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
