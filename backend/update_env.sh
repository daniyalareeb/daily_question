#!/bin/bash
# Script to update .env file with Supabase configuration

echo "📝 Updating .env file with Supabase configuration..."

# Backup existing .env
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Created backup: .env.backup"
fi

# Create new .env with Supabase (keeping RESEND_API_KEY, REMINDER_TIME, ENVIRONMENT if they exist)
RESEND_KEY=$(grep "^RESEND_API_KEY=" .env.backup 2>/dev/null | cut -d'=' -f2- || echo "re_your_resend_api_key_here")
REMINDER_TIME=$(grep "^REMINDER_TIME=" .env.backup 2>/dev/null | cut -d'=' -f2- || echo "20:00")
ENV_TYPE=$(grep "^ENVIRONMENT=" .env.backup 2>/dev/null | cut -d'=' -f2- || echo "development")

cat > .env << ENVFILE
# ============================================
# Supabase Configuration (REQUIRED)
# ============================================
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# ============================================
# Email Service Configuration (OPTIONAL)
# ============================================
RESEND_API_KEY=${RESEND_KEY}

# ============================================
# Reminder Configuration
# ============================================
REMINDER_TIME=${REMINDER_TIME}

# ============================================
# Environment
# ============================================
ENVIRONMENT=${ENV_TYPE}
ENVFILE

echo "✅ .env file updated!"
echo ""
echo "⚠️  IMPORTANT: Please edit .env and replace the placeholder values:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
echo "   - SUPABASE_SERVICE_KEY"
echo ""
echo "Your old .env is backed up as .env.backup"
