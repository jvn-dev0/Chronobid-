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
    # Serialize properly
    return [
        {
            "id": a.id,
            "title": a.title,
            "status": a.status,
            "current_bid": len(a.bids), # Placeholder logic
            "category_id": a.category_id
        }
        for a in auctions
    ]

@router.get("/ai-reports")
def get_ai_verification_reports(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ Get AI Verification Reports (Identity and Object Detection) """
    identity_reports = db.query(models_phase3_ai.IdentityVerificationReport).all()
    item_reports = db.query(models_phase3_ai.AIVerificationReport).all()
    return {
        "identity_reports": identity_reports,
        "item_reports": item_reports
    }

@router.get("/fraud-alerts")
def get_fraud_alerts(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ Get AI Fraud Detection Logs """
    fraud_logs = db.query(models_phase3_ai.AIFraudDetectionLog).all()
    return fraud_logs
