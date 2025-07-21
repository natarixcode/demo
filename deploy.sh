#!/bin/bash

# Notorix Deployment Script
echo "🚀 Starting Notorix Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Set deployment mode
DEPLOYMENT_MODE=${1:-"development"}

print_status "Deployment Mode: $DEPLOYMENT_MODE"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down

# Remove old images (optional)
read -p "Do you want to remove old Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Removing old Docker images..."
    docker system prune -f
fi

# Build and start containers
print_status "Building and starting containers..."
if [ "$DEPLOYMENT_MODE" = "production" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
else
    docker-compose up -d --build
fi

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."

# Check backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$BACKEND_HEALTH" = "200" ]; then
    print_status "✅ Backend is healthy"
else
    print_warning "⚠️  Backend health check failed (HTTP: $BACKEND_HEALTH)"
fi

# Check frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
if [ "$FRONTEND_HEALTH" = "200" ]; then
    print_status "✅ Frontend is accessible"
else
    print_warning "⚠️  Frontend health check failed (HTTP: $FRONTEND_HEALTH)"
fi

# Check database
DB_HEALTH=$(docker-compose exec -T db pg_isready -U postgres)
if [[ $DB_HEALTH == *"accepting connections"* ]]; then
    print_status "✅ Database is ready"
else
    print_warning "⚠️  Database is not ready"
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

# Show logs for debugging
print_status "Recent logs:"
docker-compose logs --tail=20

# Display access URLs
echo ""
print_status "🎉 Deployment completed!"
echo "📱 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 API Health: http://localhost:3001/api/health"
echo "🗄️  Database: localhost:5432"

# Performance tips
echo ""
print_status "💡 Performance Tips:"
echo "• Monitor logs: docker-compose logs -f"
echo "• Scale services: docker-compose up -d --scale backend=2"
echo "• Update images: docker-compose pull && docker-compose up -d"

# Security reminders
echo ""
print_warning "🔒 Security Reminders:"
echo "• Change default passwords in production"
echo "• Use HTTPS with SSL certificates"
echo "• Configure firewall rules"
echo "• Regular security updates"

echo ""
print_status "Happy hosting! 🚀" 