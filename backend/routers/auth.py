from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import sys
import os
import secrets
import string
from google.oauth2 import id_token
from google.auth.transport import requests
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Database')))
import models
import schemas
from database import get_db
from dependencies import hash_password, verify_password, create_access_token, get_current_user

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.email == user_data.email) | 
        (models.User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already registered")

    # Hash the password securely
    hashed_pw = hash_password(user_data.password)

    # Create the User record
    new_user = models.User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create the specific profile (Buyer or Seller) based on the role they chose
    if user_data.role.lower() == "buyer":
        buyer_profile = models.Buyer(user_id=new_user.id)
        db.add(buyer_profile)
    elif user_data.role.lower() == "seller":
        seller_profile = models.Seller(user_id=new_user.id)
        db.add(seller_profile)
    else:
        raise HTTPException(status_code=400, detail="Role must be 'buyer' or 'seller'")

    # Every user gets a Wallet automatically!
    new_wallet = models.Wallet(user_id=new_user.id, balance=0.0)
    db.add(new_wallet)

    db.commit()
    return {"message": "User registered successfully!", "user_id": new_user.id}

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # Verify User exists
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

    # Determine role (for token)
    role = "guest"
    if db.query(models.Buyer).filter(models.Buyer.user_id == user.id).first():
        role = "buyer"
    elif db.query(models.Seller).filter(models.Seller.user_id == user.id).first():
        role = "seller"

    # Create Secure JWT Token
    access_token = create_access_token(data={"user_id": user.id, "role": role})

    return {"access_token": access_token, "token_type": "bearer", "role": role, "user_id": user.id}

@router.post("/google", response_model=schemas.TokenResponse)
def google_login(login_data: schemas.GoogleLogin, db: Session = Depends(get_db)):
    """ Endpoint to verify Google Token and login/register user """
    try:
        # Verify the Google JWT token
        idinfo = id_token.verify_oauth2_token(
            login_data.credential, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        # Check if user already exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Generate a random password since they use Google
            alphabet = string.ascii_letters + string.digits
            random_password = ''.join(secrets.choice(alphabet) for i in range(16))
            hashed_pw = hash_password(random_password)
            
            # Use email prefix as temporary username
            username = email.split('@')[0]
            
            # Make sure username is unique
            if db.query(models.User).filter(models.User.username == username).first():
                username = f"{username}_{secrets.randbelow(9999)}"
                
            new_user = models.User(
                first_name=first_name,
                last_name=last_name,
                username=username,
                email=email,
                password_hash=hashed_pw
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            
            # Assign role
            role = login_data.role.lower() if login_data.role else "buyer"
            if role == "seller":
                db.add(models.Seller(user_id=user.id))
            else:
                db.add(models.Buyer(user_id=user.id))
                role = "buyer" # fallback
                
            # Create Wallet
            db.add(models.Wallet(user_id=user.id, balance=0.0))
            db.commit()
        else:
            # existing user, determine role
            role = "guest"
            if db.query(models.Buyer).filter(models.Buyer.user_id == user.id).first():
                role = "buyer"
            elif db.query(models.Seller).filter(models.Seller.user_id == user.id).first():
                role = "seller"
                
        # Create Secure JWT Token
        access_token = create_access_token(data={"user_id": user.id, "role": role})
        return {"access_token": access_token, "token_type": "bearer", "role": role, "user_id": user.id}
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")

@router.get("/me")
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    """ Secure endpoint to get logged in user's profile info """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }
