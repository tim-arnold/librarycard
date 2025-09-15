# 1Password CLI Setup for LibraryCard

This guide walks you through setting up 1Password CLI integration for secure environment variable management.

## Prerequisites

- 1Password account
- 1Password desktop app installed
- 1Password CLI installed (`brew install --cask 1password-cli`)

## Step 1: Enable CLI Access in 1Password

1. **Open 1Password desktop app**
2. **Go to Settings/Preferences** → **Security**
3. **Enable "Integrate with 1Password CLI"**
4. **Enable "Touch ID for CLI access"** (recommended)

## Step 2: Sign in to 1Password CLI

### Option A: Automatic Sign-in (if 1Password app is running)
```bash
op signin
```

### Option B: Manual Sign-in (if you need to specify account)
```bash
# For 1Password.com accounts
op account add --address your-account.1password.com --email your-email@domain.com

# For family/team accounts
op account add --address your-team.1password.com --email your-email@domain.com
```

## Step 3: Verify Connection

```bash
# Check if signed in
op whoami

# List available vaults
op vault list
```

## Step 4: Create LibraryCard Vault (Optional)

You can create a dedicated vault for LibraryCard secrets:

```bash
# Create a new vault
op vault create "LibraryCard Development"

# Or use your existing vault (like "Private" or "Personal")
```

## Step 5: Test CLI Access

```bash
# Test creating a simple item
op item create --vault="Private" --title="Test Item" --tags="test"

# Test retrieving an item
op item list --vault="Private"
```

## Security Notes

- **Touch ID**: Enable Touch ID for convenient CLI access
- **Session Management**: CLI sessions expire automatically for security
- **Vault Access**: Only use vaults you have access to
- **Team Sharing**: For team development, consider using a shared vault

## Next Steps

Once you have CLI access working:
1. We'll create secret items for LibraryCard environment variables
2. Update `.env.local` to reference these secrets
3. Test the integration with the development server

## Troubleshooting

### "no account found" Error
- Make sure 1Password desktop app is running
- Enable CLI integration in 1Password settings
- Try signing in manually with `op signin`

### Permission Denied
- Check that you have access to the vault you're trying to use
- Verify your 1Password account has the necessary permissions

### Session Expired
- Run `op signin` to refresh your session
- Consider enabling Touch ID for easier authentication