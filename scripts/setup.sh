#!/bin/bash
set -e

echo "=========================================="
echo " Textile ERP — Monorepo Initial Setup"
echo "=========================================="

# Check root dependencies
echo "📦 Installing root workspaces dependencies..."
npm install

# Check environment files
if [ ! -f "server/.env" ]; then
  echo "📄 Creating server/.env from server/.env.example..."
  cp server/.env.example server/.env
fi

if [ ! -f "client/.env" ]; then
  echo "📄 Creating client/.env from client/.env.example..."
  cp client/.env.example client/.env
fi

# Run backend migrations
echo "🗄️ Running Knex database migrations..."
npm run migrate --workspace=server

# Run backend test suite to verify health
echo "🧪 Running backend test suite..."
npm test --workspace=server

echo ""
echo "✅ Setup successfully completed!"
echo "Run 'npm run dev' to start both client and server development servers."
