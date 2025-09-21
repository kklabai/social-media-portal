#!/bin/bash

echo "========================================"
echo "Starting Social Media Portal on port 3001"
echo "========================================"
echo ""
echo "IMPORTANT: To avoid session conflicts with your previous app:"
echo "1. Clear your browser cookies for localhost:3000 AND localhost:3001"
echo "2. Or use an incognito/private browser window"
echo "3. Or use a different browser"
echo ""
echo "Press Enter to continue..."
read

# Copy the port 3001 env file
cp .env.local.port3001 .env.local

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "Starting the app on http://localhost:3001"
echo ""

# Start the app on port 3001
PORT=3001 npm run dev