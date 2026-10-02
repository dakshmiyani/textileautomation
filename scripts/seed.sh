#!/bin/bash
set -e

echo "🌱 Running database seeds..."
npm run seed --workspace=server
echo "✅ Seeding completed!"
