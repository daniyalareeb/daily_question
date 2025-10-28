#!/bin/bash

# Daily Questions Backend Setup Script

echo "🚀 Setting up Daily Questions Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Download NLTK data
echo "🧠 Downloading NLTK data..."
python -c "
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')
print('NLTK data downloaded successfully!')
"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "📝 Please update .env file with your MongoDB URI, Firebase credentials, and Resend API key"
fi

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your credentials:"
echo "   - MONGODB_URI: Your MongoDB connection string"
echo "   - FIREBASE_CREDENTIALS_PATH: Path to your Firebase service account JSON"
echo "   - RESEND_API_KEY: Your Resend API key"
echo ""
echo "2. Run the application:"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "3. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "🎉 Happy coding!"

