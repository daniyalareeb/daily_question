#!/bin/bash

# Daily Questions Backend - Startup Script

echo "🚀 Starting Daily Questions Backend..."

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Please run this script from the backend directory"
    echo "   cd backend && ./start.sh"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   ./setup.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with your credentials."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if server is already running
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo "⚠️  Server is already running!"
    echo "   To stop it: pkill -f 'uvicorn app.main:app'"
    echo "   To restart: pkill -f 'uvicorn app.main:app' && ./start.sh"
    exit 1
fi

# Start the server
echo "🌐 Starting server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


