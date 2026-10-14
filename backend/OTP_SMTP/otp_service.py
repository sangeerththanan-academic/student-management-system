import random
import string
from datetime import datetime, timedelta
import json

def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    characters = string.digits
    otp = ''.join(random.choice(characters) for _ in range(length))
    return otp

def generate_otp_expiry(minutes=10):
    """Generate expiry time for OTP (default 10 minutes)"""
    return datetime.now() + timedelta(minutes=minutes)

def is_otp_expired(expiry_time):
    """Check if OTP has expired"""
    return datetime.now() > datetime.fromisoformat(expiry_time)

def save_otp(db_file, email, otp, expiry_time):
    """Save OTP to database"""
    try:
        with open(db_file, 'r') as f:
            db = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        db = {"users": []}
    
    # Remove any existing OTP for this email
    db["users"] = [user for user in db["users"] if user["email"] != email]
    
    # Add new OTP entry
    db["users"].append({
        "email": email,
        "otp": otp,
        "expiry": expiry_time.isoformat(),
        "verified": False,
        "attempts": 0
    })
    
    with open(db_file, 'w') as f:
        json.dump(db, f, indent=2)

def verify_otp(db_file, email, entered_otp):
    """Verify OTP against database"""
    try:
        with open(db_file, 'r') as f:
            db = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return False, "Database not found"
    
    for user in db["users"]:
        if user["email"] == email and not user["verified"]:
            # Check if OTP has expired
            if is_otp_expired(user["expiry"]):
                return False, "OTP has expired"
            
            # Check attempts (max 3 attempts)
            if user["attempts"] >= 3:
                return False, "Maximum attempts exceeded"
            
            # Verify OTP
            if user["otp"] == entered_otp:
                user["verified"] = True
                with open(db_file, 'w') as f:
                    json.dump(db, f, indent=2)
                return True, "Email verified successfully"
            else:
                # Increment attempts
                user["attempts"] += 1
                remaining_attempts = 3 - user["attempts"]
                with open(db_file, 'w') as f:
                    json.dump(db, f, indent=2)
                return False, f"Invalid OTP. {remaining_attempts} attempts remaining"
    
    return False, "Email not found or already verified"
