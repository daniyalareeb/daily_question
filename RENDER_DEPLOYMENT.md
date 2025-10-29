# Render Deployment Guide

## Prerequisites

1. **MongoDB Atlas account** (free tier available)
   - Create a cluster at https://www.mongodb.com/cloud/atlas
   - Get your connection string

2. **Resend account** (for email reminders - optional)
   - Sign up at https://resend.com
   - Get your API key

3. **Render account**
   - Sign up at https://render.com

## Deployment Steps

### Method 1: Using render.yaml (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository

3. **Render will auto-detect render.yaml**
   - The configuration will be automatically loaded
   - Review the settings

4. **Add Required Environment Variables**
   
   In Render dashboard, add these environment variables:
   
   - `MONGODB_URI`: Your MongoDB Atlas connection string
     - Example: `mongodb+srv://username:password@cluster.mongodb.net/`
   
   - `MONGODB_DBNAME`: `daily_questions`
   
   - `FIREBASE_CREDENTIALS_PATH`: `app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json`
   
   - `RESEND_API_KEY`: Your Resend API key (optional, for email reminders)
   
   - `REMINDER_TIME`: `20:00`
   
   - `ENVIRONMENT`: `production`

5. **Click "Apply"**
   - Render will build and deploy your backend
   - First deployment takes 5-10 minutes

6. **Copy your Render URL**
   - Example: `https://daily-questions-backend.onrender.com`

### Method 2: Manual Configuration

If you prefer manual setup:

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `daily-questions-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
5. Add environment variables (same as above)
6. Click "Create Web Service"

## Testing Deployment

1. **Health Check**
   ```
   https://your-app.onrender.com/api/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "version": "1.0.0",
     "features": [...]
   }
   ```

2. **API Documentation**
   Visit: `https://your-app.onrender.com/docs`

## Important Notes

### Free Tier Limitations
- **Render free tier spins down after 15 minutes of inactivity**
- First request after spin-down takes 30-60 seconds
- Consider upgrading to "Starter" ($7/month) for always-on performance

### Environment Variables
- **Never commit** `.env` files
- Use Render's Environment Variables section for secrets
- `sync: false` in render.yaml means you must manually add the value

### Firebase Credentials
- The Firebase credentials file is now included in the repository
- Ensure it's not in `.gitignore` (we've already fixed this)
- Required for Firebase Authentication

### MongoDB
- Use MongoDB Atlas for free MongoDB hosting
- Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- Whitelist Render's IP ranges in MongoDB Atlas (0.0.0.0/0 for development)

## Troubleshooting

### Backend is slow
- First request after inactivity is slow (30-60 seconds)
- This is normal for Render free tier
- Consider upgrading to "Starter" plan

### CORS errors
- Already configured in `backend/app/main.py`
- Supports both Vercel and Render domains

### Build fails
- Check Render logs for errors
- Ensure all dependencies in `requirements.txt`
- Verify Python version compatibility

### Database connection errors
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check MongoDB user has correct permissions

## Next Steps

After successful deployment:

1. **Update Frontend**
   - Update `REACT_APP_API_URL` in your frontend deployment
   - Point it to your Render backend URL

2. **Test Endpoints**
   - Try `/api/auth/register`
   - Try `/api/questions/`
   - Verify health checks

3. **Monitor Logs**
   - Check Render dashboard logs
   - Monitor for any errors or issues

## Support

- Render Docs: https://render.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- MongoDB Atlas: https://docs.atlas.mongodb.com

