# Quick Fix for Render Deployment Issue

## Problem
Render is trying to run `gunicorn your_application.wsgi` instead of our FastAPI app.

## Solution 1: Manual Fix (Do This Now!)

1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your service `daily-questions-backend`
3. Go to **Settings** tab
4. Find **Start Command** section
5. Change it to:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. Click **Save Changes**
7. Go to **Manual Deploy** tab
8. Click **Deploy latest commit**

## Why This Happened

Render is ignoring the `startCommand` in `render.yaml` or the Blueprint wasn't properly set up. The manual setting overrides the yaml file.

## Alternative: Recreate Service

If manual fix doesn't work:

1. Delete the current service
2. Create a new **Web Service** (not Blueprint)
3. Configure:
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
4. Add all environment variables
5. Deploy

## Environment Variables to Add

In Render Settings → Environment:

1. `MONGODB_URI` - Your MongoDB connection string
2. `MONGODB_DBNAME` - `daily_questions`
3. `FIREBASE_CREDENTIALS_JSON` - Full JSON content (get from local file)
4. `RESEND_API_KEY` - Optional
5. `REMINDER_TIME` - `20:00`
6. `ENVIRONMENT` - `production`

## Getting Firebase Credentials

```bash
cd backend/app
cat dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json
```

Copy the entire JSON and paste it as the value for `FIREBASE_CREDENTIALS_JSON` in Render.

