from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import models_phase3_ai
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/auctions", tags=["Admin Auctions"])

def require_ops_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile or admin_profile.role_type not in ["super_admin", "ops_admin"]:
        raise HTTPException(status_code=403, detail="Operations Admin privileges required")
    return admin_profile

@router.get("/")
def get_all_auctions(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ Get all auctions for the moderation table """
    auctions = db.query(models.Auction).all()
    result = []
    for a in auctions:
        seller_name = "Unknown"
        if a.seller and a.seller.user:
            seller_name = a.seller.user.username
            
        category_name = "Unknown"
        if a.category:
            category_name = a.category.name
            
        result.append({
            "id": a.id,
            "title": a.title,
            "seller": seller_name,
            "category": category_name,
            "currentBid": a.current_highest_bid or 0,
            "status": a.status,
            "endTime": str(a.end_time) if a.end_time else "N/A"
        })
    return result

@router.get("/ai-reports")
def get_ai_verification_reports(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ Get AI Verification Reports (Identity and Object Detection) """
    identity_reports = db.query(models_phase3_ai.IdentityVerificationReport).all()
    item_reports = db.query(models_phase3_ai.AIVerificationReport).all()
    
    reports = []
    for ir in identity_reports:
        user = db.query(models.User).filter(models.User.id == ir.user_id).first()
        target = user.username if user else f"User {ir.user_id}"
        reports.append({
            "id": f"ID-{ir.id}",
            "type": "Identity",
            "target": target,
            "ocrConfidence": int(ir.ocr_confidence * 100) if ir.ocr_confidence else 0,
            "faceMatch": int(ir.face_match_score * 100) if ir.face_match_score else 0,
            "risk": "Low" if ir.is_approved else "High",
            "status": "Passed" if ir.is_approved else "Flagged",
            "date": "Recent"
        })
        
    for ar in item_reports:
        reports.append({
            "id": f"ITEM-{ar.id}",
            "type": "Object Detection",
            "target": f"Auction {ar.auction_id}",
            "ocrConfidence": int(ar.overall_confidence * 100) if ar.overall_confidence else 0,
            "faceMatch": 0,
            "risk": ar.risk_level or "Low",
            "status": "Passed" if ar.is_authentic else "Flagged",
            "date": "Recent"
        })
        
    return reports

@router.get("/fraud-alerts")
def get_fraud_alerts(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ Get AI Fraud Detection Logs """
    fraud_logs = db.query(models_phase3_ai.AIFraudDetectionLog).all()
    result = []
    for log in fraud_logs:
        risk_level = "Low"
        if log.risk_score:
            if log.risk_score > 0.8: risk_level = "Critical"
            elif log.risk_score > 0.5: risk_level = "High"
            elif log.risk_score > 0.3: risk_level = "Medium"
            
        result.append({
            "id": f"FRD-{log.id}",
            "user": f"{log.target_type} {log.target_id}",
            "type": "Fraud Alert",
            "risk": risk_level,
            "details": log.flagged_reason,
            "status": "Flagged",
            "date": str(log.timestamp) if log.timestamp else "N/A"
        })
    return result
