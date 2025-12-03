"""
Security utilities for password validation, input sanitization, and security checks
"""
import re
from typing import Tuple
import html

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    
    # Check for common weak passwords
    common_passwords = ['password', '12345678', 'qwerty', 'abc123', 'password123']
    if password.lower() in common_passwords:
        return False, "Password is too common. Please choose a stronger password"
    
    return True, ""

def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Sanitize user input to prevent XSS
    """
    if not text:
        return ""
    
    # Truncate to max length
    if len(text) > max_length:
        text = text[:max_length]
    
    # HTML escape to prevent XSS
    sanitized = html.escape(text)
    
    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')
    
    return sanitized.strip()

def validate_email_format(email: str) -> bool:
    """
    Additional email validation
    """
    if not email or len(email) > 254:  # RFC 5321 limit
        return False
    
    # Basic email regex (Pydantic EmailStr also validates, but this is extra check)
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_full_name(full_name: str) -> Tuple[bool, str]:
    """
    Validate full name input
    """
    if not full_name or not full_name.strip():
        return False, "Full name is required"
    
    if len(full_name) > 100:
        return False, "Full name must be less than 100 characters"
    
    # Check for only whitespace
    if not full_name.strip():
        return False, "Full name cannot be only whitespace"
    
    # Check for potentially malicious patterns
    if re.search(r'<script|javascript:|onerror=|onload=', full_name, re.IGNORECASE):
        return False, "Invalid characters in full name"
    
    return True, ""

def validate_redirect_url(url: str, allowed_domains: list = None) -> bool:
    """
    Validate redirect URL to prevent open redirect attacks
    """
    if not url:
        return False
    
    if allowed_domains is None:
        allowed_domains = [
            'localhost:3000',
            '127.0.0.1:3000',
            'vercel.app',
            'onrender.com'
        ]
    
    # Must start with http:// or https://
    if not url.startswith(('http://', 'https://')):
        return False
    
    # Check if domain is in allowed list
    for domain in allowed_domains:
        if domain in url:
            return True
    
    return False

