#!/bin/bash

echo "🐍 Setting up Python Resume Parser..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo "✅ pip3 found: $(pip3 --version)"

# Install required packages
echo "📦 Installing required packages..."
pip3 install -r requirements.txt

echo "✅ Installation complete!"
echo ""
echo "🚀 To run the local server:"
echo "   cd firebase-functions"
echo "   python3 run_local.py"
echo ""
echo "🌐 Server will be available at: http://localhost:5006"
echo "🔗 Health check: http://localhost:5006/health"
