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

1. **Backend API URL (only required frontend env variable):**
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://daily-question.onrender.com` (your backend URL)

**Note:** All Firebase credentials are now handled securely on the backend. The frontend does NOT need any Firebase credentials. Authentication is done through backend API endpoints.

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
# Only this variable is needed for frontend:
REACT_APP_API_URL=https://daily-question.onrender.com

# All Firebase credentials are handled securely on the backend
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

