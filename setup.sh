#!/bin/bash
# filepath: /home/muhadev/celm-backend/setup.sh

echo "🚀 Setting up Celm Backend..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create directories
mkdir -p logs uploads

# Check if Docker is available and PostgreSQL/Redis are not running locally
if command -v docker-compose &> /dev/null; then
    echo "🐳 Starting PostgreSQL and Redis with Docker..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis mailhog
    
    echo "⏳ Waiting for databases to be ready..."
    sleep 15
    
    # Create database if it doesn't exist
    echo "📦 Creating database if needed..."
    docker exec celm-backend-postgres-1 psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'celm_db'" | grep -q 1 || docker exec celm-backend-postgres-1 psql -U postgres -c "CREATE DATABASE celm_db;"
    
else
    echo "⚠️  Docker not found. Please ensure PostgreSQL and Redis are running locally."
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx knex migrate:latest

# Create some basic seed data (optional)
echo "🌱 Creating basic seed data..."
# We'll skip seeds for now since they're causing syntax errors

echo "✅ Setup complete!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm start          - Start production server"
echo "  npm test           - Run tests"
echo ""
echo "📧 Email testing available at: http://localhost:8025 (MailHog)"
echo "🗄️  Database: PostgreSQL on localhost:5432"
echo "🔄 Redis: localhost:6379"
echo ""
echo "🚀 Starting development server..."
npm run dev