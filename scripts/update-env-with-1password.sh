#!/bin/bash

# LibraryCard Environment Update Script
# This script updates .env.local to use 1Password secret references

set -e

echo "🔄 Updating .env.local with 1Password references"
echo "==============================================="

# Configuration
ENV_FILE=".env.local"
ENV_BACKUP=".env.local.backup"
VAULT_NAME="LibraryCard"  # Using the dedicated LibraryCard vault
ITEM_PREFIX=""  # No prefix needed since we have a dedicated vault

# Check if 1Password CLI is available
if ! command -v op &> /dev/null; then
    echo "❌ 1Password CLI not found. Please install with: brew install --cask 1password-cli"
    exit 1
fi

if ! op whoami &> /dev/null; then
    echo "❌ Not signed in to 1Password. Please run: op signin"
    exit 1
fi

echo "✅ 1Password CLI is ready"

# Check if .env.local exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ $ENV_FILE not found. Please create it first."
    exit 1
fi

# Create backup
echo "📋 Creating backup: $ENV_BACKUP"
cp "$ENV_FILE" "$ENV_BACKUP"

# Function to replace environment variable with 1Password reference
replace_env_var() {
    local var_name="$1"
    local secret_name="$2"

    # Check if the secret exists in 1Password
    if op item get "$secret_name" --vault="$VAULT_NAME" &> /dev/null; then
        local op_reference="op://$VAULT_NAME/$secret_name/password"
        echo "🔗 Updating $var_name to use 1Password reference"

        # Replace the line in .env.local
        if grep -q "^$var_name=" "$ENV_FILE"; then
            # Variable exists, replace it
            sed -i.tmp "s|^$var_name=.*|$var_name=\"$op_reference\"|" "$ENV_FILE"
            rm "$ENV_FILE.tmp"
        else
            # Variable doesn't exist, add it
            echo "$var_name=\"$op_reference\"" >> "$ENV_FILE"
        fi
    else
        echo "⚠️  Secret '$secret_name' not found in 1Password, skipping $var_name"
    fi
}

echo ""
echo "🔄 Updating environment variables..."

# Update sensitive variables with 1Password references
replace_env_var "NEXTAUTH_SECRET" "NextAuth Secret"
replace_env_var "GOOGLE_CLIENT_ID" "Google Client ID"
replace_env_var "GOOGLE_CLIENT_SECRET" "Google Client Secret"
replace_env_var "GOOGLE_CLOUD_PROJECT_ID" "Google Cloud Project ID"
replace_env_var "NEXT_PUBLIC_TURNSTILE_SITE_KEY" "Turnstile Site Key"
replace_env_var "TURNSTILE_SECRET_KEY" "Turnstile Secret Key"
replace_env_var "CLOUDFLARE_API_TOKEN_STAGING_" "Cloudflare API Token Staging"
replace_env_var "CLOUDFLARE_API_TOKEN_STAGING_NEW" "Cloudflare API Token Staging New"

echo ""
echo "✅ Environment file updated!"
echo ""
echo "📋 Summary:"
echo "   • Backup created: $ENV_BACKUP"
echo "   • Updated: $ENV_FILE"
echo "   • Sensitive variables now reference 1Password secrets"
echo ""
echo "🧪 Test the integration:"
echo "   • Run: op run --env-file=\".env.local\" -- env | grep -E '(NEXTAUTH_SECRET|GOOGLE_CLIENT)'"
echo "   • Start development server: op run --env-file=\".env.local\" -- npm run dev"
echo ""
echo "🔧 If something goes wrong:"
echo "   • Restore backup: cp $ENV_BACKUP $ENV_FILE"