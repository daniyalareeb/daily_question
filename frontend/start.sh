#!/bin/bash

# Daily Questions Frontend - Startup Script

echo "🚀 Starting Daily Questions Frontend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    echo "   cd frontend && ./start.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
else
    echo "⚠️  Backend is not running!"
    echo "   Please start the backend first:"
    echo "   cd ../backend && ./start.sh"
    echo ""
    echo "   Or start it manually:"
    echo "   cd ../backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🌐 Starting React development server..."
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start


