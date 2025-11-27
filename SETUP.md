# Setup Guide - Supabase Migration

## Prerequisites

1. **Supabase Project**: Create a project at https://supabase.com
2. **Get Supabase Credentials**:
   - Go to Project Settings → API
   - Copy the following:
     - Project URL (SUPABASE_URL)
     - Anon/Public Key (SUPABASE_KEY)
     - Service Role Key (SUPABASE_SERVICE_KEY) - Keep this secret!

## Backend Setup

### 1. Create `.env` file in `backend/` directory

```bash
cd backend
cp .env.example .env
```

### 2. Edit `backend/.env` and add your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Email Service (Resend) - Optional
RESEND_API_KEY=your_resend_api_key

# Reminder Configuration
REMINDER_TIME=20:00

# Environment
ENVIRONMENT=development
```

### 3. Test Backend Configuration

```bash
cd backend
python3 test_config.py
```

This will verify:
- ✅ All required environment variables are set
- ✅ Supabase client can be initialized
- ✅ Database connection works

### 4. Set up Supabase Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `backend/supabase_schema.sql`
4. Run the SQL script

This creates:
- All required tables (questions, question_options, sub_questions, etc.)
- Indexes for performance
- Row Level Security (RLS) policies

### 5. Seed Questions

```bash
cd backend
python3 scripts/seed_questions.py
```

This will populate all 8 questions with their options and sub-questions.

### 6. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 7. Start Backend Server

```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

### 1. Create `.env` file in `frontend/` directory

```bash
cd frontend
cp .env.example .env
```

### 2. Edit `frontend/.env` and add your Supabase credentials:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install Dependencies

```bash
cd frontend
npm install
```

This will automatically remove Firebase dependencies and install Supabase.

### 4. Test Frontend Configuration

```bash
cd frontend
node test_config.js
```

### 5. Start Frontend Development Server

```bash
cd frontend
npm start
```

The app will open at http://localhost:3000

## Testing the Application

### 1. Test Authentication

1. Navigate to http://localhost:3000
2. Click "Sign up" to create a new account
3. Check your email for verification (if email verification is enabled)
4. Log in with your credentials

### 2. Test Questions

1. After logging in, you should see the Questions page
2. Answer all 8 questions (single-select, multi-select, and sub-questions)
3. Submit your responses

### 3. Test Dashboard

1. Navigate to Dashboard
2. View your analytics:
   - Daily progress and streaks
   - Mood scores
   - Frequency charts
   - Weekly summaries

## Troubleshooting

### Backend Issues

**Error: "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set"**
- Solution: Make sure your `.env` file is in the `backend/` directory and contains all required variables

**Error: "Failed to create response"**
- Solution: Check that the Supabase schema has been run and tables exist

**Error: "Questions not found"**
- Solution: Run the seed script: `python3 scripts/seed_questions.py`

### Frontend Issues

**Error: "Missing Supabase environment variables"**
- Solution: Make sure your `.env` file is in the `frontend/` directory and contains `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
- Note: React requires the `REACT_APP_` prefix for environment variables

**Error: "Cannot connect to backend"**
- Solution: Make sure the backend is running on port 8000 and `REACT_APP_API_URL` is set correctly

**Error: "Invalid token" or authentication issues**
- Solution: Clear browser localStorage and try logging in again

## Environment Variables Summary

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase anon key (optional, for reference)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (required)
- `RESEND_API_KEY` - For email reminders (optional)
- `REMINDER_TIME` - Time to send reminders (default: 20:00)
- `ENVIRONMENT` - development or production

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:8000)
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anon/public key

## Next Steps

1. ✅ Set up Supabase project and get credentials
2. ✅ Create `.env` files with credentials
3. ✅ Run Supabase schema SQL
4. ✅ Seed questions
5. ✅ Test authentication
6. ✅ Test question submission
7. ✅ Test dashboard analytics

## Notes

- Old Firebase/MongoDB code is commented out but not deleted (as requested)
- Data in MongoDB/Firebase is preserved (not migrated automatically)
- The seed script will ask before overwriting existing questions
- All 8 questions are included in the seed script with proper structure




