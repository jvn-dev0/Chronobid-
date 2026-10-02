from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
from database import get_db
from dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin/settings", tags=["Admin Settings"])

def require_super_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile or admin_profile.role_type != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin privileges required")
    return admin_profile

class ConfigUpdate(BaseModel):
    seller_commission_fee: float
    buyer_premium_fee: float
    listing_fee: float
    auto_approve_ocr: int
    auto_reject_face: int

@router.get("/")
def get_config(admin: models.Admin = Depends(require_super_admin), db: Session = Depends(get_db)):
    config = db.query(models.SystemConfig).first()
    if not config:
        config = models.SystemConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.post("/")
def update_config(settings: ConfigUpdate, admin: models.Admin = Depends(require_super_admin), db: Session = Depends(get_db)):
    config = db.query(models.SystemConfig).first()
    if not config:
        config = models.SystemConfig()
        db.add(config)
    
    config.seller_commission_fee = settings.seller_commission_fee
    config.buyer_premium_fee = settings.buyer_premium_fee
    config.listing_fee = settings.listing_fee
    config.auto_approve_ocr = settings.auto_approve_ocr
    config.auto_reject_face = settings.auto_reject_face
    
    db.commit()
    return {"message": "Settings updated successfully"}
