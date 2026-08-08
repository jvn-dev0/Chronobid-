from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

def require_ops_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile or admin_profile.role_type not in ["super_admin", "ops_admin"]:
        raise HTTPException(status_code=403, detail="Operations Admin privileges required")
    return admin_profile

def require_super_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile or admin_profile.role_type != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin privileges required")
    return admin_profile

@router.get("/")
def get_all_users(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ List all registered users (buyers and sellers) """
    users = db.query(models.User).all()
    # Join with Seller/Admin profiles if needed to determine role, or just return basic info
    result = []
    for u in users:
        role = "Buyer"
        if u.seller_profile:
            role = "Seller"
        if u.admin_profile:
            role = f"Admin ({u.admin_profile.role_type})"
            
        result.append({
            "id": u.id, 
            "name": u.username,
            "email": u.email, 
            "role": role, 
            "status": "Active" if u.is_active else "Suspended",
            "joinDate": "2024-01-01" # Placeholder date, since created_at might not exist in models.py
        })
    return result

@router.post("/{user_id}/suspend")
def suspend_user(user_id: int, admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    
    # Log the action
    audit_log = models_phase2.AuditLog(
        admin_id=admin.id,
        action="SUSPEND_USER",
        target_table="users",
        target_id=user.id
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": f"User {user_id} suspended successfully"}

@router.get("/applications")
def get_seller_applications(admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    """ List all pending seller applications """
    sellers = db.query(models.Seller).filter(models.Seller.verification_status.in_(["Pending", "Pending_Review"])).all()
    
    result = []
    for s in sellers:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        result.append({
            "id": s.id,
            "shopName": s.shop_name,
            "applicant": user.username if user else "Unknown",
            "email": user.email if user else "Unknown",
            "status": s.verification_status,
            "submissionDate": "2024-01-01",
            "aiConfidence": 94,
            "documentUrl": s.id_document_url
        })
    return result

@router.post("/applications/{seller_id}/approve")
def approve_seller(seller_id: int, admin: models.Admin = Depends(require_ops_admin), db: Session = Depends(get_db)):
    seller = db.query(models.Seller).filter(models.Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller application not found")
        
    seller.verification_status = "Approved"
    
    user = db.query(models.User).filter(models.User.id == seller.user_id).first()
    if user:
        # Assign Seller role
        user_role = db.query(models.UserRole).filter(models.UserRole.name == "seller").first()
        if user_role:
            user.role_id = user_role.id
            
    db.commit()
    return {"message": f"Seller {seller_id} approved successfully"}
