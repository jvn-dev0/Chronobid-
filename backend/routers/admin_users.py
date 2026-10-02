from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

def require_admin_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile:
        raise HTTPException(status_code=403, detail="Administrator privileges required")
    return admin_profile

class ChangeRoleRequest(BaseModel):
    new_role: str  # "bidder", "seller", "admin"

@router.get("/")
def get_all_users(admin: models.Admin = Depends(require_admin_user), db: Session = Depends(get_db)):
    """ Returns all registered users directly from Supabase PostgreSQL database """
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    result = []
    
    for u in users:
        admin_rec = db.query(models.Admin).filter(models.Admin.user_id == u.id).first()
        seller_rec = db.query(models.Seller).filter(models.Seller.user_id == u.id).first()
        
        role = "Bidder"
        if admin_rec:
            role = "Admin"
        elif seller_rec:
            role = "Seller"

        kyc_status = "Unverified"
        if admin_rec:
            kyc_status = "Verified"
        elif seller_rec:
            kyc_status = seller_rec.verification_status or "Pending"
        else:
            kyc_status = "Verified"

        reg_date = u.created_at.strftime("%Y-%m-%d") if u.created_at else "2026-01-01"

        result.append({
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "username": u.username,
            "email": u.email,
            "phone": u.phone or "N/A",
            "role": role,
            "status": "Active" if u.is_active else "Frozen",
            "verification_status": kyc_status,
            "created_at": reg_date
        })
        
    return result

@router.post("/{user_id}/toggle-status")
def toggle_user_status(user_id: int, admin: models.Admin = Depends(require_admin_user), db: Session = Depends(get_db)):
    """ Freezes or unfreezes a user account in database """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Toggle status
    user.is_active = not user.is_active
    db.commit()
    
    status_str = "Active" if user.is_active else "Frozen"
    return {"message": f"User #{user_id} account is now {status_str}", "status": status_str, "is_active": user.is_active}

@router.post("/{user_id}/change-role")
def change_user_role(user_id: int, req: ChangeRoleRequest, admin: models.Admin = Depends(require_admin_user), db: Session = Depends(get_db)):
    """ Updates user role in database (Bidder, Seller, Admin) """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    target_role = req.new_role.lower()
    
    if target_role == "admin":
        admin_rec = db.query(models.Admin).filter(models.Admin.user_id == user_id).first()
        if not admin_rec:
            admin_rec = models.Admin(user_id=user_id, role_type="ops_admin")
            db.add(admin_rec)
    elif target_role == "seller":
        seller_rec = db.query(models.Seller).filter(models.Seller.user_id == user_id).first()
        if not seller_rec:
            seller_rec = models.Seller(user_id=user_id, verification_status="Approved")
            db.add(seller_rec)
        else:
            seller_rec.verification_status = "Approved"
    elif target_role == "bidder":
        # Remove admin profile if converting back to bidder
        admin_rec = db.query(models.Admin).filter(models.Admin.user_id == user_id).first()
        if admin_rec and user_id != admin.user_id:  # Do not allow demoting self
            db.delete(admin_rec)

    db.commit()
    return {"message": f"User #{user_id} role updated to {target_role.capitalize()}", "new_role": target_role.capitalize()}
