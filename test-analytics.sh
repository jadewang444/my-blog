#!/bin/bash
# Quick test script for analytics implementation
# Run this after setting up Supabase and configuring .env

set -e

echo "🔍 Checking environment variables..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Copy .env.example to .env and fill in your values:"
    echo "   cp .env.example .env"
    exit 1
fi

# Check if required env vars are set (basic validation)
if ! grep -q "SUPABASE_URL=https://" .env; then
    echo "❌ SUPABASE_URL not configured in .env"
    exit 1
fi

if ! grep -q "ADMIN_USER=" .env && ! grep -q "ADMIN_USER=admin" .env; then
    echo "❌ ADMIN_USER not configured in .env"
    exit 1
fi

echo "✅ Environment variables configured"

echo ""
echo "📦 Installing dependencies..."
npm install @supabase/supabase-js

echo ""
echo "✅ Dependencies installed"

echo ""
echo "🚀 Starting dev server..."
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:4321/ and navigate around"
echo "  2. Check http://localhost:4321/admin to see analytics"
echo "  3. Open browser console to verify no errors"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
