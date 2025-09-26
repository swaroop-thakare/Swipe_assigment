#!/bin/bash

# AI Interview Platform Startup Script

echo "🚀 Starting AI Interview Platform..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   brew services start mongodb-community"
    echo "   or"
    echo "   mongod --config /usr/local/etc/mongod.conf"
    echo ""
    echo "Continuing without MongoDB (will use fallback mode)..."
fi

# Set environment variables
export NODE_ENV=development
export PORT=5000
export MONGODB_URI=mongodb://localhost:27017/ai-interview
export OPENAI_API_KEY=${OPENAI_API_KEY:-"your_openai_api_key_here"}
export FRONTEND_URL=http://localhost:3000

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ AI Interview Platform is running!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 API Health: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
