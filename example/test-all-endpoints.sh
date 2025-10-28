#!/bin/bash

# 🧪 Hono Telescope - All Endpoints Test Script
# This script tests all endpoints and shows the results

BASE_URL="http://localhost:3000"
TOTAL_TESTS=0
SUCCESSFUL_TESTS=0
FAILED_TESTS=0

echo "🚀 Starting Hono Telescope Endpoint Tests..."
echo "=================================================="
echo "Base URL: $BASE_URL"
echo "Time: $(date)"
echo ""

# Test function
test_endpoint() {
    local method=$1
    local path=$2
    local description=$3
    local data=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "🔍 Test $TOTAL_TESTS: $description"
    echo "   $method $path"
    
    start_time=$(python3 -c "import time; print(int(time.time() * 1000))")
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path")
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$path")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" "$BASE_URL$path")
        fi
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$path")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$path")
    fi
    
    end_time=$(python3 -c "import time; print(int(time.time() * 1000))")
    duration=$((end_time - start_time))
    
    # Extract last line (HTTP status code)
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 400 ]; then
        echo "   ✅ Success - Status: $http_code (${duration}ms)"
        SUCCESSFUL_TESTS=$((SUCCESSFUL_TESTS + 1))
    else
        echo "   ❌ Failed - Status: $http_code (${duration}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Truncate and show response
    if [ ${#response_body} -gt 100 ]; then
        echo "   📄 Response: ${response_body:0:100}..."
    else
        echo "   📄 Response: $response_body"
    fi
    
    echo ""
    sleep 0.5  # Short wait for rate limiting
}

echo "🧪 Starting Endpoint Tests..."
echo ""

# Main endpoints
test_endpoint "GET" "/" "Homepage"
test_endpoint "GET" "/api/users" "List all users"
test_endpoint "GET" "/api/users/1" "Get user with ID=1"
test_endpoint "POST" "/api/users" "Create new user" '{"name":"Test User","email":"test@example.com","username":"testuser"}'

# Test endpoints
test_endpoint "GET" "/api/error" "Error test"
test_endpoint "GET" "/api/slow" "Slow endpoint test"
test_endpoint "POST" "/api/import-users" "Import users"

# Axios test endpoints
test_endpoint "GET" "/api/axios-test" "Axios outgoing requests test"
test_endpoint "GET" "/api/mixed-clients-test" "Mixed HTTP clients test (fetch + axios)"

# Telescope endpoints
test_endpoint "GET" "/telescope" "Telescope Dashboard"
test_endpoint "GET" "/telescope/api/stats" "Telescope Stats API"
test_endpoint "GET" "/telescope/api/entries" "Telescope Entries API"

echo "=================================================="
echo "🏁 Test Results"
echo "=================================================="
echo "📊 Total Tests: $TOTAL_TESTS"
echo "✅ Successful: $SUCCESSFUL_TESTS"
echo "❌ Failed: $FAILED_TESTS"
echo "📈 Success Rate: $(( (SUCCESSFUL_TESTS * 100) / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed!"
    echo "🔭 Check Telescope Dashboard: $BASE_URL/telescope"
else
    echo "⚠️  Some tests failed. Check the logs."
fi

echo ""
echo "💡 Tip: To see outgoing requests in Telescope Dashboard:"
echo "   $BASE_URL/telescope"
echo ""