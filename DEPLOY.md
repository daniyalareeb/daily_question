# Deployment Instructions

## Backend - Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - Name: `daily-questions-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`

5. **Add Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `MONGODB_DBNAME`: `daily_questions`
   - `FIREBASE_CREDENTIALS_PATH`: `app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json`
   - `RESEND_API_KEY`: Your Resend API key (optional)
   - `REMINDER_TIME`: `20:00`
   - `ENVIRONMENT`: `production`

6. **Click "Create Web Service"**

7. **Copy the URL** (e.g., `https://daily-questions-backend.onrender.com`)

## Frontend - Deploy to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Click "New Project"** → **Import your GitHub repository**
3. **Configure the project**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Add Environment Variable**:
   - Name: `REACT_APP_API_URL`
   - Value: Your Render backend URL (e.g., `https://daily-questions-backend.onrender.com`)

5. **Click "Deploy"**

## Important Notes

- Backend will be accessible at: `https://your-backend.onrender.com`
- Frontend will be accessible at: `https://your-frontend.vercel.app`
- Make sure to update CORS in `backend/app/main.py` with your Vercel domain
- Firebase credentials are already in the repo
- MongoDB Atlas is free tier compatible

## Testing Deployment

1. **Check Backend Health**: `https://your-backend.onrender.com/api/health`
2. **Check Frontend**: `https://your-frontend.vercel.app`
3. **Try to sign up and use the app**

## Troubleshooting

- If backend is slow, Render free tier spins down after inactivity
- If CORS errors, check CORS origins in `backend/app/main.py`
- Check Render logs for backend errors
- Check Vercel logs for frontend errors

