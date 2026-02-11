#!/bin/bash

# Real E2E Test Runner
# This script sets up the environment and runs real behavioral validation tests

set -e

echo "🚀 Starting Real E2E Test Environment..."

# Check if required services are running
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "🔍 Checking $service_name at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready"
            return 0
        fi
        
        echo "⏳ Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start"
    return 1
}

# Check if dev server is running
check_service "Next.js Dev Server" "http://localhost:3000/api/health"

# Check if Supabase is running
check_service "Supabase" "http://localhost:54321/rest/v1/"

# Run the real E2E tests
echo "🧪 Running Real E2E Tests..."
cd infin8content

# Set test environment variables
export TEST_API_BASE_URL="http://localhost:3000"
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"

# Run the tests
npm run test __tests__/e2e/real-step-1-to-2.test.ts

echo "✅ Real E2E Tests Complete!"
