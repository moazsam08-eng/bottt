# Moaz Studio Moderation Bot & Dashboard

![Moaz Moderation Bot](https://github.com/moazsam08-eng/moazzzzz)

[![Discord](https://img.shields.io/discord/1271538957728874497?color=5865F2&logo=discord&logoColor=white&label=Join%20Our%20Discord&style=for-the-badge)](https://discord.gg/z82w57MzUC)

[![GitHub Stars](https://img.shields.io/github/stars/moazsam08-eng/moderation-bot?color=FFD700&label=Star%20on%20GitHub&logo=github&style=for-the-badge)](https://github.com/moazsam08-eng/moderation-bot/stargazers)

[![Latest Release](https://img.shields.io/github/v/release/moazsam08-eng/moderation-bot?color=57C752&label=Latest%20Release&logo=github&style=for-the-badge)](https://github.com/moazsam08-eng/moderation-bot/releases)

[![GitHub All Releases](https://img.shields.io/github/downloads/moazsam08-eng/moderation-bot/total?color=blue&label=Downloads&logo=github&style=for-the-badge)](https://github.com/moazsam08-eng/moderation-bot/releases)

[![YouTube Subscribers](https://img.shields.io/youtube/channel/subscribers/UCJzH5Ua9rWW-uUYzWh-jjQg?label=YouTube%20Subscribers&logo=youtube&color=FF0000&style=for-the-badge)](https://www.youtube.com/channel/UCJzH5Ua9rWW-uUYzWh-jjQg)



A powerful and comprehensive Discord moderation bot built with TypeScript and Discord.js v14, featuring an advanced web dashboard, extensive protection systems, and customizable moderation tools. Perfect for servers of all sizes looking for robust security and management features.

**Technologies:** `TypeScript` | `Discord.js v14` | `Express` | `MongoDB` | `EJS`

---

## 📑 Table of Contents

- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Configuration](#-configuration) 
- [Protection System](#-protection-system)
- [Logging System](#-logging-system)
- [Command Reference](#-command-reference)
- [Dashboard Features](#-dashboard-features)
- [Advanced Features](#-advanced-features)
- [Localization](#-localization)
- [Upcoming Features](#-upcoming-features)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Credits](#-credits)
- [Contact & Support](#-contact--support)

---

## ✨ Features

### 📊 Web Dashboard

The bot includes a modern, responsive web dashboard that allows server administrators to control every aspect of the bot without needing to use commands:

- **Real-time Statistics**: View server activity, member growth, and command usage statistics
- **Role Management**: Configure automated role assignments and management
- **Protection Controls**: Fine-tune all security systems with an intuitive interface
- **Command Customization**: Enable/disable commands and configure permissions
- **Visual Customization**: Light/Dark mode toggle and responsive design
- **Multi-language Support**: Full support for English and Arabic interfaces
- **Mobile-Friendly**: Access and manage your bot from any device

### 🛡️ Advanced Protection Systems

The protection system is a core feature designed to prevent malicious activities and server raids:

- **Anti-Spam Protection**: 
  - Prevents message flooding and repeated content
  - Configurable message limits and time windows
  - Detects and stops duplicate message spam
  - Channel-specific exceptions

- **Anti-Bot Protection**: 
  - Controls bot additions to your server
  - Whitelist trusted bots
  - Automatic action against unauthorized bot invites

- **Server Protection**: 
  - Prevents unauthorized server setting changes
  - Monitors server update frequency
  - Preserves server integrity during raids

- **Role Protection**: 
  - Monitors role creation, deletion, and updates
  - Prevents mass role assignment/removal
  - Tracks role permission changes
  - Configurable action thresholds and time windows

- **Channel Protection**: 
  - Prevents mass channel creation or deletion
  - Monitors channel permission changes
  - Preserves channel structure during raids

- **Timeout Protection**: 
  - Controls mass timeout actions
  - Prevents abuse of timeout features
  - Configurable timeout limits

- **Moderation Protection**: 
  - Monitors kick/ban activity
  - Prevents mass member removals
  - Configurable thresholds to allow legitimate moderation

Each protection module can be:
- Individually enabled/disabled
- Configured with custom thresholds and time windows
- Set to take specific actions (timeout, kick, ban, role removal)
- Exempt specific roles from restrictions

### 📝 Extensive Logging

Keep track of all activities on your server with detailed, customizable logging:

- **Message Logs**:
  - Message edits with before/after content
  - Message deletions with content recovery
  - Bulk message deletions with archive generation

- **Member Logs**:
  - Join/leave events with account age information
  - Ban/unban actions with reason tracking
  - Kick events with responsible moderator
  - Timeout/untimeout events with duration

- **Role Logs**:
  - Role creation/deletion tracking
  - Role updates with permission change detection
  - Role assignments with target members
  - Mass role changes detection

- **Channel Logs**:
  - Channel creation/deletion events
  - Permission overwrite changes
  - Channel setting modifications
  - Thread-related events

- **Voice Logs**:
  - Voice channel join/leave tracking
  - User moves between channels
  - Server mute/deafen actions
  - Voice status changes

- **Server Logs**:
  - Server setting changes
  - Emoji and sticker modifications
  - Invite creation events
  - AFK channel updates

- **Additional Logs**:
  - Nickname changes
  - Avatar updates
  - Boost events
  - Integration changes

Each log type can be sent to a designated channel with:
- Customizable embed colors
- Detailed information about the events
- Responsible user tracking when available
- Timestamped entries for audit purposes

### 🎫 Ticket System

A comprehensive ticket system for handling user inquiries and support requests:

- Multiple ticket categories for different types of support
- Staff-only commands for ticket management
- Automatic HTML transcript generation when tickets are closed
- Ticket claiming system for staff coordination
- Custom permission settings for each ticket category
- Ticket archiving and regeneration capabilities

### 📕 Rules Manager

Create and manage server rules with an interactive interface:

- Multiple rule sections with collapsible categories
- Rich text formatting for clear rule presentation
- Rules acceptance tracking and verification
- Custom rule images and icons
- Automatic role assignment on rule acceptance
- Rule updates with notification capabilities

### 🎮 Temporary Voice Channels

Allow users to create and manage their own temporary voice channels:

- Customizable channel name templates with variables
- Creator-based permissions for channel management
- Automatic channel deletion when empty
- User limit settings and permission controls
- Multiple channel allowance options
- Channel activity tracking

### 🎁 Giveaway System

Host and manage giveaways with advanced features:

- Multiple winner support with customizable winner count
- Flexible duration settings from minutes to months
- Entry requirement options
- Automatic winner selection and announcements
- Reroll capability for inactive winners
- Giveaway statistics and participation tracking

### 💬 Auto Reply System

Set up automatic responses to messages based on triggers:

- Keyword and phrase-based triggers
- Regular expression support for advanced pattern matching
- Custom response messages with variable support
- Channel-specific auto-replies
- Response cooldowns to prevent spam
- Role-based restrictions for triggers

### 💡 Suggestions System

Allow members to submit and vote on suggestions:

- Dedicated suggestion channels
- Upvote/downvote system
- Staff response capabilities
- Status tracking (pending, approved, denied, implemented)
- Suggestion archiving
- Statistical tracking of popular suggestions

### 📋 Application System

Process staff applications and recruitment with an organized system:

- Customizable application forms with multiple questions
- Application review interface for staff
- Accept/reject workflow with notifications
- Application status tracking
- Response storage and review capabilities
- Role assignment upon acceptance

---

## 📋 Requirements

- **Node.js**: v18.0.0 or higher
- **MongoDB**: Database for storing settings and data
- **Discord Bot Token**: From [Discord Developer Portal](https://discord.com/developers/applications)
- **Discord Server**: With "Manage Server" permissions for the bot
- **Storage**: Approximately 100MB for the basic installation
- **RAM**: Minimum 512MB dedicated RAM recommended
- **CPU**: Single core is sufficient for small to medium servers
- **Hosting**: 24/7 hosting solution (VPS, dedicated server, or specialized hosting)

---

## 🔧 Installation

### Method 1: Using Release Build (Recommended)

1. Download the latest release from our [GitHub Releases](https://github.com/moazsam08-eng/moderation-bot/releases) page

2. Extract the files to your desired location

3. Create a `.env` file in the root directory with the following content:
   ```
   BOT_TOKEN=your_discord_bot_token
   CLIENT_ID=your_application_client_id
   MONGO_URI=your_mongodb_connection_string
   DASHBOARD_PORT=3000
   SESSION_SECRET=your_random_session_secret
   CALLBACK_URL=http://localhost:3000/auth/callback
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the bot:
   ```bash
   npm start
   ```

### Method 2: Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/moazsam08-eng/moderation-bot.git
   cd moderation-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the required environment variables (see above)

4. Build the TypeScript code:
   ```bash
   npm run build
   ```

5. Start the bot:
   ```bash
   npm start
   ```

### Docker Installation (Optional)

1. Make sure you have Docker and Docker Compose installed

2. Create a `.env` file with your configuration (as above)

3. Build and run the container:
   ```bash
   docker-compose up -d
   ```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Your Discord bot token | `MTI2OTgwOTkxODk5NTU5OTM5Mg.EXAMPLE` |
| `CLIENT_ID` | Your Discord application client ID | `1269809918995599392` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net` |
| `DASHBOARD_PORT` | Port for the web dashboard | `3000` |
| `SESSION_SECRET` | Random string for session security | `random_secret_string_here` |
| `CALLBACK_URL` | OAuth2 callback URL | `http://localhost:3000/auth/callback` |

---

## ⚙️ Configuration

### Dashboard Configuration

The easiest way to configure the bot is through the web dashboard:

1. Start the bot using `npm start`
2. Navigate to `http://localhost:3000` in your web browser (or your custom domain)
3. Log in with your Discord account (you must have admin permissions in your server)
4. Select your server from the server list
5. Use the intuitive interface to configure all aspects of the bot

The dashboard provides access to all settings, including:
- Protection systems configuration
- Logging channel setup
- Command permissions
- Feature toggles
- Role management
- Language preferences
- Ticket system settings
- Giveaway options
- Automod configuration

### Manual Configuration (Advanced)

For advanced users, settings can be manually edited in the `settings.json` file:

1. Stop the bot if it's running
2. Open `settings.json` in your preferred text editor
3. Modify the JSON structure as needed (make sure to maintain valid JSON format)
4. Save the file and restart the bot

The settings file is organized into sections for each feature:
- `general`: Global bot settings
- `protection`: Protection system configuration
- `logging`: Log channel settings
- `commands`: Command-specific settings
- `tickets`: Ticket system configuration
- `giveaways`: Giveaway settings
- `automod`: Automatic moderation settings
- `autorole`: Automatic role assignment
- `tempchannels`: Temporary voice channel settings
- `suggestions`: Suggestion system configuration
- `autoreply`: Auto-reply system settings

### Config Sync

The bot automatically synchronizes settings between the database and local files:
- Dashboard changes are saved to the database and synced to the local file
- Manual changes to `settings.json` are loaded at startup
- A backup of settings is created daily in the `backups` folder

---

## 🔒 Protection System

### Anti-Spam Protection

Prevents message spam by monitoring:
- Message frequency within time windows
- Duplicate message detection
- Mention spam prevention
- Server invite detection

Configurable options:
- Message limit: Maximum messages in time window (default: 5)
- Time window: Period for counting messages (default: 3s)
- Duplicate limit: Max identical messages allowed (default: 3)
- Action type: Response to violations (timeout, kick, ban, role removal)
- Ignored channels: Channels exempt from spam detection
- Ignored roles: Roles exempt from spam restrictions

### Server Protection

Monitors server setting changes to prevent unauthorized modifications:
- Server name/icon changes
- Region/verification level changes
- AFK channel modifications
- System message updates

Configurable options:
- Update limit: Max changes in time window (default: 1)
- Time window: Period for counting updates (default: 10s)
- Action type: Response to violations
- Ignored roles: Roles allowed to make changes

### Role Protection

Prevents mass role changes that could disrupt server structure:
- Role creation monitoring
- Role deletion detection
- Role update tracking
- Mass role assignment/removal prevention

Configurable options:
- Create/delete/update limits: Maximum operations in window
- Add/remove limits: Max role assignments at once
- Time window: Period for counting operations
- Action type: Response to violations
- Ignored roles: Exempt roles

### Channel Protection

Safeguards server channel structure:
- Channel creation limits
- Channel deletion prevention
- Channel update monitoring
- Permission change tracking

Configurable options:
- Create/delete/update limits: Maximum operations in window
- Time window: Period for monitoring
- Action type: Response to violations
- Ignored roles: Roles allowed to modify channels

### Anti-Bot Protection

Controls bot additions to your server:
- Unauthorized bot detection
- Bot whitelist system
- Action against unauthorized bot invites

Configurable options:
- Whitelisted bots: Approved bot IDs
- Action type: Response to unauthorized bots
- Ignored roles: Roles allowed to add bots

### Timeout Protection

Prevents abuse of Discord's timeout feature:
- Timeout action monitoring
- Untimeout tracking
- Mass timeout prevention

Configurable options:
- Timeout/untimeout limits: Max actions in window
- Time window: Monitoring period
- Action type: Response to violations
- Ignored roles: Roles exempt from restrictions

### Moderation Protection

Ensures moderation actions aren't abused:
- Kick action monitoring
- Ban action tracking
- Unban monitoring

Configurable options:
- Kick/ban/unban limits: Max actions in window
- Time window: Monitoring period
- Action type: Response to violations
- Ignored roles: Roles allowed higher limits

---

## 📜 Logging System

The logging system tracks server events and sends detailed logs to designated channels.

### Message Logs

- **Message Delete**: Records deleted messages with content, author, and channel
- **Message Edit**: Shows before/after content of edited messages
- **Bulk Delete**: Saves deleted messages to a transcript file

### Member Logs

- **Member Join**: Records new members with account creation date
- **Member Leave**: Tracks member departures
- **Member Ban**: Logs banned members with ban reason
- **Member Unban**: Records unbanned users
- **Member Kick**: Tracks kicked members with reason
- **Member Timeout**: Logs timed-out members with duration
- **Member Untimeout**: Records when timeouts are removed

### Role Logs

- **Role Create**: Tracks new role creation with settings
- **Role Delete**: Records role deletions
- **Role Update**: Logs permission and setting changes
- **Role Give**: Tracks when roles are assigned to members
- **Role Remove**: Records when roles are removed from members

### Channel Logs

- **Channel Create**: Logs creation of new channels
- **Channel Delete**: Records channel deletions
- **Channel Update**: Tracks permission and setting changes
- **Thread Create/Delete/Update**: Monitors thread activity

### Voice Logs

- **Voice Join**: Records members joining voice channels
- **Voice Leave**: Tracks members leaving voice channels
- **Voice Move**: Logs members moving between channels
- **Voice Server Mute/Deafen**: Tracks server-side audio controls

### Server Logs

- **Server Update**: Records server setting changes
- **Emoji/Sticker Create/Delete/Update**: Tracks emoji changes
- **Invite Create**: Logs new invite creations
- **Nickname Update**: Records nickname changes

### Log Customization

Each log type can be configured with:
- Enabled/disabled state
- Custom log channel for different log types
- Custom embed colors
- Condensed or detailed information
- Maximum entries per embed

---

## 🔍 Command Reference

### Moderation Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/ban` | Ban a user from the server | `/ban <user> [reason] [delete_messages]` | BAN_MEMBERS |
| `/unban` | Unban a user from the server | `/unban <user_id> [reason]` | BAN_MEMBERS |
| `/kick` | Kick a user from the server | `/kick <user> [reason]` | KICK_MEMBERS |
| `/mute` | Mute a user in voice channels | `/mute <user> [reason]` | MUTE_MEMBERS |
| `/unmute` | Unmute a user in voice channels | `/unmute <user> [reason]` | MUTE_MEMBERS |
| `/timeout` | Timeout a user for a duration | `/timeout <user> <duration> [reason]` | MODERATE_MEMBERS |
| `/rtimeout` | Remove timeout from a user | `/rtimeout <user> [reason]` | MODERATE_MEMBERS |
| `/warn` | Issue a warning to a user | `/warn <user> <reason>` | MODERATE_MEMBERS |
| `/unwarn` | Remove a warning from a user | `/unwarn <user> <warning_id>` | MODERATE_MEMBERS |
| `/warns` | View a user's warnings | `/warns <user>` | MODERATE_MEMBERS |
| `/clear` | Delete messages in a channel | `/clear <amount> [user]` | MANAGE_MESSAGES |
| `/lock` | Lock a channel, preventing messages | `/lock [channel] [reason]` | MANAGE_CHANNELS |
| `/unlock` | Unlock a previously locked channel | `/unlock [channel] [reason]` | MANAGE_CHANNELS |
| `/hide` | Hide a channel from regular users | `/hide [channel] [reason]` | MANAGE_CHANNELS |
| `/unhide` | Make a hidden channel visible again | `/unhide [channel] [reason]` | MANAGE_CHANNELS |
| `/role` | Add a role to a user | `/role <user> <role> [reason]` | MANAGE_ROLES |
| `/rrole` | Remove a role from a user | `/rrole <user> <role> [reason]` | MANAGE_ROLES |
| `/setnick` | Set a user's nickname | `/setnick <user> <nickname> [reason]` | MANAGE_NICKNAMES |
| `/move` | Move a user to another voice channel | `/move <user> <channel>` | MOVE_MEMBERS |

### Utility Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/avatar` | View a user's avatar | `/avatar [user]` | None |
| `/banner` | View a user's banner | `/banner [user]` | None |
| `/ping` | Check the bot's latency | `/ping` | None |
| `/roles` | View all server roles | `/roles` | None |
| `/server` | View server information | `/server` | None |
| `/user` | View detailed user information | `/user [user]` | None |

### Ticket Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/ticket` | Create or manage tickets | `/ticket create [reason]` | None |
| `/ticket close` | Close an active ticket | `/ticket close [reason]` | MANAGE_CHANNELS |
| `/ticket claim` | Claim a ticket for support | `/ticket claim` | MANAGE_CHANNELS |
| `/ticket transcript` | Generate ticket transcript | `/ticket transcript` | MANAGE_CHANNELS |

### Giveaway Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/giveaway` | Create a giveaway | `/giveaway create <prize> <winners> <duration>` | MANAGE_EVENTS |
| `/giveaway end` | End a giveaway early | `/giveaway end <message_id>` | MANAGE_EVENTS |
| `/giveaway reroll` | Reroll a giveaway winner | `/giveaway reroll <message_id> [winners]` | MANAGE_EVENTS |

### Rules Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/rules` | Post server rules | `/rules post [channel]` | ADMINISTRATOR |
| `/rules update` | Update the rules message | `/rules update` | ADMINISTRATOR |

### Application Commands

| Command | Description | Usage | Permissions |
|---------|-------------|-------|------------|
| `/apply` | Submit a staff application | `/apply <position>` | None |
| `/apply review` | Review pending applications | `/apply review` | ADMINISTRATOR |
| `/apply accept` | Accept an application | `/apply accept <application_id> [message]` | ADMINISTRATOR |
| `/apply reject` | Reject an application | `/apply reject <application_id> [reason]` | ADMINISTRATOR |

---

## 📊 Dashboard Features

### Home Dashboard

- Server statistics overview
- Member count and growth trends
- Command usage statistics
- Bot status and performance metrics
- Quick action buttons for common tasks
- Recent activity timeline

### Protection Panel

- Comprehensive security settings
- Visual toggle switches for each protection module
- Slider controls for limit adjustments
- Role exemption manager
- Action type selection dropdowns
- Log channel configuration

### Logging Configuration

- Visual management of all log types
- Channel selector for each log category
- Color customization for log embeds
- Toggle switches for individual log types
- Preview of log message format
- Bulk enable/disable controls

### Command Settings

- Enable/disable individual commands
- Permission configuration per command
- Cooldown settings adjustment
- Command alias management
- Channel restriction options
- Role-based permission settings

### Ticket System Panel

- Ticket category creation and management
- Permission settings for ticket access
- Support team role configuration
- Custom ticket opening messages
- Transcript settings and storage options
- Ticket status tracking and filtering

### Rules Manager

- Rule section creation and ordering
- Rich text editor for rule content
- Rule acceptance tracking
- Role assignment settings for verification
- Visual customization of rule displays
- Rule update notifications

### Temp Channels Control

- Template configuration for channel names
- Permission settings for creators
- User limit adjustments
- Category selection for channel creation
- Auto-deletion timer settings
- Stats for active temporary channels

### Giveaway Center

- Giveaway creation and management
- Winner count and prize configuration
- Duration setting with visual calendar
- Requirement options for participation
- Active giveaway monitoring
- Historical giveaway archive

### Auto Reply Manager

- Trigger creation and management
- Regular expression support
- Response message configuration
- Channel restriction settings
- Cooldown adjustments
- Role permission management

### Suggestions Setup

- Suggestion channel configuration
- Voting emoji customization
- Staff response settings
- Status tracking options
- Notification settings for updates
- Statistical tracking configuration

### Application System

- Form creation with custom questions
- Position/role configuration
- Review process customization
- Acceptance/rejection templates
- Role assignment automation
- Application status tracking

### Settings Panel

- Global bot configuration
- Language preference selection
- Theme customization
- Prefix settings
- Default role configuration
- API key management for integrations

---

## 🧩 Advanced Features

### Ticket System

The ticket system provides a structured way for users to get support:

- **Ticket Categories**: Create different categories for various support needs (general help, bug reports, purchases, etc.)
- **Custom Forms**: Add custom questions for users when creating tickets
- **Staff Controls**: Claim, transfer, and manage active tickets
- **Transcripts**: Generate HTML transcripts of ticket conversations for record-keeping
- **User Limits**: Configurable limits on how many active tickets a user can have
- **Auto-close**: Automatically close inactive tickets after a configurable period
- **Private Channels**: Each ticket creates a private channel visible only to staff and the creator
- **Tag System**: Apply tags to tickets for better organization and filtering

### Rules Manager

Create and maintain server rules with ease:

- **Section Management**: Organize rules into logical sections and categories
- **Rich Formatting**: Use markdown and rich text to create clear, readable rules
- **Rule Agreement**: Implement verification systems requiring rule acceptance
- **Role Gating**: Assign roles automatically when users agree to rules
- **Version Tracking**: Keep track of rule updates and notify users of changes
- **Visual Customization**: Add custom icons, colors, and formatting to rules
- **Multilingual Support**: Create rules in multiple languages

### Temporary Voice Channels

Give users the ability to create and manage temporary voice channels:

- **Creator Controls**: Channel creators receive permissions to manage their channel
- **Name Templates**: Use variables like `{user}`, `{count}`, or custom text in channel names
- **Permission Templates**: Set default permissions for created channels
- **User Limits**: Allow creators to set custom user limits for their channels
- **Auto-deletion**: Channels automatically delete when empty (configurable delay)
- **Multiple Channels**: Option to allow users to create multiple temp channels
- **Category Selection**: Choose which category temp channels are created in
- **Stats Tracking**: Track usage statistics for temporary channels

### Giveaway System

Host engaging giveaways with advanced features:

- **Multiple Winners**: Support for selecting multiple winners for a single prize
- **Flexible Duration**: Set giveaways from minutes to months with precise control
- **Entry Requirements**: Optional role requirements for participation
- **Winner Announcement**: Customizable winner announcements with mentions
- **Reroll Capability**: Easily reroll winners if needed
- **Participation Stats**: Track how many members joined each giveaway
- **Giveaway History**: Keep records of past giveaways
- **Automatic End**: Giveaways automatically end and select winners at the specified time

### Auto Reply System

Create automated responses to messages matching specific triggers:

- **Keyword Triggers**: Set up replies based on specific words or phrases
- **Regex Support**: Use regular expressions for advanced pattern matching
- **Variable Support**: Include dynamic content like `{user}` or `{channel}` in responses
- **Channel Restrictions**: Limit auto-replies to specific channels
- **Role Restrictions**: Restrict who can trigger auto-replies
- **Cooldowns**: Set cooldown periods to prevent spam
- **Random Responses**: Configure multiple possible responses for variety
- **Embed Support**: Create rich embeds as auto-replies

### Suggestions System

Allow members to submit and vote on suggestions:

- **Dedicated Channels**: Automatically format suggestions in dedicated channels
- **Voting System**: Add reaction voting to submitted suggestions
- **Staff Responses**: Allow staff to provide official responses to suggestions
- **Status Tracking**: Track suggestion status (pending, approved, denied, implemented)
- **Suggestion Archiving**: Move completed suggestions to archive channels
- **Notifications**: Notify users when their suggestions receive responses
- **Statistics**: Track the most popular suggestions and voting patterns
- **Suggestion Limits**: Set limits on how many suggestions a user can submit

### Application System

Process staff applications with an organized workflow:

- **Custom Forms**: Create application forms with customizable questions
- **Position-specific Forms**: Different forms for different staff positions
- **Application Review**: Staff interface for reviewing submitted applications
- **Response Storage**: Store and review applicant responses
- **Status Tracking**: Track application status (pending, accepted, rejected)
- **Notifications**: Notify applicants of status changes
- **Role Assignment**: Automatically assign roles upon acceptance
- **Statistics**: Track application volume and acceptance rates

---

## 🗺️ Localization

The bot supports multiple languages with a comprehensive localization system:

### Currently Supported Languages

- **English** (en): Full support for all features and documentation
- **Arabic** (ar): Complete right-to-left interface support

### Language Features

- **Per-server Default**: Each server can set its own default language
- **User Preference**: Users can select their preferred language
- **RTL Support**: Full support for right-to-left languages
- **Fallback System**: Missing translations fall back to English
- **Dashboard Translation**: Complete dashboard interface translation
- **Command Responses**: All command responses are localized
- **Embeds**: All embeds and visuals respect localization

### Adding New Languages

You can add support for additional languages by:

1. Creating a new file in the `src/locales` directory (copy the English file as a template)
2. Creating a corresponding file in `dashboard/locales`
3. Translating all strings to the target language
4. Adding the language code to the supported languages list in settings

The system uses a nested structure with dot notation for accessing translations, making it easy to maintain consistency across languages.

---

## 🚀 Upcoming Features

Features planned for future releases:

### Short-Term Roadmap (Next 1-2 Months)

- **Advanced Automod**: Enhanced automatic moderation with AI-assisted content filtering
- **Custom Commands**: Create custom commands directly from the dashboard
- **Scheduled Messages**: Set up recurring or scheduled announcements
- **Reaction Roles**: Self-assignable roles through reactions
- **Voice Activities**: YouTube Together and other Discord voice activities

### Mid-Term Goals (3-6 Months)

- **Analytics Dashboard**: Advanced statistics and data visualization
- **Member Verification**: Customizable verification systems
- **Integration System**: Connect with external services and APIs
- **Economy System**: Virtual currency and economy management
- **Level System**: Track member activity and participation

### Long-Term Vision

- **API Access**: Public API for external integrations
- **Mobile App**: Companion mobile application for on-the-go management
- **AI Assistance**: Advanced AI features for content moderation and assistance
- **Multi-server Dashboard**: Manage multiple servers from one interface
- **Plugin System**: Extensible plugin architecture for community contributions

---

## 🛠️ Troubleshooting

Common issues and their solutions:

### Bot Not Responding

1. Check that the bot is online in your server member list
2. Verify that the bot has the necessary permissions
3. Ensure commands are being used in channels the bot can see
4. Check the console logs for error messages
5. Restart the bot if necessary

### Dashboard Access Issues

1. Verify that the bot is running and the dashboard is active
2. Check that your Discord account has admin permissions in the server
3. Try clearing browser cache and cookies
4. Ensure your callback URL in the .env file matches your Developer Portal settings
5. Check for any firewall or network restrictions

### Database Connection Errors

1. Verify your MongoDB connection string is correct
2. Ensure your IP address is whitelisted in MongoDB Atlas (if using cloud)
3. Check if your database user has the correct permissions
4. Try connecting to the database using MongoDB Compass to test connectivity
5. Check for any firewall rules blocking the connection

### Protection System False Positives

1. Adjust the thresholds in protection settings to be less sensitive
2. Add important roles to the ignored roles list
3. Add specific channels to ignored channels for anti-spam
4. Temporarily disable specific protection modules while making large changes
5. Check the action logs to understand what triggered the protection

### Common Error Codes

| Error | Description | Solution |
|-------|-------------|----------|
| `DISALLOWED_INTENTS` | Bot missing required gateway intents | Enable required intents in Developer Portal |
| `MISSING_PERMISSIONS` | Bot lacks necessary permissions | Check and update bot role permissions |
| `CONNECTION_ERROR` | Connection to Discord API failed | Check internet connection and try again |
| `DATABASE_ERROR` | MongoDB connection issues | Verify connection string and network |
| `DASHBOARD_ERROR` | Web dashboard problems | Check port availability and settings |

For more specific assistance, join our [support server](https://discord.gg/z82w57MzUC) or open an issue on GitHub.

---

## 🤝 Contributing

Contributions to the Moaz Moderation Bot are welcome and appreciated! Here's how you can contribute:

### Ways to Contribute

1. **Code Contributions**: Implement new features or fix bugs
2. **Documentation**: Improve or expand documentation
3. **Translations**: Add or improve language translations
4. **Bug Reports**: Submit detailed bug reports
5. **Feature Requests**: Suggest new features or improvements
6. **Testing**: Test the bot in different environments

### Contribution Process

1. Fork the repository on GitHub
2. Create a new branch for your feature or fix (`git checkout -b feature/amazing-feature`)
3. Make your changes and commit them with descriptive messages
4. Ensure your code follows the project's style guidelines
5. Add tests for new functionality if applicable
6. Update documentation to reflect your changes
7. Push your branch to your fork (`git push origin feature/amazing-feature`)
8. Submit a Pull Request against the main repository

### Development Environment Setup

1. Clone your fork of the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your development bot's credentials
4. Start the development server with `npm run dev`

### Code Standards

- Follow TypeScript best practices
- Include comments for complex logic
- Write meaningful commit messages
- Update relevant documentation
- Add tests when possible

### Issue Reports

When submitting issues, please include:
- Detailed description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable
- Bot and system versions

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

### MIT License Summary

- You can freely use, modify, and distribute this software
- You must include the original copyright notice
- The software is provided "as is" without warranty
- The authors are not liable for damages from software use

For the full license text, see the LICENSE file in the repository.

---

## 👥 Credits

### Main Development Team

- **Moaz Studio** - Project Lead & Core Development
  - [GitHub](https://github.com/moazsam08-eng)
  - [Discord](https://discord.gg/z82w57MzUC)

### Technologies Used

- **Discord.js**: The backbone of our Discord integration
- **TypeScript**: For type-safe, maintainable code
- **Express**: Powers our web dashboard
- **MongoDB**: Database storage for all settings and data
- **EJS**: Templating engine for the dashboard
- **Tailwind CSS**: Styling framework for the UI

---

## 📱 Contact & Support

### Official Links

- **Discord Server**: [Join Our Community](https://discord.gg/z82w57MzUC)
- **GitHub Repository**: [Moaz Studio](https://github.com/moazsam08-eng)
- **YouTube Channel**: [Moaz Studio](https://www.youtube.com/@moazsam08-eng)
- **Instagram**: [@mik__subhi](https://www.instagram.com/mik__subhi/)
- **Email**: [info@moazstudio.com](mailto:info@moazstudio.com)

### Getting Help

1. **Documentation**: Refer to this README and the docs page on the dashboard
2. **Discord Support**: Join our Discord server for direct assistance
3. **GitHub Issues**: Submit bugs or feature requests via GitHub issues
4. **Email Support**: Contact us directly for business inquiries

### Supporting the Project

If you find this bot useful, please consider:
- Starring the repository on GitHub
- Sharing the project with others
- Contributing code or documentation
- Providing feedback for improvements

---

Made with ❤️ by [Moaz Studio](https://github.com/moazsam08-eng)

© 2026 Moaz Studio. All rights reserved. 