#!/bin/bash

# Configuration
URL="http://localhost:3000/api/webhooks/revenuecat"
SECRET="your_webhook_secret_here" # Change this or set process.env.REVENUECAT_WEBHOOK_SECRET
USER_ID="test-user-uuid"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

send_event() {
    local type=$1
    local entitlement=$2
    echo -e "Testing event: ${GREEN}$type${NC} for entitlement: ${GREEN}$entitlement${NC}"
    
    curl -X POST "$URL" \
    -H "Authorization: Bearer $SECRET" \
    -H "Content-Type: application/json" \
    -d "{
        \"event\": {
            \"type\": \"$type\",
            \"app_user_id\": \"$USER_ID\",
            \"entitlement_id\": \"$entitlement\",
            \"environment\": \"SANDBOX\"
        }
    }"
    echo -e "\n-----------------------------------"
}

echo "Starting RevenueCat Webhook Audit Verification..."

# 1. Test Purchase (Should grant access)
send_event "INITIAL_PURCHASE" "Kidivity -Printable Activities Pro"

# 2. Test Cancellation (Should NOT revoke access)
send_event "CANCELLATION" "Kidivity -Printable Activities Pro"

# 3. Test Expiration (Should revoke access)
send_event "EXPIRATION" "Kidivity -Printable Activities Pro"

# 4. Test Renewal (Should grant access)
send_event "RENEWAL" "Kidivity -Printable Activities Pro"

# 5. Test Invalid Entitlement (Should skip)
send_event "INITIAL_PURCHASE" "some-other-thing"

echo "Verification script completed."
