# Configuration Guide for Moaz Moderation Bot

## Overview

This bot uses a centralized configuration approach with all settings defined in the `config.ts` file. We have removed the need for environment variables (.env files) to simplify deployment and configuration.

## Where to Configure

All configuration is handled in the following file:
```
/config.ts
```

## Required Configuration Settings

You will need to modify the following values in the config object:

```typescript
const config: BotConfig = {
    token: 'YOUR_BOT_TOKEN_HERE',
    clientId: 'YOUR_CLIENT_ID_HERE',
    mongoUri: 'YOUR_MONGODB_URI_HERE',
    defaultPrefix: '!',
    mainGuildId: 'YOUR_MAIN_GUILD_ID_HERE',
    defaultLanguage: 'en',
    dashboard: {
        port: 3000,
        secret: 'CHOOSE_A_SECURE_SECRET',
        callbackUrl: 'http://localhost:3000/auth/callback'
    }
};
```

### Important Settings

1. **token**: Your Discord bot token from the Discord Developer Portal
2. **clientId**: Your application's client ID from the Discord Developer Portal
3. **mongoUri**: Your MongoDB connection string
4. **mainGuildId**: The ID of your main Discord server
5. **dashboard.secret**: A secure string for session management (can be any random string)
6. **dashboard.callbackUrl**: OAuth2 callback URL (update for production)

## Production Settings

For production deployment, you should:

1. Update the `callbackUrl` to match your domain:
   ```typescript
   callbackUrl: 'https://yourdomain.com/auth/callback'
   ```

2. Consider using environment detection for SSL:
   ```typescript
   const isProduction = process.env.NODE_ENV === 'production';
   ```

## Settings Priority

The configuration system follows this priority order:

1. Hardcoded values in `config.ts`
2. Values from `settings.json` (if they exist)

Core configuration values (token, clientId, etc.) are protected from being overridden by settings.json.

## Setup Process

When the bot starts:

1. It first checks for `config.ts` values
2. It looks for a `settings.json` file (creates one if it doesn't exist)
3. It merges these configurations, with core values from `config.ts` taking precedence

## Making Changes

To modify configuration:

1. Edit the `config.ts` file directly
2. Run `npm run build` to compile the changes
3. Restart the bot with `npm start`

---

For additional help, please join our [Discord server](https://discord.gg/z82w57MzUC) or open an issue on our [GitHub repository](https://github.com/moazsam08-eng/moderation-bot/issues). 