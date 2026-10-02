from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import models_phase2
import models_phase3_ai
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/api/admin/auctions", tags=["Admin Auctions"])

def require_admin(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin_profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    if not admin_profile:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return admin_profile

@router.get("/manage")
def list_managed_auctions(
    status_filter: str = "All",
    search: str = None,
    category_id: int = None,
    admin: models.Admin = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns full database-driven auction list and KPIs for Power Admin Auctions page.
    Filters: status_filter (All, Live, Ending_Soon, Draft, Completed, Cancelled), search, category_id
    """
    query = db.query(models.Auction)
    
    now = datetime.utcnow()
    
    if status_filter == "Live":
        query = query.filter(models.Auction.status == "Live")
    elif status_filter == "Ending_Soon":
        query = query.filter(models.Auction.status == "Live", models.Auction.end_time <= now + timedelta(days=1))
    elif status_filter == "Draft":
        query = query.filter(models.Auction.status.in_(["Draft", "Pending_Verification"]))
    elif status_filter == "Completed":
        query = query.filter(models.Auction.status == "Completed")
    elif status_filter == "Cancelled":
        query = query.filter(models.Auction.status == "Cancelled")
        
    if category_id:
        query = query.filter(models.Auction.category_id == category_id)

    auctions_raw = query.order_by(models.Auction.id.desc()).all()
    
    # KPIs across whole database
    total_auctions = db.query(models.Auction).count()
    active_auctions = db.query(models.Auction).filter(models.Auction.status == "Live").count()
    ending_today = db.query(models.Auction).filter(
        models.Auction.status == "Live",
        models.Auction.end_time <= now + timedelta(days=1)
    ).count()
    
    bids_all = db.query(models.Bid).all()
    total_volume = sum(b.bid_amount for b in bids_all) if bids_all else 0.0

    items_list = []
    for a in auctions_raw:
        # Filter search query
        seller_name = "Unknown Seller"
        if a.seller and a.seller.user:
            seller_name = f"{a.seller.user.first_name} {a.seller.user.last_name}".strip() or a.seller.user.username
            
        if search:
            s_lower = search.lower()
            if s_lower not in a.title.lower() and s_lower not in seller_name.lower() and str(a.id) != s_lower:
                continue

        # Category Name
        cat = a.category if getattr(a, 'category', None) else (db.query(models.Category).filter(models.Category.id == a.category_id).first() if a.category_id else None)
        category_name = cat.name if cat else "Uncategorized"

        # Bids & Current Highest
        bids_query = db.query(models.Bid).filter(models.Bid.auction_id == a.id).order_by(models.Bid.bid_amount.desc()).all()
        bids_count = len(bids_query)
        highest_bid = bids_query[0].bid_amount if bids_query else None

        # End Time String
        end_time_str = "N/A"
        if a.end_time:
            end_dt = a.end_time.replace(tzinfo=None) if hasattr(a.end_time, 'tzinfo') and a.end_time.tzinfo is not None else a.end_time
            if a.status == "Live":
                diff = end_dt - now
                if diff.total_seconds() > 0:
                    hours = int(diff.total_seconds() // 3600)
                    mins = int((diff.total_seconds() % 3600) // 60)
                    end_time_str = f"{hours}h {mins}m remaining"
                else:
                    end_time_str = "Ended"
            else:
                end_time_str = end_dt.strftime("%b %d, %Y")

        # Image URL
        image_url = a.image_url or "/uploads/download (3).jpg"

        items_list.append({
            "id": a.id,
            "title": a.title,
            "seller": seller_name,
            "seller_id": a.seller_id,
            "category": category_name,
            "reserve_price": a.reserve_price,
            "current_highest_bid": highest_bid,
            "bids_count": bids_count,
            "status": a.status,
            "start_time": a.start_time.strftime("%b %d, %Y") if a.start_time else "N/A",
            "end_time": end_time_str,
            "image_url": image_url
        })

    return {
        "kpis": {
            "total_auctions": total_auctions,
            "active_auctions": active_auctions,
            "ending_today": ending_today,
            "total_volume": total_volume
        },
        "auctions": items_list
    }

@router.get("/{auction_id}/inspect")
def inspect_auction_details(
    auction_id: int,
    admin: models.Admin = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """ Inspect full details, real bid history, and reserve progress of an auction """
    auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    seller_info = None
    if auction.seller:
        s = auction.seller
        seller_info = {
            "id": s.id,
            "name": f"{s.user.first_name} {s.user.last_name}".strip() if s.user else "Unknown",
            "username": s.user.username if s.user else "unknown",
            "email": s.user.email if s.user else "N/A",
            "verification_status": s.verification_status,
            "trust_score": s.trust_score
        }

    bids_query = db.query(models.Bid).filter(models.Bid.auction_id == auction.id).order_by(models.Bid.bid_amount.desc()).all()
    bid_history = []
    for b in bids_query:
        buyer_user = None
        if b.buyer and b.buyer.user:
            buyer_user = b.buyer.user
        bid_history.append({
            "id": b.id,
            "bidder_name": f"{buyer_user.first_name} {buyer_user.last_name}".strip() if buyer_user else f"Bidder #{b.buyer_id}",
            "username": buyer_user.username if buyer_user else "unknown",
            "amount": b.bid_amount,
            "timestamp": b.timestamp.strftime("%b %d, %Y %H:%M:%S") if b.timestamp else "N/A"
        })

    highest_bid = bids_query[0].bid_amount if bids_query else 0.0

    return {
        "id": auction.id,
        "title": auction.title,
        "reserve_price": auction.reserve_price,
        "highest_bid": highest_bid,
        "status": auction.status,
        "category": auction.category.name if getattr(auction, 'category', None) else "Uncategorized",
        "start_time": auction.start_time.strftime("%b %d, %Y %H:%M") if auction.start_time else "N/A",
        "end_time": auction.end_time.strftime("%b %d, %Y %H:%M") if auction.end_time else "N/A",
        "seller": seller_info,
        "bids": bid_history,
        "image_url": auction.image_url or "/uploads/download (3).jpg"
    }

@router.post("/{auction_id}/control")
def emergency_auction_control(
    auction_id: int,
    action: str, # "extend", "pause", "resume", "cancel"
    days: int = 1,
    admin: models.Admin = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """ Perform emergency admin controls on an auction """
    auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    action_lower = action.lower()
    if action_lower == "extend":
        now = datetime.utcnow()
        current_end = auction.end_time if auction.end_time and auction.end_time > now else now
        auction.end_time = current_end + timedelta(days=days)
        msg = f"Auction #{auction.id} end time extended by +{days} day(s)."
    elif action_lower == "pause":
        auction.status = "Paused"
        msg = f"Auction #{auction.id} has been Paused."
    elif action_lower == "resume":
        auction.status = "Live"
        msg = f"Auction #{auction.id} has been Resumed to Live status."
    elif action_lower == "cancel":
        auction.status = "Cancelled"
        msg = f"Auction #{auction.id} has been Cancelled by Administrator."
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

    db.commit()
    return {"message": msg, "status": auction.status, "end_time": str(auction.end_time)}

@router.get("/ai-reports")
def get_ai_verification_reports(admin: models.Admin = Depends(require_admin), db: Session = Depends(get_db)):
    """ Get AI Verification Reports (Identity and Object Detection) with KPIs from DB """
    identity_reports = db.query(models_phase3_ai.IdentityVerificationReport).all()
    item_reports = db.query(models_phase3_ai.AIVerificationReport).all()
    
    reports = []
    passed_count = 0
    flagged_count = 0
    
    for ir in identity_reports:
        user = db.query(models.User).filter(models.User.id == ir.user_id).first()
        target = f"User #{ir.user_id} ({user.username})" if user else f"User #{ir.user_id}"
        ocr = int((ir.ocr_confidence or 0.0) * 100) if (ir.ocr_confidence or 0.0) <= 1.0 else int(ir.ocr_confidence)
        face = int((getattr(ir, 'face_match_confidence', getattr(ir, 'face_match_score', 0.0)) or 0.0) * 100)
        status_val = getattr(ir, 'status', 'Pass')
        is_pass = status_val in ['Pass', 'Passed', 'Approved'] or getattr(ir, 'is_approved', False)
        if is_pass:
            passed_count += 1
        else:
            flagged_count += 1

        reports.append({
            "id": f"ID-{ir.id}",
            "raw_id": ir.id,
            "type": "Identity Verification",
            "target": target,
            "ocrConfidence": ocr,
            "faceMatch": face,
            "risk": "Low" if is_pass else "High",
            "status": "Passed" if is_pass else "Flagged",
            "details": f"OCR Confidence: {ocr}%, Face Match: {face}%, Liveness: {int((getattr(ir, 'liveness_score', 0) or 0)*100)}%",
            "date": str(ir.timestamp)[:19] if getattr(ir, "timestamp", None) else "Recent"
        })
        
    for ar in item_reports:
        item = db.query(models.AuctionItem).filter(models.AuctionItem.id == ar.auction_item_id).first()
        title = item.title if item else f"Item #{ar.auction_item_id}"
        auth_score = int((ar.authenticity_score or 0.0) * 100) if (ar.authenticity_score or 0.0) <= 1.0 else int(ar.authenticity_score or 0)
        ai_conf = int((ar.ai_confidence or 0.0) * 100) if (ar.ai_confidence or 0.0) <= 1.0 else int(ar.ai_confidence or 0)
        is_authentic = getattr(ar, 'is_authentic', auth_score >= 70)
        if is_authentic:
            passed_count += 1
        else:
            flagged_count += 1

        reports.append({
            "id": f"ITEM-{ar.id}",
            "raw_id": ar.id,
            "type": "Object Detection",
            "target": f"Item: {title}",
            "ocrConfidence": ai_conf,
            "faceMatch": auth_score,
            "risk": "Low" if is_authentic else "High",
            "status": "Passed" if is_authentic else "Flagged",
            "details": ar.report_details or f"Authenticity Score: {auth_score}%, AI Confidence: {ai_conf}%",
            "date": str(ar.timestamp)[:19] if getattr(ar, "timestamp", None) else "Recent"
        })

    total_scans = len(reports)
    kpis = {
        "total_scanned": total_scans,
        "pass_rate": round((passed_count / total_scans * 100), 1) if total_scans > 0 else 100.0,
        "identity_scans": len(identity_reports),
        "object_scans": len(item_reports),
        "flagged_items": flagged_count
    }
        
    return {"reports": reports, "kpis": kpis}

@router.get("/fraud-alerts")
def get_fraud_alerts(admin: models.Admin = Depends(require_admin), db: Session = Depends(get_db)):
    """ Get AI Fraud Detection Logs with DB KPIs """
    fraud_logs = db.query(models_phase3_ai.AIFraudDetectionLog).all()
    result = []
    critical_count = 0
    high_count = 0
    bid_suspicious_count = 0

    for log in fraud_logs:
        risk_level = "Low"
        if log.risk_score:
            if log.risk_score > 0.8:
                risk_level = "Critical"
                critical_count += 1
            elif log.risk_score > 0.5:
                risk_level = "High"
                high_count += 1
            elif log.risk_score > 0.3:
                risk_level = "Medium"
            
        target_str = f"{log.target_type} #{log.target_id}" if log.target_type and log.target_id else f"Target #{log.target_id or log.id}"
        if (log.target_type or "").lower() == "bid":
            bid_suspicious_count += 1

        result.append({
            "id": f"FRD-{log.id}",
            "raw_id": log.id,
            "target": target_str,
            "type": log.target_type or "Fraud Alert",
            "risk": risk_level,
            "score": int((log.risk_score or 0.0) * 100),
            "details": log.flagged_reason or "Anomalous behavioral pattern detected by AI neural screening.",
            "status": "Flagged" if risk_level in ["Critical", "High", "Medium"] else "Under Watch",
            "date": str(log.timestamp)[:19] if log.timestamp else "N/A"
        })

    total_alerts = len(result)
    kpis = {
        "total_alerts": total_alerts,
        "critical_risk": critical_count,
        "high_risk": high_count,
        "suspicious_bids": bid_suspicious_count
    }
    return {"alerts": result, "kpis": kpis}
