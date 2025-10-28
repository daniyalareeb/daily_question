# Environment Variables Setup

## Frontend Setup

Create a file `frontend/.env.local` with these values:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE
REACT_APP_FIREBASE_AUTH_DOMAIN=dailyquestion-fcbae.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=dailyquestion-fcbae
REACT_APP_FIREBASE_STORAGE_BUCKET=dailyquestion-fcbae.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=668300380437
REACT_APP_FIREBASE_APP_ID=1:668300380437:web:dailyquestion-fcbae
REACT_APP_API_URL=http://localhost:8000
```

## Backend Setup

Create a file `backend/.env` with your credentials:

```env
MONGODB_URI=your_mongodb_connection_string_here
MONGODB_DBNAME=daily_questions
FIREBASE_CREDENTIALS_PATH=app/dailyquestion-fcbae-firebase-adminsdk-fbsvc-282e703108.json
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

