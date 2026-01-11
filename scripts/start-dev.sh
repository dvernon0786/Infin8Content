#!/bin/bash

# Start local development and Inngest servers
echo "🚀 Starting local development servers..."

# Change to the infin8content directory
cd infin8content

# Start Next.js development server
echo "📦 Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!

# Start Inngest dev server
echo "⚡ Starting Inngest dev server..."
npx inngest-cli@latest dev &
INNGEST_PID=$!

# Wait a moment for servers to start
sleep 3

echo "✅ Servers started!"
echo "📦 Next.js: http://localhost:3000"
echo "⚡ Inngest: http://localhost:8288"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $NEXT_PID 2>/dev/null
    kill $INNGEST_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for both processes
wait
