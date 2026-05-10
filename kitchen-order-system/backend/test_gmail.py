#!/usr/bin/env python
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ['true', '1', 'yes']
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '').strip()
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '').strip()

print(f"EMAIL_HOST: {EMAIL_HOST}")
print(f"EMAIL_PORT: {EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {EMAIL_HOST_USER}")
print(f"EMAIL_HOST_PASSWORD length: {len(EMAIL_HOST_PASSWORD)}")
print(f"PASSWORD: {EMAIL_HOST_PASSWORD}")

# Test SMTP connection
import smtplib
try:
    print("\n--- Testing SMTP Connection ---")
    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10)
    print("✓ SMTP connection successful!")
    
    server.starttls()
    print("✓ TLS upgrade successful!")
    
    server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
    print("✓ Gmail authentication SUCCESSFUL!")
    server.quit()
    print("\n✅ ALL TESTS PASSED - Email should work!")
    
except smtplib.SMTPAuthenticationError as e:
    print(f"\n❌ Authentication Failed: {e}")
    print("\nSolutions:")
    print("1. Generate a new Google App Password at: https://myaccount.google.com/apppasswords")
    print("2. Make sure 2FA is enabled on your Gmail account")
    print("3. Copy the 16-char app password WITHOUT spaces into your .env file")
    
except smtplib.SMTPException as e:
    print(f"\n❌ SMTP Error: {e}")
    
except Exception as e:
    print(f"\n❌ Connection Error: {type(e).__name__}: {e}")
