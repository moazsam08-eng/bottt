import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function envOr(key: string, fallback: string): string {
    const v = process.env[key];
    return v && v.trim().length > 0 ? v : fallback;
}

function buildCallbackUrl(): string {
    if (process.env.CALLBACK_URL && process.env.CALLBACK_URL.trim().length > 0) {
        return process.env.CALLBACK_URL;
    }
    const publicDomain =
        process.env.PUBLIC_URL ||
        process.env.RAILWAY_PUBLIC_DOMAIN ||
        process.env.RAILWAY_STATIC_URL;
    if (publicDomain) {
        const base = publicDomain.startsWith('http')
            ? publicDomain
            : `https://${publicDomain}`;
        return `${base.replace(/\/$/, '')}/auth/callback`;
    }
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}/auth/callback`;
}

const config: BotConfig = {
    token: envOr('DISCORD_TOKEN', 'TOKEN'),
    clientId: envOr('CLIENT_ID', 'ID'),
    mongoUri: envOr('MONGO_URI', 'mongodb+'),
    defaultPrefix: envOr('DEFAULT_PREFIX', '!'),
    mainGuildId: envOr('MAIN_GUILD_ID', 'ID'),
    defaultLanguage: envOr('DEFAULT_LANGUAGE', 'en'),
    dashboard: {
        port: parseInt(process.env.PORT || '3000', 10),
        secret: envOr('SESSION_SECRET', 'moazstudio'),
        callbackUrl: buildCallbackUrl()
    }
};


export interface BotConfig {
    token: string;
    clientId: string;
    mongoUri: string;
    defaultPrefix: string;
    mainGuildId: string;
    defaultLanguage: string;
    dashboard: {
        port: number;
        secret: string;
        callbackUrl: string;
    };
}

function loadSettingsFile(): any {
    let settingsPath = join(__dirname, 'settings.json');
    
    if (!existsSync(settingsPath)) {
        settingsPath = join(__dirname, '../settings.json');
        
        if (!existsSync(settingsPath)) {
            settingsPath = join(process.cwd(), 'settings.json');
            
            if (!existsSync(settingsPath)) {
                const defaultSettings = {
                    defaultLanguage: "en",
                    logs: {},
                    protection: {
                        enabled: true,
                        modules: {}
                    }
                };
                
                writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4), 'utf8');
                console.log(`Created default settings file at ${settingsPath}`);
                return defaultSettings;
            }
        }
    }
    
    try {
        console.log(`Loading settings from: ${settingsPath}`);
        const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
        return settings;
    } catch (error) {
        console.error(`Error reading settings file: ${error}`);
        throw new Error('Failed to load settings.json file');
    }
}
const settings = loadSettingsFile();

export default {
    ...config,
    ...settings,
    token: config.token,
    clientId: config.clientId,
    mongoUri: config.mongoUri,
    defaultPrefix: config.defaultPrefix,
    mainGuildId: config.mainGuildId,
    dashboard: config.dashboard
};
