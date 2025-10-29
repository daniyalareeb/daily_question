# How to Add Environment Variables to Vercel

## Quick Steps

1. **Go to your Vercel project dashboard**
   - URL: https://vercel.com/daniyalareebs-projects/daily_questions

2. **Click on "Settings" tab** (top menu)

3. **Click on "Environment Variables"** (left sidebar)

4. **Add only 1 variable (Firebase is handled securely on backend):**

   Click "Add New":

   ### Variable 1
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://daily-question.onrender.com`
   - **Environment**: Production (checkbox)

   **Note:** All Firebase credentials are now handled securely on the backend. The frontend does NOT need Firebase credentials anymore.

5. **After adding all variables, go to "Deployments" tab**

6. **Redeploy**: 
   - Find the latest deployment
   - Click the three dots "..." menu
   - Click "Redeploy"
   - Confirm redeploy

## Alternative: One-Time Quick Setup

If you want to add all at once, you can also:

1. Go to: https://vercel.com/daniyalareebs-projects/daily_questions/settings/environment-variables

2. Use this format to add it:

```bash
# Copy and paste into Vercel:

REACT_APP_API_URL=https://daily-question.onrender.com
```

**Note:** Firebase credentials are no longer needed in the frontend. They are securely handled on the backend.

## After Adding Variables

1. Go to "Deployments" tab
2. Click the three dots "..." on the latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes
5. Your app will be live!

## Test Your App

Visit: https://dailyquestions-xi.vercel.app

- Try logging in
- Check if API calls work
- Test the dashboard

## Troubleshooting

### Variables Not Working?
- Make sure each variable starts with `REACT_APP_`
- Check the "Production" checkbox
- Redeploy after adding variables
- Clear browser cache

### Still Not Working?
1. Check Vercel logs (Deployments → Click deployment → Logs)
2. Open browser console (F12) to see errors
3. Verify backend is running: https://daily-question.onrender.com/api/health


