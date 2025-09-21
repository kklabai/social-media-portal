#!/bin/bash

# Deployment script for social media portal

set -e

echo "🚀 Deploying Social Media Portal..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data uploads nginx/ssl

# Check if SSL certificates exist (for production)
if [ "$NODE_ENV" = "production" ]; then
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        echo "⚠️  Warning: SSL certificates not found in nginx/ssl/"
        echo "For production, please add cert.pem and key.pem"
    fi
fi

# Build and start containers
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

# Wait for application to be healthy
echo "⏳ Waiting for application to be healthy..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec social-media-portal npx prisma migrate deploy

# Check health
echo "🏥 Checking application health..."
curl -f http://localhost:3000/api/health || {
    echo "❌ Health check failed!"
    docker-compose logs social-media-portal
    exit 1
}

echo "✅ Deployment completed successfully!"
echo ""
echo "Application is running at:"
echo "  - HTTP: http://localhost:3000"
echo "  - HTTPS: https://localhost (if nginx is configured)"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"