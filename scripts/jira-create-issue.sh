#!/bin/bash

# Jira issue creation script using REST API
# Usage: ./jira-create-issue.sh "LCWEB" "Task" "Summary" "Description" [epic_key]

set -e

PROJECT=${1:-"LCWEB"}
ISSUE_TYPE=${2:-"Task"}
SUMMARY=${3:-""}
DESCRIPTION=${4:-""}
EPIC_KEY=${5:-""}

if [ -z "$SUMMARY" ]; then
    echo "Usage: $0 <project> <issue_type> <summary> [description] [epic_key]"
    echo "Example: $0 LCWEB Task 'Fix bug' 'Description of the fix'"
    echo "Example with EPIC: $0 LCWEB Task 'Fix bug' 'Description' LCWEB-124"
    echo ""
    echo "Available EPICs:"
    echo "  LCWEB-124 - Library Features"
    echo "  LCWEB-123 - Admin Features"
    echo "  LCWEB-122 - UX/UI"
    echo "  LCWEB-121 - DevOps"
    exit 1
fi

if [ -z "$JIRA_API_TOKEN" ]; then
    echo "Error: JIRA_API_TOKEN environment variable not set"
    exit 1
fi

# Jira Cloud REST API endpoint
JIRA_URL="https://tim52.atlassian.net"
API_URL="${JIRA_URL}/rest/api/3/issue"

# Create JSON payload with optional EPIC link
if [ -n "$EPIC_KEY" ]; then
    JSON_PAYLOAD=$(cat <<EOF
{
    "fields": {
        "project": {
            "key": "$PROJECT"
        },
        "summary": "$SUMMARY",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "$DESCRIPTION"
                        }
                    ]
                }
            ]
        },
        "issuetype": {
            "name": "$ISSUE_TYPE"
        },
        "parent": {
            "key": "$EPIC_KEY"
        }
    }
}
EOF
)
else
    JSON_PAYLOAD=$(cat <<EOF
{
    "fields": {
        "project": {
            "key": "$PROJECT"
        },
        "summary": "$SUMMARY",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "$DESCRIPTION"
                        }
                    ]
                }
            ]
        },
        "issuetype": {
            "name": "$ISSUE_TYPE"
        }
    }
}
EOF
)
fi

# Make API call
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Authorization: Basic $(echo -n "tim.arnold@gmail.com:$JIRA_API_TOKEN" | base64)" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD" \
    "$API_URL")

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -1 | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    ISSUE_KEY=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['key'])")
    echo "✅ Issue created successfully: $ISSUE_KEY"
    echo "🔗 $JIRA_URL/browse/$ISSUE_KEY"
    echo "$ISSUE_KEY"  # For scripting - last line is just the key
else
    echo "❌ Failed to create issue (HTTP $HTTP_CODE)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi