from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/shipping", tags=["Shipping & Delivery"])

@router.get("/{order_id}", response_model=schemas.ShippingResponse)
def get_shipping_status(order_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Basic check to see if order exists
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # In production, check if current_user is the buyer or seller of this order

    shipping = db.query(models.Shipping).filter(models.Shipping.order_id == order_id).first()
    if not shipping:
        raise HTTPException(status_code=404, detail="Shipping details not generated yet")

    return shipping

@router.post("/update", response_model=schemas.ShippingResponse)
def update_shipping_info(request: schemas.ShippingUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Verify user is a seller
    seller_profile = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=403, detail="Only sellers can update shipping")

    order = db.query(models.Order).filter(models.Order.id == request.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipping = db.query(models.Shipping).filter(models.Shipping.order_id == request.order_id).first()
    if not shipping:
        # Create it if it doesn't exist
        shipping = models.Shipping(order_id=request.order_id, shipping_status="Shipped")
        db.add(shipping)

    shipping.courier_name = request.courier_name
    shipping.tracking_number = request.tracking_number
    shipping.shipping_status = "Shipped"
    order.status = "Shipped"
    
    db.commit()
    db.refresh(shipping)

    return shipping
