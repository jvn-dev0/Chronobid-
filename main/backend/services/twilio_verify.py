import os
import re
from typing import Dict, Any, Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_API_KEY = os.getenv("TWILIO_API_KEY", "")
TWILIO_API_SECRET = os.getenv("TWILIO_API_SECRET", "")
TWILIO_VERIFY_SERVICE_SID = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")

def get_twilio_client() -> Client:
    """Returns authenticated Twilio Client using Auth Token or API Key/Secret."""
    acc = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    key = os.getenv("TWILIO_API_KEY", "").strip()
    secret = os.getenv("TWILIO_API_SECRET", "").strip()

    if key and secret and acc and "YOUR_TWILIO" not in key:
        return Client(key, secret, account_sid=acc)
    elif acc and auth and "YOUR_TWILIO" not in acc and "YOUR_TWILIO" not in auth:
        return Client(acc, auth)
    else:
        raise ValueError("Twilio credentials are not configured in backend/.env. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (or TWILIO_API_KEY / TWILIO_API_SECRET), and TWILIO_VERIFY_SERVICE_SID.")

def normalize_e164_phone(phone: str) -> str:
    """
    Validates and formats raw phone string into E.164 standard (e.g., +15550198372 or +919876543210).
    Removes spaces, dashes, parentheses, dots. Auto-prefixes country code if 10-digit number is provided.
    """
    if not phone or not isinstance(phone, str):
        raise ValueError("Phone number is required.")
    
    cleaned = re.sub(r'[\s\-\(\)\.]', '', phone.strip())
    
    # Must start with a '+'
    if not cleaned.startswith('+'):
        # Auto-prefix country code for 10-digit numbers (e.g., Indian mobile 8861254291 -> +918861254291)
        if len(cleaned) == 10 and cleaned.isdigit():
            if cleaned[0] in '6789':
                cleaned = '+91' + cleaned
            else:
                cleaned = '+1' + cleaned
        elif cleaned.isdigit():
            cleaned = '+' + cleaned
        else:
            raise ValueError("Phone number must include country code (e.g. +91 9876543210 or +1 555-019-8372).")
    
    # Check E.164 regex: + followed by 8 to 15 digits
    if not re.match(r'^\+[1-9]\d{7,14}$', cleaned):
        raise ValueError("Invalid phone number format. Please provide a valid E.164 phone number with country code (e.g. +919876543210).")
    
    return cleaned

def get_or_create_verify_service_sid(client: Client) -> str:
    """
    Checks if TWILIO_VERIFY_SERVICE_SID is configured. If missing or placeholder,
    queries existing Twilio Verify Services or auto-creates a new Verify Service
    and updates backend/.env automatically.
    """
    current_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID", "").strip()
    if current_sid and "YOUR_TWILIO" not in current_sid:
        return current_sid

    try:
        services = client.verify.v2.services.list(limit=5)
        if services:
            service_sid = services[0].sid
        else:
            new_service = client.verify.v2.services.create(friendly_name="ChronoBid Seller Verification")
            service_sid = new_service.sid

        TWILIO_VERIFY_SERVICE_SID = service_sid

        env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()
            if "TWILIO_VERIFY_SERVICE_SID=" in content:
                content = re.sub(r"TWILIO_VERIFY_SERVICE_SID=.*", f"TWILIO_VERIFY_SERVICE_SID={service_sid}", content)
            else:
                content += f"\nTWILIO_VERIFY_SERVICE_SID={service_sid}\n"
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(content)
        return service_sid
    except Exception as e:
        print(f"[TwilioVerify] Auto-service creation warning: {e}")
        raise ValueError(f"Could not auto-configure Twilio Verify Service: {str(e)}")


def send_verification_otp(phone: str) -> Dict[str, Any]:
    """
    Triggers a real SMS OTP via Twilio Verify API v2.
    """
    normalized_phone = normalize_e164_phone(phone)
    client = get_twilio_client()
    service_sid = get_or_create_verify_service_sid(client)
    
    try:
        verification = client.verify.v2.services(service_sid).verifications.create(
            to=normalized_phone,
            channel='sms'
        )
        return {
            "success": True,
            "status": verification.status,
            "phone_number": normalized_phone,
            "message": f"Verification code sent via SMS to {normalized_phone}."
        }
    except TwilioRestException as e:
        error_msg = e.msg or str(e)
        if getattr(e, 'status', None) == 401 or "Authentication Error" in str(e) or getattr(e, 'code', None) == 20003:
            error_msg = "Twilio API Authentication Error: Invalid TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in backend/.env. Please verify your Twilio credentials."
        elif e.code == 60200:
            error_msg = "Invalid phone number for SMS delivery."
        elif e.code == 60203:
            error_msg = "Max send attempts reached for this phone number. Please wait before retrying."
        elif e.code == 20429:
            error_msg = "Too many requests. Please wait a few minutes."
        raise ValueError(f"Twilio SMS delivery error: {error_msg}")
    except Exception as e:
        raise ValueError(f"{str(e)}")

def check_verification_otp(phone: str, code: str) -> Dict[str, Any]:
    """
    Verifies the user's entered OTP code against Twilio Verify API v2.
    Returns status: 'approved' if valid, raises ValueError if invalid or expired.
    """
    normalized_phone = normalize_e164_phone(phone)
    clean_code = str(code).strip()
    
    if not clean_code or len(clean_code) < 4 or len(clean_code) > 10:
        raise ValueError("Verification code must be between 4 and 10 digits.")
    
    client = get_twilio_client()
    service_sid = get_or_create_verify_service_sid(client)

    try:
        verification_check = client.verify.v2.services(service_sid).verification_checks.create(
            to=normalized_phone,
            code=clean_code
        )
        
        if verification_check.status == "approved":
            return {
                "success": True,
                "status": "approved",
                "phone_number": normalized_phone,
                "message": "Phone number verified successfully."
            }
        else:
            return {
                "success": False,
                "status": verification_check.status,
                "phone_number": normalized_phone,
                "message": "Invalid or expired verification code."
            }
    except TwilioRestException as e:
        error_msg = e.msg or str(e)
        if getattr(e, 'status', None) == 401 or "Authentication Error" in str(e) or getattr(e, 'code', None) == 20003:
            error_msg = "Twilio API Authentication Error: Invalid TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in backend/.env."
        elif e.code == 20404:
            error_msg = "Verification code expired or not found. Please request a new OTP."
        elif e.code == 60202:
            error_msg = "Max check attempts reached. Please request a new OTP."
        raise ValueError(f"Verification check failed: {error_msg}")
    except Exception as e:
        raise ValueError(f"Error checking verification code: {str(e)}")
