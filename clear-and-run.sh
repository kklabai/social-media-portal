#!/bin/bash

echo "Clearing browser cookies for localhost..."
echo "Please clear your browser cookies manually for localhost:3000 and localhost:3001"
echo ""
echo "Starting the app on port 3001 instead of 3000..."
echo ""

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the app on port 3001
PORT=3001 npm run dev