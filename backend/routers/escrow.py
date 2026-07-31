from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import schemas
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/escrow", tags=["Escrow"])

@router.get("/bidder", response_model=List[schemas.EscrowResponse])
def get_bidder_escrows(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all escrow locks for the current bidder."""
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    escrows = db.query(models.Escrow).filter(models.Escrow.wallet_id == wallet.id).all()
    
    result = []
    for e in escrows:
        auction = db.query(models.Auction).filter(models.Auction.id == e.auction_id).first()
        seller = db.query(models.Seller).filter(models.Seller.id == auction.seller_id).first() if auction else None
        seller_user = db.query(models.User).filter(models.User.id == seller.user_id).first() if seller else None
        
        result.append({
            "id": e.id,
            "auction_id": e.auction_id,
            "locked_amount": e.locked_amount,
            "status": e.status,
            "auction_title": auction.title if auction else "Unknown",
            "seller_name": f"{seller_user.first_name} {seller_user.last_name}" if seller_user else "Unknown Seller",
            "buyer_name": f"{current_user.first_name} {current_user.last_name}"
        })
    return result

@router.get("/seller", response_model=List[schemas.EscrowResponse])
def get_seller_escrows(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all escrow funds pending for the current seller."""
    seller = db.query(models.Seller).filter(models.Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="User is not a seller")

    auctions = db.query(models.Auction).filter(models.Auction.seller_id == seller.id).all()
    auction_ids = [a.id for a in auctions]

    escrows = db.query(models.Escrow).filter(models.Escrow.auction_id.in_(auction_ids)).all()
    
    result = []
    for e in escrows:
        auction = next((a for a in auctions if a.id == e.auction_id), None)
        buyer_wallet = db.query(models.Wallet).filter(models.Wallet.id == e.wallet_id).first()
        buyer_user = db.query(models.User).filter(models.User.id == buyer_wallet.user_id).first() if buyer_wallet else None
        
        result.append({
            "id": e.id,
            "auction_id": e.auction_id,
            "locked_amount": e.locked_amount,
            "status": e.status,
            "auction_title": auction.title if auction else "Unknown",
            "seller_name": f"{current_user.first_name} {current_user.last_name}",
            "buyer_name": f"{buyer_user.first_name} {buyer_user.last_name}" if buyer_user else "Unknown Buyer"
        })
    return result

@router.post("/release/{escrow_id}")
def release_funds(escrow_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Called by the buyer to release funds to the seller."""
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    escrow = db.query(models.Escrow).filter(models.Escrow.id == escrow_id, models.Escrow.wallet_id == wallet.id).first()
    if not escrow:
        raise HTTPException(status_code=404, detail="Escrow not found or unauthorized")
    
    if escrow.status != "Locked":
        raise HTTPException(status_code=400, detail=f"Escrow is already {escrow.status}")

    # Find the Seller's wallet
    auction = db.query(models.Auction).filter(models.Auction.id == escrow.auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
        
    seller = db.query(models.Seller).filter(models.Seller.id == auction.seller_id).first()
    seller_wallet = db.query(models.Wallet).filter(models.Wallet.user_id == seller.user_id).first()
    
    if not seller_wallet:
        raise HTTPException(status_code=500, detail="Seller does not have a wallet")

    # Release Funds Logic
    # 1. Deduct from buyer's locked balance
    wallet.locked_balance -= escrow.locked_amount
    # 2. Add to seller's available balance
    seller_wallet.balance += escrow.locked_amount
    # 3. Mark escrow as released
    escrow.status = "Released"

    # Transaction Logs
    # Buyer's Wallet Transaction
    t_buyer = models_phase2.WalletTransaction(
        wallet_id=wallet.id,
        amount=-escrow.locked_amount,
        transaction_type="Escrow Release"
    )
    # Seller's Wallet Transaction
    t_seller = models_phase2.WalletTransaction(
        wallet_id=seller_wallet.id,
        amount=escrow.locked_amount,
        transaction_type="Escrow Received"
    )
    # Escrow Transaction
    e_trans = models_phase2.EscrowTransaction(
        escrow_id=escrow.id,
        amount=escrow.locked_amount,
        action="Released"
    )
    
    db.add(t_buyer)
    db.add(t_seller)
    db.add(e_trans)
    db.commit()

    return {"message": "Funds successfully released to the seller."}
