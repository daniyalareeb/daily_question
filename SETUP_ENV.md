# Environment Variables Setup

## Frontend Setup

Create a file `frontend/.env.local` with these values:

```env
# Only the backend API URL is needed - Firebase is handled server-side
REACT_APP_API_URL=http://localhost:8000
```

**Note:** All Firebase credentials are now handled securely on the backend. The frontend does NOT need any Firebase credentials.

## Backend Setup

Create a file `backend/.env` with your credentials:

```env
MONGODB_URI=your_mongodb_connection_string_here
MONGODB_DBNAME=daily_questions
FIREBASE_CREDENTIALS_PATH=app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json
# OR use FIREBASE_CREDENTIALS_JSON with the full JSON content as an env variable (for Render/cloud deployments)
# FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
# Firebase Web API Key for password verification (required)
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
RESEND_API_KEY=your_resend_key_here
REMINDER_TIME=20:00
ENVIRONMENT=development
```

**To get MongoDB Atlas connection string:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual database password

## Important Notes

- The `.env.local` and `.env` files are NOT committed to Git (they're in `.gitignore`)
- Update Vercel environment variables for deployment
- Update Render environment variables for backend deployment

