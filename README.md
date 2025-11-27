# Daily Questions

A web application for daily self-reflection with analytics and insights.

## Features

- ✅ Answer 8 daily reflection questions (multiple-choice with sub-questions)
- ✅ Track your progress, streaks, and view analytics
- ✅ Beautiful, minimalistic UI with teal/grey theme
- ✅ Secure authentication with Supabase Auth
- ✅ Data stored in Supabase (PostgreSQL)
- ✅ Choice-based analytics (frequency, trends, mood scores)
- ✅ Email reminders (optional)

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- Supabase (PostgreSQL database + Auth)
- Resend (email reminders)
- Redis (caching, optional)

**Frontend:**
- React (JavaScript framework)
- Material-UI (component library)
- Supabase JS Client (authentication)
- Chart.js (data visualization)
- Axios (API calls)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 16+
- Supabase account (free tier available)
- Resend account (optional, for email reminders)

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

4. Create `.env` file (copy from `env.template`):
```bash
cp env.template .env
```

5. Edit `.env` file and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
RESEND_API_KEY=your_resend_key (optional)
REMINDER_TIME=20:00
ENVIRONMENT=development
```

6. Set up Supabase database:
   - Go to your Supabase project SQL Editor
   - Run the SQL from `supabase_schema.sql`
   - This creates all tables, indexes, and RLS policies

7. Seed questions:
```bash
python3 scripts/seed_questions.py
```

8. Run the server:
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

3. Create `.env` file (copy from `env.template`):
```bash
cp env.template .env
```

4. Edit `.env` file:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

5. Start development server:
```bash
npm start
```

Frontend will be available at `http://localhost:3000`

## Project Structure

```
daily_question/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints (auth, questions, responses, dashboard)
│   │   ├── crud/         # Database operations layer
│   │   ├── services/     # Business logic (analytics, reminders)
│   │   ├── config.py     # Environment configuration
│   │   ├── models.py     # Pydantic models
│   │   ├── supabase_client.py  # Supabase client
│   │   └── main.py       # FastAPI app
│   ├── scripts/
│   │   └── seed_questions.py  # Seed script for questions
│   ├── supabase_schema.sql    # Database schema
│   ├── requirements.txt
│   └── env.template      # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth, Questions)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API and Supabase clients
│   │   └── config/       # Configuration files
│   ├── package.json
│   └── env.template      # Environment variables template
└── README.md
```

## Environment Variables

See `ENV_SETUP.md` for detailed environment variable documentation.

### Backend Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key

### Frontend Required:
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anon/public key

## Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:
- `questions` - Daily questions
- `question_options` - Options for questions
- `sub_questions` - Sub-questions for complex questions
- `sub_question_options` - Options for sub-questions
- `responses` - User daily responses
- `response_answers` - Individual answer selections

See `backend/supabase_schema.sql` for the complete schema.

## Features

### Questions
- 8 daily reflection questions
- Single-select and multi-select options
- Sub-questions for complex questions (e.g., "What did you eat?" with breakfast/lunch/dinner)
- Validation logic (e.g., can't select "I didn't eat" with food items)

### Analytics
- Daily progress tracking (streaks, days this month)
- Mood score calculation (based on Q1: "How are you feeling?")
- Frequency charts (option selection frequency)
- Trend analysis (daily and weekly)
- Weekly summaries

### Authentication
- Email/password authentication via Supabase
- Email verification
- Password reset via email
- Secure session management

## Deployment

See `SETUP.md` for deployment instructions.

## License

MIT
