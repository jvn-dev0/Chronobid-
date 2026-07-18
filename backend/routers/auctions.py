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
@router.get("/my-auctions", response_model=List[schemas.AuctionResponse])
def get_my_auctions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """ Get all auctions listed by the logged-in seller """
    seller_profile = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=403, detail="Only sellers have auctions")

    my_auctions = db.query(models.Auction).filter(models.Auction.seller_id == seller_profile.id).all()
    return my_auctions

@router.post("/{auction_id}/finalize", response_model=schemas.FinalizeResponse)
def finalize_auction(auction_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """ Process the end of an auction: transfer escrow, create order, release losers """
    
    auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    # In reality, this endpoint should only be callable by system/admin or if current time > end_time
    if auction.status not in ["Live"]:
        raise HTTPException(status_code=400, detail="Auction cannot be finalized (it is not Live)")

    # Find highest bid
    highest_bid = db.query(models.Bid).filter(models.Bid.auction_id == auction.id).order_by(models.Bid.bid_amount.desc()).first()

    if not highest_bid:
        auction.status = "Unsold"
        db.commit()
        return {"message": "Auction ended without any bids.", "auction_status": "Unsold"}

    auction.status = "Sold"

    # Process Winning Bid
    winner_wallet = db.query(models.Wallet).join(models.User, models.Wallet.user_id == models.User.id).join(models.Buyer, models.User.id == models.Buyer.user_id).filter(models.Buyer.id == highest_bid.buyer_id).first()
    seller_wallet = db.query(models.Wallet).join(models.User, models.Wallet.user_id == models.User.id).join(models.Seller, models.User.id == models.Seller.user_id).filter(models.Seller.id == auction.seller_id).first()

    if not winner_wallet or not seller_wallet:
        raise HTTPException(status_code=500, detail="Wallet mismatch during finalization")

    # The winner's money is currently in locked_balance. We subtract it fully.
    winner_wallet.balance -= highest_bid.bid_amount
    winner_wallet.locked_balance -= highest_bid.bid_amount

    # Transfer to seller
    seller_wallet.balance += highest_bid.bid_amount

    # Create Order
    new_order = models.Order(
        auction_id=auction.id,
        buyer_id=highest_bid.buyer_id,
        amount=highest_bid.bid_amount,
        status="Pending_Shipping"
    )
    db.add(new_order)

    # Release losing bids from Escrow
    losing_bids = db.query(models.Bid).filter(models.Bid.auction_id == auction.id, models.Bid.id != highest_bid.id).all()
    for losing_bid in losing_bids:
        loser_wallet = db.query(models.Wallet).join(models.User, models.Wallet.user_id == models.User.id).join(models.Buyer, models.User.id == models.Buyer.user_id).filter(models.Buyer.id == losing_bid.buyer_id).first()
        if loser_wallet:
            # We don't subtract from balance, just unlock the funds so they can withdraw them
            loser_wallet.locked_balance -= losing_bid.bid_amount

    db.commit()

    return {
        "message": "Auction finalized successfully",
        "auction_status": "Sold",
        "winning_bid": highest_bid.bid_amount,
        "order_id": new_order.id
    }
