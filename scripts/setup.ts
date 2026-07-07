import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import config from '../config';

console.log('🔧 Setting up development environment...');

const projectRoot = join(__dirname, '..');

const settingsPath = join(projectRoot, 'settings.json');
if (!existsSync(settingsPath)) {
    console.log('📝 Creating default settings.json...');
    const defaultSettings = {
        defaultLanguage: "en",
        token: config.token,
        clientId: config.clientId,
        mongoUri: config.mongoUri,
        defaultPrefix: config.defaultPrefix,
        mainGuildId: config.mainGuildId,
        logs: {},
        protection: {
            enabled: true,
            modules: {}
        },
        dashboard: {
            port: config.dashboard.port,
            secret: config.dashboard.secret,
            callbackUrl: config.dashboard.callbackUrl
        }
    };
    
    try {
        writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4), 'utf8');
        console.log('✅ Created settings.json successfully');
    } catch (error) {
        console.error('❌ Error creating settings.json:', error);
        process.exit(1);
    }
} else {
    console.log('✅ settings.json already exists');
}

const srcLocalesDir = join(projectRoot, 'src', 'locales');
if (!existsSync(srcLocalesDir)) {
    console.log('📁 Creating src/locales directory...');
    try {
        mkdirSync(srcLocalesDir, { recursive: true });
        console.log('✅ Created src/locales directory');
        
        const defaultEnLocale = { /* Default English translations */ };
        const defaultArLocale = { /* Default Arabic translations */ };
        
        writeFileSync(join(srcLocalesDir, 'en.json'), JSON.stringify(defaultEnLocale, null, 4), 'utf8');
        writeFileSync(join(srcLocalesDir, 'ar.json'), JSON.stringify(defaultArLocale, null, 4), 'utf8');
        console.log('✅ Created default locale files');
    } catch (error) {
        console.error('❌ Error creating locale directory:', error);
    }
} else {
    console.log('✅ src/locales directory exists');
}

const dashboardViewsDir = join(projectRoot, 'dashboard', 'views');
if (!existsSync(dashboardViewsDir)) {
    console.log('📁 Creating dashboard/views directory...');
    try {
        mkdirSync(dashboardViewsDir, { recursive: true });
        console.log('✅ Created dashboard/views directory');
    } catch (error) {
        console.error('❌ Error creating dashboard directory:', error);
    }
} else {
    console.log('✅ dashboard/views directory exists');
}

const dashboardLocalesDir = join(projectRoot, 'dashboard', 'locales');
if (!existsSync(dashboardLocalesDir)) {
    console.log('📁 Creating dashboard/locales directory...');
    try {
        mkdirSync(dashboardLocalesDir, { recursive: true });
        console.log('✅ Created dashboard/locales directory');
        
        const defaultEnLocale = { /* Default English translations */ };
        const defaultArLocale = { /* Default Arabic translations */ };
        
        writeFileSync(join(dashboardLocalesDir, 'en.json'), JSON.stringify(defaultEnLocale, null, 4), 'utf8');
        writeFileSync(join(dashboardLocalesDir, 'ar.json'), JSON.stringify(defaultArLocale, null, 4), 'utf8');
        console.log('✅ Created default dashboard locale files');
    } catch (error) {
        console.error('❌ Error creating dashboard locales directory:', error);
    }
} else {
    console.log('✅ dashboard/locales directory exists');
}

console.log('✨ Setup complete! You can now run the bot with npm run dev'); 