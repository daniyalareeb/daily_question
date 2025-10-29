# Vercel Deployment Guide - Daily Questions Frontend

## Prerequisites

1. **Backend is Live**: https://daily-question.onrender.com ✅
2. **Vercel account**: https://vercel.com
3. **GitHub repository** connected to Vercel

## Deployment Steps

### 1. Go to Vercel Dashboard
Visit: https://vercel.com/new

### 2. Import Your Repository
- Click "Import Project"
- Select your GitHub repository: `daniyalareeb/daily_question`
- Click "Import"

### 3. Configure Project Settings

**Project Settings:**
- **Project Name**: `daily-questions-frontend` (or any name you prefer)
- **Framework Preset**: Create React App (auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `build` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 4. Add Environment Variables

Click "Environment Variables" and add:

#### Required Variables

1. **Backend API URL:**
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://daily-question.onrender.com`

#### Firebase Configuration

2. **Firebase API Key:**
   - **Name**: `REACT_APP_FIREBASE_API_KEY`
   - **Value**: `AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE` (from your .env)

3. **Firebase Auth Domain:**
   - **Name**: `REACT_APP_FIREBASE_AUTH_DOMAIN`
   - **Value**: `dailyquestion-fcbae.firebaseapp.com`

4. **Firebase Project ID:**
   - **Name**: `REACT_APP_FIREBASE_PROJECT_ID`
   - **Value**: `dailyquestion-fcbae`

5. **Firebase Storage Bucket:**
   - **Name**: `REACT_APP_FIREBASE_STORAGE_BUCKET`
   - **Value**: `dailyquestion-fcbae.appspot.com`

6. **Firebase Messaging Sender ID:**
   - **Name**: `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - **Value**: `668300380437`

7. **Firebase App ID:**
   - **Name**: `REACT_APP_FIREBASE_APP_ID`
   - **Value**: `1:668300380437:web:dailyquestion-fcbae`

### 5. Deploy

- Click "Deploy"
- Wait for build to complete (2-5 minutes)
- You'll get a URL like: `https://daily-questions-frontend.vercel.app`

## Post-Deployment

### 1. Test Your App

Visit your Vercel URL and test:
- ✅ Login/Register works
- ✅ Questions page loads
- ✅ Dashboard shows data
- ✅ API calls work

### 2. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 3. Update CORS on Backend (Already Done ✅)

Your `backend/app/main.py` already includes:
```python
allow_origin_regex=r"https://.*\.(vercel\.app|onrender\.com)"
```

So any Vercel domain will work!

## Environment Variables Quick Reference

For easy copy-paste:

```
REACT_APP_API_URL=https://daily-question.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE
REACT_APP_FIREBASE_AUTH_DOMAIN=dailyquestion-fcbae.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=dailyquestion-fcbae
REACT_APP_FIREBASE_STORAGE_BUCKET=dailyquestion-fcbae.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=668300380437
REACT_APP_FIREBASE_APP_ID=1:668300380437:web:dailyquestion-fcbae
```

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all environment variables are set
- Verify React app builds locally first: `npm run build`

### CORS Errors
- Backend CORS is already configured for Vercel
- If still getting errors, check backend logs on Render

### API Not Working
- Verify `REACT_APP_API_URL` is set correctly
- Check backend health: https://daily-question.onrender.com/api/health
- Look at browser console for errors

### Environment Variables Not Working
- Make sure variable names start with `REACT_APP_`
- Redeploy after adding new environment variables
- Clear browser cache

## Next Steps

1. ✅ Backend deployed on Render
2. ✅ Frontend deployed on Vercel
3. 🎉 Your app is live!

## Support

- Vercel Docs: https://vercel.com/docs
- React Deployment: https://react.dev/learn/start-a-new-react-project
- Your backend: https://daily-question.onrender.com/docs

