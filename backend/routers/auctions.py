from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List
import sys
import os
import httpx
import shutil
from datetime import datetime
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/auctions", tags=["Auctions"])

@router.post("/create", response_model=schemas.AuctionResponse)
async def create_auction(
    title: str = Form(...),
    category_id: int = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    reserve_price: float = Form(...),
    description: str = Form(...),
    condition: str = Form(None),
    material: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Verify the user is a seller
    seller_profile = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller_profile:
        raise HTTPException(status_code=403, detail="Only registered sellers can create auctions")

    # 1. Save the uploaded file locally
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'uploads'))
    os.makedirs(uploads_dir, exist_ok=True)
    file_location = os.path.join(uploads_dir, file.filename)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # 2. Call AI to verify the item
    try:
        with open(file_location, "rb") as f:
            # We assume AI service is running on 8001
            response = httpx.post("http://localhost:8001/verify", files={"file": (file.filename, f, file.content_type)})
            
        if response.status_code != 200:
            # Clean up and reject
            os.remove(file_location)
            raise HTTPException(status_code=400, detail="AI Verification failed. Please upload clearer images from multiple directions.")
            
        ai_data = response.json()
        
        if ai_data.get("category_confidence", 1.0) < 0.6:
            os.remove(file_location)
            raise HTTPException(status_code=400, detail="AI Verification confidence too low. Please upload clearer images from all directions.")

    except httpx.RequestError:
        # If AI is down, we might allow it but mark as pending, or reject. Let's reject for now to be safe.
        raise HTTPException(status_code=503, detail="AI Verification service is currently unavailable.")

    # Parse datetimes
    dt_start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    dt_end = datetime.fromisoformat(end_time.replace('Z', '+00:00'))

    # 3. Create the Auction Record
    new_auction = models.Auction(
        seller_id=seller_profile.id,
        category_id=category_id,
        title=title,
        start_time=dt_start,
        end_time=dt_end,
        reserve_price=reserve_price,
        status="Pending_Verification" # Mark Pending for admin review even if AI verified
    )
    db.add(new_auction)
    db.commit()
    db.refresh(new_auction)

    # 4. Create the Auction Item Record (The physical item details)
    new_item = models.AuctionItem(
        auction_id=new_auction.id,
        description=description,
        condition=condition,
        material=material or ai_data.get("predicted_material") # Optionally use AI prediction
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # 5. Create the Auction Image Record
    new_image = models.AuctionImage(
        item_id=new_item.id,
        image_url=f"/uploads/{file.filename}",
        is_primary=True
    )
    db.add(new_image)
    db.commit()
    
    # Attach AI data to response
    new_auction.ai_data = ai_data
    
    return new_auction

@router.get("/live", response_model=List[schemas.AuctionResponse])
def get_live_auctions(db: Session = Depends(get_db)):
    """ Get all active, live auctions for bidders to see """
    live_auctions = db.query(models.Auction).filter(models.Auction.status == "Live").all()
    return live_auctions

@router.get("/{auction_id}/details", response_model=schemas.AuctionDetailResponse)
def get_auction_details(auction_id: int, db: Session = Depends(get_db)):
    auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    seller = db.query(models.Seller).filter(models.Seller.id == auction.seller_id).first()
    user = db.query(models.User).filter(models.User.id == seller.user_id).first()
    seller_name = f"{user.first_name} {user.last_name}" if user else "Unknown Seller"

    # Get bids
    bids = db.query(models.Bid).filter(models.Bid.auction_id == auction_id).order_by(models.Bid.bid_amount.desc()).all()
    current_highest_bid = bids[0].bid_amount if bids else None

    bid_history = []
    for bid in bids:
        buyer = db.query(models.Buyer).filter(models.Buyer.id == bid.buyer_id).first()
        b_user = db.query(models.User).filter(models.User.id == buyer.user_id).first() if buyer else None
        b_name = b_user.first_name if b_user else "Bidder"
        masked_name = b_name[0] + "***" + b_name[-1] if len(b_name) > 2 else "B***r"
        
        bid_history.append({
            "id": bid.id,
            "bid_amount": bid.bid_amount,
            "timestamp": bid.timestamp,
            "buyer_name": masked_name
        })

    item = auction.item
    image_url = None
    if item and item.images:
        image_url = item.images[0].image_url

    # For AI Data fallback if missing attribute
    ai_data_res = None
    if hasattr(auction, 'ai_data'):
        ai_data_res = auction.ai_data

    return {
        "id": auction.id,
        "title": auction.title,
        "reserve_price": auction.reserve_price,
        "status": auction.status,
        "start_time": auction.start_time,
        "end_time": auction.end_time,
        "ai_data": ai_data_res,
        "description": item.description if item else None,
        "condition": item.condition if item else None,
        "material": item.material if item else None,
        "seller_name": seller_name,
        "current_highest_bid": current_highest_bid,
        "image_url": image_url,
        "bid_history": bid_history
    }

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
    buyer_transaction = models_phase2.WalletTransaction(
        wallet_id=winner_wallet.id,
        amount=-highest_bid.bid_amount,
        transaction_type="Auction Payment"
    )
    db.add(buyer_transaction)

    # Transfer to seller
    seller_wallet.balance += highest_bid.bid_amount
    seller_transaction = models_phase2.WalletTransaction(
        wallet_id=seller_wallet.id,
        amount=highest_bid.bid_amount,
        transaction_type="Auction Payout"
    )
    db.add(seller_transaction)

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
