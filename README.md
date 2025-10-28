# Daily Questions - Self-Reflection Tracking App

A web application for daily self-reflection with analytics and insights.

## Features

- Answer 6 daily reflection questions
- Track progress and streaks
- View analytics and insights
- Beautiful minimalistic UI
- Firebase authentication
- MongoDB data storage

## Tech Stack

**Backend:**
- FastAPI
- MongoDB Atlas
- Firebase Admin SDK
- NLTK for NLP
- Resend for email

**Frontend:**
- React
- Material-UI
- Axios
- Firebase Auth

## Getting Started

See [DEPLOY.md](./DEPLOY.md) for deployment instructions to Render and Vercel.

## Local Development

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## License

MIT

