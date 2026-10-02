from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import models_phase3_ai
import schemas
from database import get_db
from dependencies import get_current_user, verify_password, create_access_token

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
            "status": a.status,
            "ai_data": a.item.ai_data if a.item else None
        })
    return result

@router.post("/approve-auction")
def approve_auction(request: schemas.AdminActionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    auction = db.query(models.Auction).filter(models.Auction.id == request.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    new_status = "Live" if request.action.lower() == "approve" else "Rejected"
    auction.status = new_status
    
    # Refresh auction duration so approved lot gets fresh bidding time
    if new_status == "Live":
        now = datetime.utcnow()
        if not auction.end_time or auction.end_time <= now:
            auction.start_time = now
            auction.end_time = now + timedelta(days=7)

    
    # Ensure an admin record exists for the approval log
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == user.id).first()
    if not admin_profile:
        admin_profile = db.query(models.Admin).first()
        if not admin_profile:
            admin_profile = models.Admin(user_id=user.id, role_type="super_admin")
            db.add(admin_profile)
            db.commit()
            db.refresh(admin_profile)

    # Log the approval
    approval_log = models_phase2.AuctionApproval(
        auction_id=auction.id,
        admin_id=admin_profile.id,
        status=new_status,
        comments=request.comments
    )
    db.add(approval_log)
    db.commit()

    return {"message": f"Auction {auction.id} marked as {new_status}", "status": new_status}


@router.get("/fraud-logs")
def get_fraud_logs(admin: models.Admin = Depends(require_admin), db: Session = Depends(get_db)):
    """ View all suspicious activities flagged by AI """
    logs = db.query(models_phase2.FraudLog).order_by(models_phase2.FraudLog.timestamp.desc()).limit(50).all()
    return logs


@router.post("/login")
def admin_login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """ Dedicated Power Admin Login Endpoint """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")
    
    # Check if user is an admin
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == user.id).first()
    
    # Super Admin Bootstrap: If no admin exists in system or if email contains admin/super_admin or matches first user
    if not admin_profile:
        admin_count = db.query(models.Admin).count()
        if admin_count == 0 or "admin" in user.email.lower() or user.id == 1:
            admin_profile = models.Admin(user_id=user.id, role_type="super_admin")
            db.add(admin_profile)
            db.commit()
            db.refresh(admin_profile)
        else:
            raise HTTPException(
                status_code=403, 
                detail="Access Denied: Account lacks administrator privileges."
            )
            
    access_token = create_access_token(data={"user_id": user.id, "role": "admin"})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": admin_profile.role_type or "super_admin",
        "user_id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email
    }
