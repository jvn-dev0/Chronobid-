from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
import sys
import os
import jwt
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
from database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "chronobid_super_secret_jwt_key_2024")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(prefix="/api/notifications", tags=["Notifications Engine"])

@router.get("")
def get_user_notifications(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """ Fetch notifications for logged-in user or fallback to recent bid notifications """
    target_user_id = 1 # Default to main bidder user

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            target_user_id = payload.get("user_id", 1)
        except Exception:
            pass

    # 1. Fetch from notifications table
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == target_user_id
    ).order_by(models.Notification.timestamp.desc()).all()

    # 2. Also check placed bids for this user
    buyer = db.query(models.Buyer).filter(models.Buyer.user_id == target_user_id).first()
    buyer_id = buyer.id if buyer else target_user_id

    bids = db.query(models.Bid).filter(
        models.Bid.buyer_id == buyer_id
    ).order_by(models.Bid.timestamp.desc()).all()

    result = []
    seen_messages = set()

    # Process notification table records
    for n in notifs:
        msg = n.message or ""
        if msg in seen_messages:
            continue
        seen_messages.add(msg)

        ntype = "info"
        action = None
        title = "Account Alert"

        if "outbid" in msg.lower():
            ntype = "warning"
            title = "You've Been Outbid!"
            action = "Increase Bid"
        elif "bid placed" in msg.lower() or "bid of" in msg.lower():
            ntype = "success"
            title = "Bid Placed Successfully"
            action = "Go to Wallet"
        elif "won" in msg.lower():
            ntype = "success"
            title = "Auction Won!"
            action = "Go to Wallet"

        time_str = "Just now"
        if n.timestamp:
            diff = datetime.now() - n.timestamp.replace(tzinfo=None)
            minutes = int(diff.total_seconds() / 60)
            if minutes < 1:
                time_str = "Just now"
            elif minutes < 60:
                time_str = f"{minutes} min ago"
            elif minutes < 1440:
                time_str = f"{int(minutes / 60)} hours ago"
            else:
                time_str = f"{int(minutes / 1440)} days ago"

        result.append({
            "id": n.id,
            "type": ntype,
            "title": title,
            "desc": msg,
            "time": time_str,
            "unread": not n.is_read,
            "action": action,
            "link": "/bidder/wallet" if ntype == "success" else "/bidder/live"
        })

    # Process bids table records if not already in notification table
    for b in bids:
        auction = db.query(models.Auction).filter(models.Auction.id == b.auction_id).first()
        auction_title = auction.title if auction else "Vintage Watch"
        bid_msg = f"Bid Placed: Your bid of ${b.bid_amount:,.2f} on '{auction_title}' was confirmed. ${b.bid_amount:,.2f} is reserved in escrow."
        
        if bid_msg in seen_messages:
            continue
        seen_messages.add(bid_msg)

        time_str = "Just now"
        if b.timestamp:
            diff = datetime.now() - b.timestamp.replace(tzinfo=None)
            minutes = int(diff.total_seconds() / 60)
            if minutes < 1:
                time_str = "Just now"
            elif minutes < 60:
                time_str = f"{minutes} min ago"
            elif minutes < 1440:
                time_str = f"{int(minutes / 60)} hours ago"
            else:
                time_str = f"{int(minutes / 1440)} days ago"

        result.append({
            "id": 1000 + b.id,
            "type": "success",
            "title": "Bid Placed Successfully",
            "desc": bid_msg,
            "time": time_str,
            "unread": True,
            "action": "Go to Wallet",
            "link": "/bidder/wallet"
        })

    # 3. Always insert a Jasper AI recommendation notification for bidder
    jasper_rec_notif = {
        "id": 9999,
        "type": "info",
        "title": "✨ Jasper AI: Personal Recommendation Digest",
        "desc": "Jasper has analyzed your personal Vault activity and live Market Trends. 4 curated auction lots are waiting for you!",
        "time": "Just now",
        "unread": True,
        "action": "View Recommendations",
        "link": "/bidder/dashboard"
    }
    result.insert(0, jasper_rec_notif)

    return result

