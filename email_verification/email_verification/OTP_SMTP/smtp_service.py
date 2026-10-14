import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "sangeerththanan.testmail@gmail.com"
SMTP_PASSWORD = "rpiv dqpo pscp tyvz"

def send_otp_email(to_email, otp):
    """Send OTP verification email"""
    msg = MIMEText(f"""Your One-Time Password (OTP) for email verification is:

{otp}

This OTP will expire in 10 minutes. If you did not request this verification, please ignore this email.

For your security, please do not share this OTP with anyone.""")
    msg["Subject"] = "Email Verification OTP"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
