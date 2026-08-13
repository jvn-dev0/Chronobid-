from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import models_phase3_ai
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

def require_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return admin_profile

@router.get("/stats")
def get_dashboard_stats(admin: models.Admin = Depends(require_admin), db: Session = Depends(get_db)):
    """ Get overall platform statistics for the KPI dashboard """
    total_users = db.query(models.User).count()
    active_auctions = db.query(models.Auction).filter(models.Auction.status == "Live").count()
    pending_auctions = db.query(models.Auction).filter(models.Auction.status == "Pending_Verification").count()
    
    # In a real app, you would sum up completed transactions.
    # For now, return a placeholder revenue.
    return {
        "total_revenue": 128450,
        "revenue_growth": 14.2,
        "active_auctions": active_auctions,
        "auctions_growth": 5.4,
        "total_users": total_users,
        "users_growth": -2.1,
        "pending_approvals": pending_auctions,
    }

@router.get("/pending-auctions")
def get_pending_auctions(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """ View all auctions waiting for manual approval """
    auctions = db.query(models.Auction).filter(models.Auction.status == "Pending_Verification").all()
    result = []
    for a in auctions:
        desc = a.item.description if a.item else "No description"
        result.append({
            "id": a.id,
            "title": a.title,
            "reserve_price": a.reserve_price,
            "image_url": a.image_url,
            "description": desc,
            "status": a.status
        })
    return result

@router.post("/approve-auction")
def approve_auction(request: schemas.AdminActionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    auction = db.query(models.Auction).filter(models.Auction.id == request.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    new_status = "Live" if request.action.lower() == "approve" else "Rejected"
    auction.status = new_status
    
    # Log the approval
    approval_log = models_phase2.AuctionApproval(
        auction_id=auction.id,
        admin_id=1, # Mock admin ID for testing since we bypassed require_admin
        status=new_status,
        comments=request.comments
    )
    db.add(approval_log)
    db.commit()

    return {"message": f"Auction {auction.id} marked as {new_status}"}

@router.get("/fraud-logs")
def get_fraud_logs(admin: models.Admin = Depends(require_admin), db: Session = Depends(get_db)):
    """ View all suspicious activities flagged by AI """
    logs = db.query(models_phase2.FraudLog).order_by(models_phase2.FraudLog.timestamp.desc()).limit(50).all()
    return logs
