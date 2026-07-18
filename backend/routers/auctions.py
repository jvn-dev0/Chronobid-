from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
import httpx
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/auctions", tags=["Auctions"])

@router.post("/create", response_model=schemas.AuctionResponse)
async def create_auction(
    auction_data: schemas.AuctionCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Verify the user is a seller
    seller_profile = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=403, detail="Only registered sellers can create auctions")

    # 1. Create the Auction Record
    new_auction = models.Auction(
        seller_id=seller_profile.id,
        category_id=auction_data.category_id,
        title=auction_data.title,
        start_time=auction_data.start_time,
        end_time=auction_data.end_time,
        reserve_price=auction_data.reserve_price,
        status="Pending_Verification" # Starts pending until AI Jasper verifies it
    )
    db.add(new_auction)
    db.commit()
    db.refresh(new_auction)

    # 2. Create the Auction Item Record (The physical item details)
    new_item = models.AuctionItem(
        auction_id=new_auction.id,
        description=auction_data.description,
        condition=auction_data.condition,
        material=auction_data.material
    )
    db.add(new_item)
    db.commit()

    # 3. Call Jasper to verify the item (Simulation)
    # In a real flow, Jasper would be called here via httpx to verify the item image
    # For now, we assume Jasper will eventually approve it and change status to 'Live'
    
    return new_auction

@router.get("/live", response_model=List[schemas.AuctionResponse])
def get_live_auctions(db: Session = Depends(get_db)):
    """ Get all active, live auctions for bidders to see """
    live_auctions = db.query(models.Auction).filter(models.Auction.status == "Live").all()
    return live_auctions
