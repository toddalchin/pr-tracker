#!/bin/bash

echo "🧹 Cleaning up corrupted installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f .next

echo "📦 Installing compatible dependencies..."
npm install

echo "🚀 Starting development server..."
npm run dev 