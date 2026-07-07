# Moaz Moderation Bot - Production Build

This is a compiled production build of the Moaz Moderation Bot. This directory contains everything needed to run the bot without development tools.

## Running the Bot

### On Windows:
1. Run the `start-dist.bat` file by double-clicking it
2. Or open a command prompt and run: `node index.js`

### On Linux/macOS:
1. Make the start script executable: `chmod +x start-dist.sh`
2. Run the script: `./start-dist.sh`
3. Or run the bot directly: `node index.js`

## Configuration

Make sure to update the following settings before running the bot:

1. Edit `settings.json` to include your:
   - Bot token
   - Client ID
   - MongoDB URI
   - Main Guild ID
   
## Troubleshooting

If you encounter any issues:

1. Make sure all required files are present (check config.js and index.js)
2. Verify Node.js is installed (v18.0.0 or higher)
3. Check that all dependencies in package.json are installed
4. Look for error messages in the console output

## Support

For additional help, please join our Discord server: [https://discord.gg/z82w57MzUC](https://discord.gg/z82w57MzUC)

---

© 2026 Moaz Studio. All rights reserved. 