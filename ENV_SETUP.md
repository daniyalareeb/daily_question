# Environment Variables Setup Guide

## Quick Start

1. **Copy the example files to create your .env files:**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   
   # Frontend
   cd frontend
   cp .env.example .env
   ```

2. **Edit the `.env` files and add your actual values**

## Where to Get Supabase Credentials

1. Go to https://supabase.com and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** → Use for `SUPABASE_URL` and `REACT_APP_SUPABASE_URL`
   - **anon public** key → Use for `SUPABASE_KEY` and `REACT_APP_SUPABASE_ANON_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_KEY` (⚠️ Keep this secret!)

## Backend .env Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijklmnop.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (secret!) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_KEY` | Anon key (for reference) | - |
| `RESEND_API_KEY` | For email reminders | - |
| `REMINDER_TIME` | Time to send reminders | `20:00` |
| `ENVIRONMENT` | development/production | `development` |

## Frontend .env Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijklmnop.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | Anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8000` |

## Important Notes

### ⚠️ Security

- **Never commit `.env` files** to version control
- **Never expose `SUPABASE_SERVICE_KEY`** in frontend code
- The service role key has admin access - keep it secret!
- The anon key is safe for frontend use (it's public by design)

### 🔄 After Updating .env

**Backend:**
- Restart your FastAPI server
- Run `python3 test_config.py` to verify configuration

**Frontend:**
- Restart your React development server (`npm start`)
- React requires server restart to pick up new env variables

### ✅ Testing Configuration

**Backend:**
```bash
cd backend
python3 test_config.py
```

**Frontend:**
```bash
cd frontend
node test_config.js
```

## Example .env Files

### backend/.env
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxOTM5MDMyNzg5fQ.abc123
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjIzNDU2Nzg5LCJleHAiOjE5MzkwMzI3ODl9.xyz789
RESEND_API_KEY=re_abc123xyz789
REMINDER_TIME=20:00
ENVIRONMENT=development
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzQ1Njc4OSwiZXhwIjoxOTM5MDMyNzg5fQ.abc123
```

## Troubleshooting

### "SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set"
- Make sure your `.env` file exists in the `backend/` directory
- Check that variable names match exactly (case-sensitive)
- Verify there are no extra spaces or quotes around values

### "Missing Supabase environment variables" (Frontend)
- Make sure your `.env` file exists in the `frontend/` directory
- Check that variables start with `REACT_APP_` prefix
- Restart your React development server after updating `.env`

### "Invalid API key" or connection errors
- Double-check that you copied the keys correctly (no extra spaces)
- Verify you're using the correct key type (anon vs service_role)
- Make sure your Supabase project is active and not paused




