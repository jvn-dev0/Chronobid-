from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/bids", tags=["Bidding Engine"])

@router.post("/place", response_model=schemas.BidResponse)
def place_bid(
    bid_data: schemas.BidPlace, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Verify the user is a buyer
    buyer_profile = db.query(models.Buyer).filter(models.Buyer.user_id == current_user.id).first()
    if not buyer_profile:
        raise HTTPException(status_code=403, detail="Only registered buyers can place bids")

    # Verify auction exists and is Live
    auction = db.query(models.Auction).filter(models.Auction.id == bid_data.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    if auction.status != "Live":
        raise HTTPException(status_code=400, detail="This auction is not currently accepting bids")

    # Check if the bid is higher than the reserve price or current highest bid
    highest_bid = db.query(models.Bid).filter(models.Bid.auction_id == auction.id).order_by(models.Bid.bid_amount.desc()).first()
    min_required_bid = highest_bid.bid_amount if highest_bid else auction.reserve_price
    
    if bid_data.bid_amount <= min_required_bid:
        raise HTTPException(status_code=400, detail=f"Bid must be higher than current highest bid or reserve price (${min_required_bid})")

    # Check Wallet Balance to ensure they can afford it
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet or (wallet.balance - wallet.locked_balance) < bid_data.bid_amount:
        raise HTTPException(status_code=400, detail="Insufficient available funds in wallet")

    # Lock the funds in Escrow (Security feature)
    wallet.locked_balance += bid_data.bid_amount
    
    new_bid = models.Bid(
        auction_id=auction.id,
        buyer_id=buyer_profile.id,
        bid_amount=bid_data.bid_amount
    )
    db.add(new_bid)

    # Log in Bid History (Phase 2 table)
    bid_history = models.BidHistory(
        auction_id=auction.id,
        buyer_id=buyer_profile.id,
        bid_amount=bid_data.bid_amount,
        status="Valid"
    )
    db.add(bid_history)

    # Create Notification for Bidder
    bid_notif = models.Notification(
        user_id=current_user.id,
        message=f"Bid Placed: Your bid of ${bid_data.bid_amount:,.2f} on '{auction.title}' was confirmed. ${bid_data.bid_amount:,.2f} is reserved in escrow.",
        is_read=False
    )
    db.add(bid_notif)

    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.get("/my-bids")
def get_my_bids(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """ Get all bids placed by the logged-in buyer """
    buyer_profile = db.query(models.Buyer).filter(models.Buyer.user_id == current_user.id).first()
    buyer_id = buyer_profile.id if buyer_profile else current_user.id

    my_bids = db.query(models.Bid).filter(models.Bid.buyer_id == buyer_id).order_by(models.Bid.timestamp.desc()).all()
    
    result = []
    for b in my_bids:
        auction = db.query(models.Auction).filter(models.Auction.id == b.auction_id).first()
        highest_bid_rec = db.query(models.Bid).filter(models.Bid.auction_id == b.auction_id).order_by(models.Bid.bid_amount.desc()).first()
        highest_val = highest_bid_rec.bid_amount if highest_bid_rec else (auction.reserve_price if auction else b.bid_amount)
        
        seller_name = "ChronoBid Verified Seller"
        if auction:
            seller = db.query(models.Seller).filter(models.Seller.id == auction.seller_id).first()
            if seller:
                seller_user = db.query(models.User).filter(models.User.id == seller.user_id).first()
                if seller_user:
                    seller_name = f"{seller_user.first_name} {seller_user.last_name}".strip()

        date_str = b.timestamp.strftime("%b %d, %Y") if b.timestamp else "Oct 1, 2026"
        is_winning = (highest_bid_rec and highest_bid_rec.buyer_id == buyer_id)
        
        result.append({
            "id": b.id,
            "auction_id": b.auction_id,
            "title": auction.title if auction else "Vintage Watch",
            "seller_name": seller_name,
            "my_bid": b.bid_amount,
            "highest_bid": highest_val,
            "date": date_str,
            "status": "Winning" if is_winning else "Outbid",
            "image_url": auction.image_url if (auction and auction.image_url) else "/uploads/download (3).jpg"
        })
        
    return result

