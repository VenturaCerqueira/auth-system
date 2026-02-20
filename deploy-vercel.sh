#!/bin/bash

# Deploy to Vercel Script
# Usage: ./deploy-vercel.sh

echo "========================================="
echo "Deploying to Vercel..."
echo "========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (only if not already logged in)
echo "Checking Vercel login..."
vercel link --yes 2>/dev/null || echo "Already linked or needs manual login"

# Deploy
echo "Starting deployment..."
vercel --prod

echo "========================================="
echo "Deployment complete!"
echo "========================================="
