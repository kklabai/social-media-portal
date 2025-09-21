#!/bin/bash

# Docker build script for social media portal

echo "🚀 Building Social Media Portal Docker Image..."

# Set variables
IMAGE_NAME="social-media-portal"
TAG=${1:-latest}

# Build the Docker image
echo "📦 Building Docker image: ${IMAGE_NAME}:${TAG}"
docker build -t ${IMAGE_NAME}:${TAG} .

# Tag for registry (optional)
if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo "🏷️  Tagging image for registry: ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"
    docker tag ${IMAGE_NAME}:${TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}
fi

echo "✅ Docker build completed successfully!"
echo ""
echo "To run the container locally:"
echo "  docker run -p 3000:3000 --env-file .env ${IMAGE_NAME}:${TAG}"
echo ""
echo "To push to registry:"
echo "  docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"