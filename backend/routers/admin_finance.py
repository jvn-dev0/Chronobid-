from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/finance", tags=["Admin Finance"])

def require_finance_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile or admin_profile.role_type not in ["super_admin", "finance_admin"]:
        raise HTTPException(status_code=403, detail="Finance Admin privileges required")
    return admin_profile

@router.get("/transactions")
def get_transactions(admin: models.Admin = Depends(require_finance_admin), db: Session = Depends(get_db)):
    """ Get all platform transactions (Deposits, Withdrawals, Escrow Locks) """
    transactions = db.query(models.Transaction).all()
    # Serialize properly
    return [
        {
            "id": t.id,
            "wallet_id": t.wallet_id,
            "type": t.type,
            "amount": t.amount,
            "status": t.status,
            "timestamp": t.timestamp
        }
        for t in transactions
    ]

@router.post("/withdrawals/{transaction_id}/approve")
def approve_withdrawal(transaction_id: int, admin: models.Admin = Depends(require_finance_admin), db: Session = Depends(get_db)):
    """ Approve a large withdrawal manually """
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.type == "withdrawal").first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Withdrawal request not found")
    
    transaction.status = "completed"
    db.commit()
    return {"message": "Withdrawal approved successfully"}
