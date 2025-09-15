#!/bin/bash

# LibraryCard 1Password Secrets Setup Script
# This script creates secret items in 1Password for LibraryCard environment variables

set -e

echo "🔐 LibraryCard 1Password Secrets Setup"
echo "======================================"

# Check if 1Password CLI is available and user is signed in
if ! command -v op &> /dev/null; then
    echo "❌ 1Password CLI not found. Please install with: brew install --cask 1password-cli"
    exit 1
fi

if ! op whoami &> /dev/null; then
    echo "❌ Not signed in to 1Password. Please run: op signin"
    exit 1
fi

echo "✅ 1Password CLI is ready"

# Configuration
VAULT_NAME="LibraryCard"  # Using the dedicated LibraryCard vault
ITEM_PREFIX=""  # No prefix needed since we have a dedicated vault

echo ""
echo "🏗️  Setting up secrets in vault: $VAULT_NAME"
echo ""

# Function to create a secret item
create_secret() {
    local name="$1"
    local value="$2"
    local notes="$3"

    echo "📝 Creating secret: $name"

    # Check if item already exists
    if op item get "$name" --vault="$VAULT_NAME" &> /dev/null; then
        echo "   ℹ️  Item already exists, updating..."
        op item edit "$name" --vault="$VAULT_NAME" password="$value"
    else
        op item create \
            --vault="$VAULT_NAME" \
            --title="$name" \
            --category="API Credential" \
            --tags="librarycard,development,environment" \
            password="$value"
    fi
}

# Read existing values from .env.local
ENV_FILE_LOCAL=".env.local"
if [[ ! -f "$ENV_FILE_LOCAL" ]]; then
    echo "❌ $ENV_FILE_LOCAL not found. Please create it first."
    exit 1
fi

echo "📖 Reading existing values from $ENV_FILE_LOCAL..."

# Extract values from .env.local
EXISTING_NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_GOOGLE_PROJECT_ID=$(grep "^GOOGLE_CLOUD_PROJECT_ID=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_TURNSTILE_SITE_KEY=$(grep "^NEXT_PUBLIC_TURNSTILE_SITE_KEY=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_TURNSTILE_SECRET_KEY=$(grep "^TURNSTILE_SECRET_KEY=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_CLOUDFLARE_STAGING=$(grep "^CLOUDFLARE_API_TOKEN_STAGING_=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)
EXISTING_CLOUDFLARE_STAGING_NEW=$(grep "^CLOUDFLARE_API_TOKEN_STAGING_NEW=" "$ENV_FILE_LOCAL" | cut -d'=' -f2)

# Create secrets for sensitive environment variables
echo "Creating LibraryCard development secrets..."
echo ""

# NEXTAUTH_SECRET - Use existing value only
if [[ -n "$EXISTING_NEXTAUTH_SECRET" ]]; then
    echo "📝 Using existing NextAuth secret from .env.local"
    create_secret "NextAuth Secret" "$EXISTING_NEXTAUTH_SECRET" "NextAuth.js secret key for LibraryCard development environment"
else
    echo "⚠️  NextAuth secret not found in .env.local, skipping"
fi

# Google Client Secret - Use existing value only
if [[ -n "$EXISTING_GOOGLE_CLIENT_SECRET" ]]; then
    echo "📝 Using existing Google Client Secret from .env.local"
    create_secret "Google Client Secret" "$EXISTING_GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret for LibraryCard authentication"
else
    echo "⚠️  Google Client Secret not found in .env.local, skipping"
fi

# Google Cloud Project ID - Use existing value only
if [[ -n "$EXISTING_GOOGLE_PROJECT_ID" ]]; then
    echo "📝 Using existing Google Cloud Project ID from .env.local: $EXISTING_GOOGLE_PROJECT_ID"
    create_secret "Google Cloud Project ID" "$EXISTING_GOOGLE_PROJECT_ID" "Google Cloud Project ID for Vision API (OCR features)"
else
    echo "⚠️  Google Cloud Project ID not found in .env.local, skipping"
fi

# Turnstile keys - Use existing values only
if [[ -n "$EXISTING_TURNSTILE_SITE_KEY" ]]; then
    echo "📝 Using existing Turnstile Site Key from .env.local"
    create_secret "Turnstile Site Key" "$EXISTING_TURNSTILE_SITE_KEY" "Cloudflare Turnstile site key for CAPTCHA"
else
    echo "⚠️  Turnstile Site Key not found in .env.local, skipping"
fi

if [[ -n "$EXISTING_TURNSTILE_SECRET_KEY" ]]; then
    echo "📝 Using existing Turnstile Secret Key from .env.local"
    create_secret "Turnstile Secret Key" "$EXISTING_TURNSTILE_SECRET_KEY" "Cloudflare Turnstile secret key for CAPTCHA"
else
    echo "⚠️  Turnstile Secret Key not found in .env.local, skipping"
fi

# Cloudflare API tokens - Use existing values only
if [[ -n "$EXISTING_CLOUDFLARE_STAGING" ]]; then
    echo "📝 Using existing Cloudflare staging token from .env.local"
    create_secret "Cloudflare API Token Staging" "$EXISTING_CLOUDFLARE_STAGING" "Cloudflare API token for staging environment deployments"
else
    echo "⚠️  Cloudflare staging token not found in .env.local, skipping"
fi

if [[ -n "$EXISTING_CLOUDFLARE_STAGING_NEW" ]]; then
    echo "📝 Using existing Cloudflare staging new token from .env.local"
    create_secret "Cloudflare API Token Staging New" "$EXISTING_CLOUDFLARE_STAGING_NEW" "Cloudflare API token for new staging environment deployments"
else
    echo "⚠️  Cloudflare staging new token not found in .env.local, skipping"
fi

echo ""
echo "✅ Secret setup complete!"
echo ""
echo "📋 Created secrets in vault '$VAULT_NAME':"
echo "   • NextAuth Secret"
echo "   • Google Client ID"
echo "   • Google Client Secret"
echo "   • Google Cloud Project ID"
echo "   • Turnstile Site Key"
echo "   • Turnstile Secret Key"
echo "   • Cloudflare API Token Staging"
echo "   • Cloudflare API Token Staging New"
echo ""
echo "🔗 Next step: Update your .env.local file with 1Password references"
echo "   Run: ./scripts/update-env-with-1password.sh"