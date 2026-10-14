import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
from otp_service import generate_otp, generate_otp_expiry, save_otp, verify_otp
from smtp_service import send_otp_email

DB_FILE = "db.json"

class App(BaseHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/":
            self.show_file("templates/signup.html")

    def do_POST(self):
        if self.path == "/send-otp":
            self.handle_send_otp()
        elif self.path == "/verify-otp":
            self.handle_verify_otp()
        elif self.path == "/resend-otp":
            self.handle_resend_otp()

    def handle_send_otp(self):
        length = int(self.headers["Content-Length"])
        data = parse_qs(self.rfile.read(length).decode())
        email = data["email"][0]

        # Generate OTP and expiry time
        otp = generate_otp()
        expiry_time = generate_otp_expiry()
        
        # Save OTP to database
        save_otp(DB_FILE, email, otp, expiry_time)
        
        # Send OTP email
        if send_otp_email(email, otp):
            # Show verification page with email
            self.show_verification_page(email, "OTP sent successfully to your email")
        else:
            self.respond("Failed to send OTP. Please try again.", error=True)

    def handle_verify_otp(self):
        length = int(self.headers["Content-Length"])
        data = parse_qs(self.rfile.read(length).decode())
        email = data["email"][0]
        entered_otp = data["otp"][0]

        # Verify OTP
        success, message = verify_otp(DB_FILE, email, entered_otp)
        
        if success:
            self.show_success_page(email)
        else:
            self.show_verification_page(email, message, error=True)

    def handle_resend_otp(self):
        length = int(self.headers["Content-Length"])
        data = parse_qs(self.rfile.read(length).decode())
        email = data["email"][0]

        # Generate new OTP and expiry time
        otp = generate_otp()
        expiry_time = generate_otp_expiry()
        
        # Save new OTP to database
        save_otp(DB_FILE, email, otp, expiry_time)
        
        # Send OTP email
        if send_otp_email(email, otp):
            self.show_verification_page(email, "New OTP sent successfully to your email")
        else:
            self.show_verification_page(email, "Failed to resend OTP. Please try again.", error=True)

    def show_verification_page(self, email, message="", error=False):
        """Show OTP verification page with message"""
        try:
            with open("templates/verify.html", "r") as f:
                template = f.read()
            
            # Replace template variables
            template = template.replace("{{email}}", email)
            
            # Add message if provided
            if message:
                message_class = "error" if error else "success"
                message_html = f'<div class="message {message_class}">{message}</div>'
                template = template.replace(
                    '<div class="message info">',
                    message_html + '<div class="message info">'
                )
            
            self.respond(template, html=True)
        except FileNotFoundError:
            self.respond("Verification page not found", error=True)

    def show_success_page(self, email):
        """Show success page"""
        try:
            with open("templates/success.html", "r") as f:
                template = f.read()
            
            # Replace template variables
            template = template.replace("{{email}}", email)
            
            self.respond(template, html=True)
        except FileNotFoundError:
            self.respond("Email verified successfully!", html=True)

    def show_file(self, path):
        """Show HTML file"""
        try:
            with open(path, "r") as f:
                self.respond(f.read(), html=True)
        except FileNotFoundError:
            self.respond("Page not found", error=True)

    def respond(self, message, html=False, error=False):
        """Send HTTP response"""
        status = 500 if error else 200
        self.send_response(status)
        content_type = "text/html; charset=utf-8" if html else "text/plain; charset=utf-8"
        self.send_header("Content-type", content_type)
        self.end_headers()
        self.wfile.write(message.encode('utf-8'))

if __name__ == "__main__":
    server = HTTPServer(("localhost", 8001), App)
    print("OTP Email Verification Server running at http://localhost:8001")
    server.serve_forever()
