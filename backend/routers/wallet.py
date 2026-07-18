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

router = APIRouter(prefix="/api/wallet", tags=["Wallet & Payments"])

@router.get("/balance", response_model=schemas.WalletResponse)
def get_wallet_balance(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

@router.post("/deposit", response_model=schemas.WalletResponse)
def deposit_funds(request: schemas.DepositRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """ Mock endpoint for Razorpay/Stripe deposit simulation """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    # Simulate successful payment gateway charge
    wallet.balance += request.amount

    # Log transaction
    transaction = models_phase2.WalletTransaction(
        wallet_id=wallet.id,
        amount=request.amount,
        transaction_type="Deposit"
    )
    db.add(transaction)
    db.commit()
    db.refresh(wallet)

    return wallet

@router.post("/withdraw", response_model=schemas.WalletResponse)
def withdraw_funds(request: schemas.WithdrawRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")

    available_balance = wallet.balance - wallet.locked_balance
    if available_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient available funds")

    # Simulate processing payout
    wallet.balance -= request.amount

    transaction = models_phase2.WalletTransaction(
        wallet_id=wallet.id,
        amount=request.amount,
        transaction_type="Withdrawal"
    )
    db.add(transaction)
    db.commit()
    db.refresh(wallet)

    return wallet
