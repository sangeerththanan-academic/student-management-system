# OTP Email Verification System

A secure email verification system using One-Time Passwords (OTP) built with Python's built-in HTTP server.

## Project Structure

```
email_verification/
└── OTP_SMTP/
    ├── app.py                    # Main application server
    ├── smtp_service.py           # Email sending functionality
    ├── otp_service.py            # OTP generation and validation
    ├── db.json                   # User database (JSON file)
    ├── templates/
    │   ├── signup.html           # Email registration page
    │   ├── verify.html           # OTP verification page
    │   └── success.html          # Verification success page
    └── README.md
```

## Features

- **OTP-based Verification**: 6-digit numeric OTP sent via email
- **Secure OTP Generation**: Random OTPs with 10-minute expiry
- **Attempt Limiting**: Maximum 3 attempts per OTP
- **Resend OTP**: Users can request new OTP if needed
- **Professional UI**: Clean, responsive web interface
- **Database Storage**: JSON-based user storage with OTP tracking

## Security Features

- **Time-based Expiry**: OTPs expire after 10 minutes
- **Attempt Limiting**: Prevents brute force attacks (max 3 attempts)
- **Unique OTPs**: Each request generates a new random OTP
- **Email Validation**: Proper email format validation

## Setup

1. Ensure you have Python 3.6+ installed
2. Update SMTP credentials in `smtp_service.py` if needed
3. Run the application

## How to Run

```bash
cd email_verification/OTP_SMTP
python app.py
```

## Access the Application

Open your browser and navigate to:
```
http://localhost:8001
```

## Usage Flow

1. **Enter Email**: Users enter their email address on the homepage
2. **Receive OTP**: A 6-digit OTP is sent to their email
3. **Verify OTP**: Users enter the OTP on the verification page
4. **Success**: Email is verified and account is activated
5. **Resend Option**: Users can request a new OTP if needed

## API Endpoints

- `GET /` - Show signup page
- `POST /send-otp` - Generate and send OTP to email
- `POST /verify-otp` - Verify entered OTP
- `POST /resend-otp` - Resend new OTP to email

## Configuration

### SMTP Settings (in `smtp_service.py`)
- Server: smtp.gmail.com
- Port: 587
- Update `SMTP_EMAIL` and `SMTP_PASSWORD` with your credentials

### OTP Settings (in `otp_service.py`)
- Length: 6 digits
- Expiry: 10 minutes
- Max attempts: 3

### Database
- Users are stored in `db.json`
- Each user has: email, otp, expiry, verified status, attempts

## Security Notes

- This is a demo application using basic authentication
- In production, use a proper database and secure OTP handling
- Consider implementing rate limiting and additional security measures
- Use HTTPS in production to protect OTP transmission
- Implement proper session management for verified users

## Email Template

The OTP email includes:
- 6-digit OTP code
- Expiry information (10 minutes)
- Security warning about sharing OTPs

## Error Handling

- Invalid OTP format (must be 6 digits)
- Expired OTP handling
- Maximum attempts exceeded
- Email delivery failure handling
- Database error handling
