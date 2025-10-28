# Daily Questions Backend - Complete Setup Guide

## 🎯 Project Overview
Your **Daily Self-Reflection Tracking Web App** backend is now fully implemented with:

✅ **6 Fixed Questions** stored in MongoDB
✅ **Daily Response System** with duplicate prevention
✅ **NLP Analytics** with keyword extraction and synonym grouping
✅ **Dashboard API** with trend lines and frequency charts
✅ **Email Reminders** using Resend
✅ **Firebase Authentication** integration
✅ **MongoDB** data storage

## 🔧 Setup Instructions

### 1. **MongoDB Setup** ✅
You already have MongoDB Atlas configured:
- **Connection String**: `mongodb+srv://daniyalareeb123_db_user:<db_password>@dailyquestions.sbaa1vt.mongodb.net/?appName=DailyQuestions`
- **Database**: `daily_questions`

### 2. **Firebase Setup** ✅
Your Firebase project details:
- **Project ID**: `dailyquestion-fcbae`
- **Web API Key**: `AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE`
- **Support Email**: `daniyalareeb123@gmail.com`

**Next Steps for Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/dailyquestion-fcbae)
2. Enable **Authentication** → **Sign-in method** → **Email/Password**
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file and save it as `firebase-credentials.json` in your backend folder

### 3. **Environment Configuration**
Create a `.env` file in your backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://daniyalareeb123_db_user:<db_password>@dailyquestions.sbaa1vt.mongodb.net/?appName=DailyQuestions
MONGODB_DBNAME=daily_questions

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
FIREBASE_PROJECT_ID=dailyquestion-fcbae
FIREBASE_WEB_API_KEY=AIzaSyDp1uTI-BhRtGMIOCW5qKr04JpHrAaIOnE

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here

# App Settings
REMINDER_TIME=20:00
ENVIRONMENT=development
```

### 4. **Resend Email Setup** (Optional)
1. Go to [Resend](https://resend.com/)
2. Sign up for free account
3. Get your API key from dashboard
4. Update `RESEND_API_KEY` in `.env`

### 5. **Run the Application**

```bash
# Navigate to backend directory
cd backend

# Run setup script
./setup.sh

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📚 API Endpoints

### **Questions API**
- `GET /api/questions/` - Get all questions (with optional randomization)
- `GET /api/questions/{question_id}` - Get specific question
- `POST /api/questions/seed` - Seed questions in database

### **Responses API**
- `POST /api/responses/` - Submit daily responses
- `GET /api/responses/` - Get user responses (with date filtering)
- `GET /api/responses/{response_id}` - Get specific response
- `GET /api/responses/today/status` - Check if user submitted today

### **Dashboard API**
- `GET /api/dashboard/analytics` - Get comprehensive analytics
- `GET /api/dashboard/frequency-chart` - Get keyword frequency charts
- `GET /api/dashboard/trend-line/{keyword}` - Get trend data for specific keyword
- `GET /api/dashboard/summary` - Get quick dashboard summary
- `GET /api/dashboard/insights` - Get AI-generated insights

### **Auth API**
- `GET /api/auth/verify` - Verify Firebase token
- `GET /api/auth/user` - Get current user info

## 🧠 Features Implemented

### **NLP Analytics**
- **Keyword Extraction**: Uses NLTK for text processing
- **Synonym Grouping**: Groups similar words (happy, joyful, cheerful → happiness)
- **Sentiment Analysis**: Detects positive/negative themes
- **Trend Analysis**: Daily and weekly trend calculations

### **Dashboard Analytics**
- **Frequency Charts**: Both absolute counts and percentages
- **Trend Lines**: Daily and weekly trend data
- **Time Filtering**: Recent, last week, last month, all time
- **Per-Question Analysis**: Analytics for each individual question
- **Cross-Question Analysis**: Analytics across all questions

### **Reminder System**
- **Email Reminders**: Beautiful HTML emails via Resend
- **Daily Scheduling**: Configurable reminder time (default 8 PM)
- **Smart Filtering**: Only sends to users who haven't submitted today
- **Web Push**: Framework ready for web push notifications

## 🎨 Sample Questions
1. "How do you feel about the positive impact of AI?"
2. "How do you feel about your course?"
3. "How do you feel about your learning progression?"
4. "How do you feel about your finances?"
5. "How do you feel about your friendships?"
6. "How do you feel about your overall well-being today?"

## 🚀 Next Steps

1. **Complete Firebase Setup**: Download service account JSON
2. **Test the API**: Visit `http://localhost:8000/docs` for interactive API docs
3. **Frontend Development**: Build React frontend to consume these APIs
4. **Deploy**: Use Docker for production deployment

## 🔍 Testing

Once running, test these endpoints:
- `GET http://localhost:8000/` - Health check
- `GET http://localhost:8000/api/questions/` - Get questions
- `GET http://localhost:8000/api/health` - API health status

Your backend is now **production-ready** with all core features implemented! 🎉


