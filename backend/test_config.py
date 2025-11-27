#!/usr/bin/env python3
"""
Test script to validate backend configuration
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_config():
    """Test if all required environment variables are set"""
    print("=" * 50)
    print("Backend Configuration Test")
    print("=" * 50)
    
    errors = []
    warnings = []
    
    # Required Supabase variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    print("\n📋 Supabase Configuration:")
    if supabase_url:
        print(f"  ✅ SUPABASE_URL: {supabase_url[:30]}...")
    else:
        print("  ❌ SUPABASE_URL: Missing")
        errors.append("SUPABASE_URL")
    
    if supabase_key:
        print(f"  ✅ SUPABASE_KEY: {supabase_key[:20]}...")
    else:
        print("  ❌ SUPABASE_KEY: Missing")
        errors.append("SUPABASE_KEY")
    
    if supabase_service_key:
        print(f"  ✅ SUPABASE_SERVICE_KEY: {supabase_service_key[:20]}...")
    else:
        print("  ❌ SUPABASE_SERVICE_KEY: Missing")
        errors.append("SUPABASE_SERVICE_KEY")
    
    # Optional variables
    print("\n📧 Email Service (Optional):")
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        print(f"  ✅ RESEND_API_KEY: {resend_key[:20]}...")
    else:
        print("  ⚠️  RESEND_API_KEY: Not set (reminders won't work)")
        warnings.append("RESEND_API_KEY")
    
    print("\n⚙️  Other Configuration:")
    reminder_time = os.getenv("REMINDER_TIME", "20:00")
    print(f"  ✅ REMINDER_TIME: {reminder_time}")
    
    environment = os.getenv("ENVIRONMENT", "development")
    print(f"  ✅ ENVIRONMENT: {environment}")
    
    # Test Supabase connection
    if not errors:
        print("\n🔌 Testing Supabase Connection:")
        try:
            from app.supabase_client import supabase
            print("  ✅ Supabase client initialized successfully")
            
            # Try a simple query
            result = supabase.table("questions").select("id").limit(1).execute()
            print("  ✅ Supabase connection test passed")
        except Exception as e:
            print(f"  ❌ Supabase connection test failed: {e}")
            errors.append("Supabase connection")
    
    # Summary
    print("\n" + "=" * 50)
    if errors:
        print("❌ Configuration Errors Found:")
        for error in errors:
            print(f"   - {error}")
        print("\nPlease set the missing environment variables in .env file")
        return False
    else:
        print("✅ Configuration is valid!")
        if warnings:
            print("\n⚠️  Warnings:")
            for warning in warnings:
                print(f"   - {warning} is not set (optional)")
        return True

if __name__ == "__main__":
    success = test_config()
    sys.exit(0 if success else 1)




