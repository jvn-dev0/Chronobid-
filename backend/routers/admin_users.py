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
    # In a real app, you'd serialize this properly and avoid sending password_hash
    return [{"id": u.id, "email": u.email, "username": u.username, "is_active": u.is_active} for u in users]

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
