import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(to_email: str, otp: str):
    """
    Dispatches the OTP to the user's email.
    If SMTP credentials are not set, it falls back to 
    logging the OTP to the console for local development.
    """
    smtp_email = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    
    if not smtp_email or not smtp_password:
        print("="*50)
        print(f"📧 [LOCAL DEV] Mock Email Dispatcher")
        print(f"To: {to_email}")
        print(f"Subject: Your Ecom password reset OTP")
        print(f"OTP Code: {otp}")
        print("="*50)
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Ecom Support <{smtp_email}>"
        msg['To'] = to_email
        msg['Subject'] = "Your Password Reset Verification Code"
        
        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset</h2>
            <p>You requested a password reset for your Ecom Commerce account.</p>
            <p>Your 6-digit verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #10B981;">{otp}</h1>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        # Connect to Gmail SMTP (change host/port if using another provider)
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f"Successfully sent OTP to {to_email} via SMTP")
        return True
    except Exception as e:
        print(f"Failed to send email via SMTP: {e}")
        return False
