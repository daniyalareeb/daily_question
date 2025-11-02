# Daily Questions

A web application for daily self-reflection with analytics and insights.

## Features

- ✅ Answer 6 daily reflection questions
- ✅ Track your progress and view analytics
- ✅ Beautiful, minimalistic UI
- ✅ Secure authentication with Firebase
- ✅ Data stored in MongoDB

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB Atlas (database)
- Firebase Admin SDK (authentication)
- NLTK (NLP for keyword extraction)
- Resend (email reminders)

**Frontend:**
- React (JavaScript framework)
- Material-UI (component library)
- Axios (API calls)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- MongoDB Atlas account
- Firebase project

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DBNAME=daily_questions
FIREBASE_CREDENTIALS_PATH=path/to/firebase-credentials.json
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
JWT_SECRET_KEY=your-secret-key-here
RESEND_API_KEY=your_resend_key (optional)
```

5. Run the server:
```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
REACT_APP_API_URL=http://localhost:8000
```

4. Start development server:
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## Project Structure

```
daily_question/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── crud/         # Database operations
│   │   ├── models.py     # Data models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   └── services/     # API service
│   └── package.json
└── docs/                 # Documentation and templates
```

## Deployment

- **Backend**: Deploy to [Render](https://render.com) or similar platform
- **Frontend**: Deploy to [Vercel](https://vercel.com)

See `backend/README.md` and `frontend/README.md` for detailed deployment instructions.

## License

MIT
