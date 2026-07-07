import express, { Request, Response } from 'express';
import session from 'express-session';
import path from 'path';
import { ModBot } from '../src/types/ModBot';
import config from '../config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import expressLayouts from 'express-ejs-layouts';
import { ChannelType } from 'discord.js';
import cookieParser from 'cookie-parser';
import axios from 'axios';

interface CommandSettings {
    enabled: boolean;
    aliases: string[];
    cooldown: number;
    permissions: {
        enabledRoleIds: string[];
        disabledRoleIds: string[];
    };
    [key: string]: any;
}

export class Dashboard {
    private app: express.Application;
    private locales: { [key: string]: any } = {};
    private startTime: Date;

    constructor(private client: ModBot) {
        this.app = express();
        this.startTime = new Date();
        this.loadLocales();
        this.setup();
        this.routes();
    }

    private loadLocales(): void {
        try {
            const localesPath = path.join(__dirname, 'locales');
            this.locales = {
                en: JSON.parse(readFileSync(path.join(localesPath, 'en.json'), 'utf-8')),
                ar: JSON.parse(readFileSync(path.join(localesPath, 'ar.json'), 'utf-8'))
            };
        } catch (error) {
            console.error('Error loading dashboard locales:', error);
        }
    }

    private getLocale(lang: string = 'en'): any {
        return this.locales[lang] || this.locales['en'];
    }

    private getUptime(): string {
        const now = new Date();
        const diff = now.getTime() - this.startTime.getTime();
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    private getPing(): number {
        return Math.round(this.client.ws.ping);
    }

    private getBreadcrumbs(path: string): string {
        const parts = path.split('/').filter(Boolean);
        if (parts.length === 0) return 'Dashboard';
        
        return parts.map((part, index) => {
            const isLast = index === parts.length - 1;
            const formattedPart = part.charAt(0).toUpperCase() + part.slice(1);
            return isLast ? formattedPart : `${formattedPart} /`;
        }).join(' ');
    }

    private setup(): void {
        this.app.set('view engine', 'ejs');
        this.app.set('views', path.join(__dirname, 'views'));
        
        this.app.use(expressLayouts);
        this.app.set('layout', 'layouts/main');
        this.app.set('layout extractScripts', true);
        this.app.set('layout extractStyles', true);

        this.app.use((req: Request, res: Response, next) => {
            res.locals = {
                ...res.locals,
                locale: this.getLocale(res.locals.currentLang),
                path: req.path,
                currentLang: res.locals.currentLang || 'en',
                title: 'Dashboard',
                renderPartial: (name: string) => {
                    try {
                        const partialPath = path.join(__dirname, 'views', 'partials', `${name}.ejs`);
                        return require('ejs').render(
                            require('fs').readFileSync(partialPath, 'utf8'),
                            res.locals
                        );
                    } catch (error) {
                        console.error(`Error rendering partial ${name}:`, error);
                        return `<div class="error">Error loading ${name}</div>`;
                    }
                }
            };
            next();
        });
        
        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.use((req: Request, res: Response, next) => {
            res.locals.path = req.path;
            next();
        });

        const isProduction = process.env.NODE_ENV === 'production';

        this.app.set('trust proxy', 1);
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.json());
        this.app.use(cookieParser());

        this.app.use(session({
            secret: config.dashboard.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false,
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        }));

        this.app.use((req: Request, res: Response, next) => {
            const lang = (req.query.lang as string) || 
                        req.cookies?.preferredLanguage || 
                        'en';
            
            const validLang = ['en', 'ar'].includes(lang) ? lang : 'en';
            
            res.cookie('preferredLanguage', validLang, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: false,
                path: '/',
                secure: isProduction
            });
            
            res.locals.locale = this.getLocale(validLang);
            res.locals.currentLang = validLang;
            res.setHeader('Content-Language', validLang);
            next();
        });

        this.app.use((req: Request, res: Response, next) => {
            res.locals.ping = this.getPing();
            res.locals.uptime = this.getUptime();
            res.locals.path = req.path;
            res.locals.breadcrumbs = this.getBreadcrumbs(req.path);
            next();
        });
    }

    private routes(): void {
        // ─── AUTH ────────────────────────────────────────────────────
        const OWNER_ID   = process.env.OWNER_DISCORD_ID || '';
        const DASH_PASS  = process.env.DASHBOARD_PASSWORD || 'moazstudio';

        // ─── DISCORD OAUTH2 ──────────────────────────────────────────
        const CLIENT_ID     = process.env.CLIENT_ID     || '';
        const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
        const CALLBACK_URL  = process.env.CALLBACK_URL  || 'http://localhost:3000/auth/discord/callback';
        const MANAGE_GUILD  = 0x20;

        const requireAuth = (req: Request, res: Response, next: Function) => {
            const pub = ['/login', '/auth/', '/logout', '/favicon.ico'];
            if (pub.some(p => req.path.startsWith(p)) || req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/images')) return next();
            if (!(req.session as any).authenticated) return res.redirect('/login');
            if (req.path !== '/select-server' && !(req.session as any).selectedGuildId) return res.redirect('/select-server');
            res.locals.selectedGuildId   = (req.session as any).selectedGuildId;
            res.locals.selectedGuildName = (req.session as any).selectedGuildName || 'Unknown';
            res.locals.selectedGuildIcon = (req.session as any).selectedGuildIcon || null;
            return next();
        };

        this.app.use(requireAuth);

        // ── Discord OAuth start ──
        this.app.get('/auth/discord', (req: Request, res: Response) => {
            const params = new URLSearchParams({
                client_id:     CLIENT_ID,
                redirect_uri:  CALLBACK_URL,
                response_type: 'code',
                scope:         'identify guilds',
                prompt:        'none'
            });
            return res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
        });

        // ── Discord OAuth callback ──
        this.app.get('/auth/discord/callback', async (req: Request, res: Response) => {
            const code = req.query.code as string;
            if (!code) return res.redirect('/login?error=no_code');
            try {
                // 1. Exchange code for token
                const tokenRes = await axios.post(
                    'https://discord.com/api/oauth2/token',
                    new URLSearchParams({
                        client_id:     CLIENT_ID,
                        client_secret: CLIENT_SECRET,
                        grant_type:    'authorization_code',
                        code,
                        redirect_uri:  CALLBACK_URL
                    }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
                const accessToken = tokenRes.data.access_token;

                // 2. Get user info
                const userRes = await axios.get('https://discord.com/api/users/@me', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const user = userRes.data;

                // 3. Get user guilds & filter: admin + bot present
                const guildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const userGuilds: any[] = guildsRes.data;
                const botGuilds = this.client.guilds.cache;

                const filteredGuilds = userGuilds
                    .filter((g: any) => (BigInt(g.permissions) & BigInt(MANAGE_GUILD)) !== BigInt(0) && botGuilds.has(g.id))
                    .map((g: any) => {
                        const botGuild = botGuilds.get(g.id)!;
                        return {
                            id:          g.id,
                            name:        g.name,
                            icon:        g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null,
                            memberCount: botGuild.memberCount || 0
                        };
                    });

                // 4. Store in session
                (req.session as any).authenticated  = true;
                (req.session as any).userId         = user.id;
                (req.session as any).userTag         = `${user.username}`;
                (req.session as any).userAvatar      = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null;
                (req.session as any).oauthGuilds     = filteredGuilds;
                (req.session as any).selectedGuildId = null;

                return res.redirect('/select-server');
            } catch (err: any) {
                console.error('OAuth error:', err?.response?.data || err.message);
                return res.redirect('/login?error=oauth_failed');
            }
        });

        // ── Manual login (owner fallback) ──
        this.app.get('/login', (req: Request, res: Response) => {
            if ((req.session as any).authenticated) return res.redirect('/');
            const error = req.query.error === 'oauth_failed' ? 'Discord login failed. Try manual login.' :
                          req.query.error === 'no_code'      ? 'Login cancelled.' : null;
            return res.render('login', { layout: false, error });
        });

        this.app.post('/login', (req: Request, res: Response) => {
            const { userId, password } = req.body as { userId: string; password: string };
            const validId = OWNER_ID ? userId?.trim() === OWNER_ID.trim() : true;
            const validPw = password?.trim() === DASH_PASS.trim();
            if (validId && validPw) {
                (req.session as any).authenticated  = true;
                (req.session as any).userId         = userId?.trim();
                (req.session as any).oauthGuilds    = null;
                (req.session as any).selectedGuildId = null;
                return res.redirect('/select-server');
            }
            return res.render('login', { layout: false, error: 'Invalid credentials. Please try again.' });
        });

        this.app.get('/logout', (req: Request, res: Response) => {
            req.session.destroy(() => res.redirect('/login'));
        });

        // ── Server selection ──
        this.app.get('/select-server', (req: Request, res: Response) => {
            // If logged in via Discord OAuth, show only their admin guilds
            const oauthGuilds = (req.session as any).oauthGuilds;
            const guilds = oauthGuilds ?? this.client.guilds.cache.map((g: any) => ({
                id:          g.id,
                name:        g.name,
                icon:        g.iconURL({ size: 128 }) || null,
                memberCount: g.memberCount || 0
            }));
            return res.render('server-select', {
                layout:         false,
                guilds,
                currentGuildId: (req.session as any).selectedGuildId,
                userTag:        (req.session as any).userTag || null,
                userAvatar:     (req.session as any).userAvatar || null
            });
        });

        this.app.post('/select-server', (req: Request, res: Response) => {
            const { guildId } = req.body as { guildId: string };
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return res.redirect('/select-server');
            (req.session as any).selectedGuildId   = guildId;
            (req.session as any).selectedGuildName = (guild as any).name;
            (req.session as any).selectedGuildIcon = (guild as any).iconURL({ size: 128 }) || null;
            return res.redirect('/');
        });
        // ─────────────────────────────────────────────────────────────

        this.app.get('/', async (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            try {
                const stats = await this.generateDashboardStats();

                const moduleStatus = this.getModuleStatus();
                
                const recentActivity = await this.getRecentActivity();

                const trends = {
                    servers: { percentage: 5, direction: 'up', period: 'week' },
                    users: { percentage: 12, direction: 'up', period: 'month' },
                    commands: { percentage: 8, direction: 'up', period: 'day' }
                };

                return res.render('index', {
                    title: locale.dashboard.title,
                    stats,
                    trends,
                    moduleStatus,
                    recentActivity,
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/')
                });
            } catch (error) {
                console.error('Error rendering index page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang,
                    locale
                });
            }
        });

        this.app.get('/docs', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('docs', {
                    page: 'docs',
                    title: locale.docs.title || 'Documentation',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/docs',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/docs')
                });
            } catch (error) {
                console.error('Error rendering documentation page:', error);
                return res.status(500).render('error', { 
                    page: 'error',
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en'),
                    path: '/docs'
                });
            }
        });

        this.app.get('/settings', async (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            try {
                return res.render('settings', {
                    title: locale.dashboard.settings?.title || 'Bot Settings',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/settings',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/settings')
                });
            } catch (error) {
                console.error('Error rendering settings page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang,
                    locale
                });
            }
        });

        this.app.get('/commands', (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            const categories = [
                { 
                    id: 'general',
                    name: locale.dashboard.commands.general,
                    icon: 'users',
                    color: 'blue'
                },
                {
                    id: 'moderation',
                    name: locale.dashboard.commands.moderation,
                    icon: 'shield-alt',
                    color: 'purple'
                },
                {
                    id: 'utility',
                    name: locale.dashboard.commands.utility || 'Utility',
                    icon: 'tools',
                    color: 'green'
                }
            ];
            
            res.render('command-categories', {
                title: locale.dashboard.commands.title,
                categories,
                path: '/commands',
                currentLang,
                locale,
                breadcrumbs: this.getBreadcrumbs('/commands')
            });
        });

        this.app.get('/commands/general', (req: Request, res: Response) => {
            const generalCommands = ['avatar', 'banner', 'ping', 'roles', 'server', 'user'].map(cmd => ({
                name: cmd,
                description: res.locals.locale.dashboard.commandDescriptions[cmd] || `${cmd} command`,
                enabled: this.client.settings.commands[cmd]?.enabled ?? false,
                aliases: this.client.settings.commands[cmd]?.aliases ?? [],
                cooldown: this.client.settings.commands[cmd]?.cooldown ?? 5
            }));

            res.render('commands', {
                title: res.locals.locale.dashboard.commands.general,
                page: 'general',
                commands: generalCommands,
                roles: this.client.guilds.cache.first()?.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name
                })) ?? []
            });
        });

        this.app.get('/commands/moderation', (req: Request, res: Response) => {
            const modCommands = ['ban', 'kick', 'mute', 'unmute', 'warn', 'unwarn', 'clear', 'lock', 'unlock', 'hide', 'unhide', 'move', 'timeout', 'rtimeout'].map(cmd => ({
                name: cmd,
                description: res.locals.locale.dashboard.commandDescriptions[cmd] || `${cmd} command`,
                enabled: this.client.settings.commands[cmd]?.enabled ?? false,
                aliases: this.client.settings.commands[cmd]?.aliases ?? [],
                cooldown: this.client.settings.commands[cmd]?.cooldown ?? 5
            }));

            res.render('commands', {
                title: res.locals.locale.dashboard.commands.moderation,
                page: 'moderation',
                commands: modCommands,
                roles: this.client.guilds.cache.first()?.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name
                })) ?? []
            });
        });

        this.app.get('/commands/utility', (req: Request, res: Response) => {
            const utilityCommands = ['setnick', 'role', 'rrole', 'warns', 'apply', 'ticket', 'unban'].map(cmd => ({
                name: cmd,
                description: res.locals.locale.dashboard.commandDescriptions[cmd] || `${cmd} command`,
                enabled: this.client.settings.commands[cmd]?.enabled ?? false,
                aliases: this.client.settings.commands[cmd]?.aliases ?? [],
                cooldown: this.client.settings.commands[cmd]?.cooldown ?? 5
            }));

            res.render('commands', {
                title: res.locals.locale.dashboard.commands.utility || 'Utility Commands',
                page: 'utility',
                commands: utilityCommands,
                roles: this.client.guilds.cache.first()?.roles.cache.map(role => ({
                    id: role.id,
                    name: role.name
                })) ?? []
            });
        });

        this.app.post('/api/commands/toggle', async (req: Request, res: Response): Promise<Response> => {
            try {
                const { command, enabled } = req.body;
                console.log('Toggling command:', command, enabled);

                if (!command) {
                    return res.status(400).json({ error: 'Command name is required' });
                }

                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.commands[command]) {
                    currentSettings.commands[command] = {
                        enabled: enabled,
                        aliases: [],
                        cooldown: 5,
                        permissions: {
                            enabledRoleIds: [],
                            disabledRoleIds: []
                        }
                    };
                } else {
                    currentSettings.commands[command].enabled = enabled;
                }

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                
                this.client.settings = currentSettings;

                const verifySettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                console.log('Verified settings update:', {
                    command,
                    enabled: verifySettings.commands[command].enabled,
                    fileContent: verifySettings.commands[command]
                });

                return res.json({ 
                    success: true, 
                    command, 
                    enabled,
                    settings: verifySettings.commands[command]
                });
            } catch (error) {
                console.error('Error toggling command:', error);
                return res.status(500).json({ error: 'Failed to toggle command' });
            }
        });

        this.app.get('/api/commands/:command/permissions', (req: Request, res: Response): Response | void => {
            try {
                const command = req.params.command;
                if (!this.client.settings.commands[command]) {
                    return res.status(404).json({ error: 'Command not found' });
                }

                const permissions = this.client.settings.commands[command]?.permissions ?? {
                    enabledRoleIds: [],
                    disabledRoleIds: []
                };
                
                return res.json(permissions);
            } catch (error) {
                console.error('Error getting permissions:', error);
                return res.status(500).json({ error: 'Failed to get permissions' });
            }
        });

        this.app.post('/api/commands/:command/permissions', async (req: Request, res: Response): Promise<Response | void> => {
            try {
                const { command } = req.params;
                const { enabledRoleIds, disabledRoleIds } = req.body;

                if (!this.client.settings.commands[command]) {
                    return res.status(404).json({ error: 'Command not found' });
                }

                this.client.settings.commands[command].permissions = {
                    enabledRoleIds,
                    disabledRoleIds
                };

                await this.saveSettings();
                
                return res.json({ success: true });
            } catch (error) {
                console.error('Error updating permissions:', error);
                return res.status(500).json({ error: 'Failed to update permissions' });
            }
        });

        this.app.post('/api/commands/:command/update', async (req: Request, res: Response): Promise<Response> => {
            try {
                const { command } = req.params;
                const settings = req.body;

                if (!this.client.settings.commands[command]) {
                    return res.status(404).json({ error: 'Command not found' });
                }

                this.client.settings.commands[command] = {
                    ...this.client.settings.commands[command],
                    ...settings
                };

                await this.saveSettings();
                
                return res.json({ success: true });
            } catch (error) {
                console.error('Error updating command settings:', error);
                return res.status(500).json({ error: 'Failed to update command settings' });
            }
        });

        this.app.get('/api/roles', async (req: Request, res: Response) => {
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).json({ error: 'Guild not found' });
                }

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id) // Exclude @everyone
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.color,
                        position: role.position
                    }));

                return res.json(roles);
            } catch (error) {
                console.error('Error fetching roles:', error);
                return res.status(500).json({ error: 'Failed to fetch roles' });
            }
        });

        this.app.get('/api/commands/:command/settings', async (req: Request, res: Response) => {
            try {
                const { command } = req.params;
                const settingsPath = join(process.cwd(), 'settings.json');
                const currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.commands[command]) {
                    return res.status(404).json({ error: 'Command not found' });
                }

                return res.json(currentSettings.commands[command]);
            } catch (error) {
                console.error('Error fetching command settings:', error);
                return res.status(500).json({ error: 'Failed to fetch command settings' });
            }
        });

        this.app.post('/api/commands/:command/settings', async (req: Request, res: Response) => {
            try {
                const { command } = req.params;
                const { aliases, permissions } = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.commands[command]) {
                    return res.status(404).json({ error: 'Command not found' });
                }

                currentSettings.commands[command] = {
                    ...currentSettings.commands[command],
                    aliases: aliases || [],
                    permissions: {
                        enabledRoleIds: permissions?.enabledRoleIds || [],
                        disabledRoleIds: permissions?.disabledRoleIds || []
                    }
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.commands[command]
                });
            } catch (error) {
                console.error('Error saving command settings:', error);
                return res.status(500).json({ error: 'Failed to save command settings' });
            }
        });

        this.app.get('/api/channels', async (req: Request, res: Response) => {
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).json({ error: 'Guild not found' });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === 0) // TextChannel
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name,
                        type: channel.type
                    }));

                return res.json(channels);
            } catch (error) {
                console.error('Error fetching channels:', error);
                return res.status(500).json({ error: 'Failed to fetch channels' });
            }
        });

        this.app.get('/logs', (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' },
                        currentLang,
                        locale,
                        path: '/logs'
                    });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === 0) // TextChannel
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                return res.render('logs', {
                    title: locale.dashboard.logs.title,
                    settings: this.client.settings,
                    channels,
                    path: '/logs',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/logs')
                });
            } catch (error) {
                console.error('Error rendering logs page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang,
                    locale,
                    path: '/logs'
                });
            }
        });

        this.app.post('/api/logs/update', async (req: Request, res: Response): Promise<Response> => {
            try {
                const { logType, settings } = req.body;

                if (!logType || !settings) {
                    return res.status(400).json({ error: 'Missing required parameters' });
                }

                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.logs[logType]) {
                    return res.status(404).json({ error: 'Log type not found' });
                }

                currentSettings.logs[logType] = {
                    ...currentSettings.logs[logType],
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.logs[logType]
                });
            } catch (error) {
                console.error('Error updating log settings:', error);
                return res.status(500).json({ error: 'Failed to update log settings' });
            }
        });

        this.app.get('/protection', async (req: Request, res: Response) => {
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' }
                    });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === 0) // TextChannel
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id) // Exclude @everyone
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor
                    }));

                res.render('protection', {
                    title: res.locals.locale.dashboard.protection.title,
                    settings: this.client.settings,
                    channels: channels,
                    roles: roles,
                    path: '/protection'
                });
            } catch (error) {
                console.error('Error rendering protection page:', error);
                res.status(500).render('error', {
                    title: '500 - Server Error',
                    error: { code: 500, message: 'Internal server error' }
                });
            }
        });

        this.app.post('/api/protection/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.protection = {
                    ...currentSettings.protection,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ success: true });
            } catch (error) {
                console.error('Error saving protection settings:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to save protection settings' 
                });
            }
        });

        this.app.post('/api/protection/update', async (req: Request, res: Response) => {
            try {
                const { section, settings } = req.body;
                
                if (!section || !settings) {
                    return res.status(400).json({ error: 'Missing required parameters' });
                }

                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.protection) {
                    currentSettings.protection = {};
                }
                if (!currentSettings.protection[section]) {
                    currentSettings.protection[section] = {};
                }

                currentSettings.protection[section] = {
                    ...currentSettings.protection[section],
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.protection[section]
                });
            } catch (error) {
                console.error('Error updating protection settings:', error);
                return res.status(500).json({ error: 'Failed to update protection settings' });
            }
        });

        this.app.get('/tickets', async (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' },
                        currentLang,
                        locale,
                        path: '/tickets'
                    });
                }

                await guild.channels.fetch();
                await guild.roles.fetch();

                const channels = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildText)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const categories = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildCategory)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor || '#ffffff'
                    }));

                return res.render('tickets', {
                    title: locale.dashboard.tickets.title,
                    settings: this.client.settings,
                    channels,
                    categories,
                    roles,
                    path: '/tickets',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/tickets')
                });
            } catch (error) {
                console.error('Error rendering tickets page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang,
                    locale,
                    path: '/tickets'
                });
            }
        });

        this.app.post('/api/tickets/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                if (settings.embed) {
                    if (settings.embed.thumbnail === '') settings.embed.thumbnail = null;
                    if (settings.embed.footerIcon === '') settings.embed.footerIcon = null;
                }
                
                if (settings.sections && Array.isArray(settings.sections)) {
                    settings.sections.forEach((section: any) => {
                        if (section.imageUrl === '') section.imageUrl = null;
                    });
                }
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.ticket = {
                    ...currentSettings.ticket,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.ticket
                });
            } catch (error) {
                console.error('Error saving ticket settings:', error);
                return res.status(500).json({ error: 'Failed to save ticket settings' });
            }
        });

        this.app.get('/api/tickets/:section/settings', async (req: Request, res: Response) => {
            try {
                const { section } = req.params;
                const settingsPath = join(process.cwd(), 'settings.json');
                const currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.ticket.sections[section]) {
                    return res.status(404).json({ error: 'Section not found' });
                }

                return res.json(currentSettings.ticket.sections[section]);
            } catch (error) {
                console.error('Error fetching ticket section settings:', error);
                return res.status(500).json({ error: 'Failed to fetch section settings' });
            }
        });

        this.app.post('/api/tickets/:section/settings', async (req: Request, res: Response) => {
            try {
                const { section } = req.params;
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.ticket.sections[section]) {
                    return res.status(404).json({ error: 'Section not found' });
                }

                currentSettings.ticket.sections[section] = {
                    ...currentSettings.ticket.sections[section],
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.ticket.sections[section]
                });
            } catch (error) {
                console.error('Error updating ticket section settings:', error);
                return res.status(500).json({ error: 'Failed to update section settings' });
            }
        });

        this.app.post('/api/tickets/sections/add', async (req: Request, res: Response) => {
            try {
                const newSection = req.body;
                
                if (newSection.imageUrl === '') {
                    newSection.imageUrl = null;
                }
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.ticket.sections.push(newSection);

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    section: newSection
                });
            } catch (error) {
                console.error('Error adding ticket section:', error);
                return res.status(500).json({ error: 'Failed to add ticket section' });
            }
        });

        this.app.delete('/api/tickets/sections/:index', async (req: Request, res: Response) => {
            try {
                const { index } = req.params;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.ticket.sections[index]) {
                    return res.status(404).json({ error: 'Section not found' });
                }

                currentSettings.ticket.sections.splice(parseInt(index), 1);

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ success: true });
            } catch (error) {
                console.error('Error deleting ticket section:', error);
                return res.status(500).json({ error: 'Failed to delete ticket section' });
            }
        });

        this.app.get('/apply', async (req: Request, res: Response) => {
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' }
                    });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildText)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor,
                        position: role.position
                    }));

                res.render('apply', {
                    title: res.locals.locale.dashboard.apply.title,
                    settings: this.client.settings,
                    channels,
                    roles,
                    path: '/apply'
                });
            } catch (error) {
                console.error('Error rendering apply page:', error);
                res.status(500).render('error', {
                    title: '500 - Server Error',
                    error: { code: 500, message: 'Internal server error' }
                });
            }
        });

        this.app.get('/api/apply/settings', async (req: Request, res: Response) => {
            try {
                const settingsPath = join(process.cwd(), 'settings.json');
                const currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                return res.json(currentSettings.apply || {
                    enabled: false,
                    embed: {
                        color: "#3498db",
                        thumbnail: "",
                        footer: "Powered by Moaz Studio",
                        footerIcon: "",
                        timestamp: true
                    },
                    positions: []
                });
            } catch (error) {
                console.error('Error fetching apply settings:', error);
                return res.status(500).json({ error: 'Failed to fetch apply settings' });
            }
        });

        this.app.post('/api/apply/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.apply = {
                    ...currentSettings.apply,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.apply
                });
            } catch (error) {
                console.error('Error saving apply settings:', error);
                return res.status(500).json({ error: 'Failed to save apply settings' });
            }
        });

        this.app.delete('/api/apply/positions/:index', async (req: Request, res: Response) => {
            try {
                const { index } = req.params;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.apply?.positions[index]) {
                    return res.status(404).json({ error: 'Position not found' });
                }

                currentSettings.apply.positions.splice(parseInt(index), 1);

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ success: true });
            } catch (error) {
                console.error('Error deleting position:', error);
                return res.status(500).json({ error: 'Failed to delete position' });
            }
        });

        this.app.post('/api/apply/positions/add', async (req: Request, res: Response) => {
            try {
                const newPosition = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                if (!currentSettings.apply) {
                    currentSettings.apply = {
                        enabled: false,
                        embed: {
                            color: "#3498db",
                            thumbnail: "",
                            footer: "Powered by Moaz Studio",
                            footerIcon: "",
                            timestamp: true
                        },
                        positions: []
                    };
                }

                currentSettings.apply.positions.push(newPosition);

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    position: newPosition
                });
            } catch (error) {
                console.error('Error adding position:', error);
                return res.status(500).json({ error: 'Failed to add position' });
            }
        });

        this.app.get('/rules', async (req: Request, res: Response) => {
            try {
                res.render('rules', {
                    title: res.locals.locale.dashboard.rules.title,
                    settings: this.client.settings,
                    path: '/rules',
                    script: `<script>
                        window.settings = ${JSON.stringify(this.client.settings)};
                        console.log('Settings loaded:', window.settings);
                    </script>`
                });
            } catch (error) {
                console.error('Error rendering rules page:', error);
                res.status(500).render('error', {
                    title: '500 - Server Error',
                    error: { code: 500, message: 'Internal server error' }
                });
            }
        });

        this.app.post('/api/rules/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.rules = {
                    ...currentSettings.rules,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.rules
                });
            } catch (error) {
                console.error('Error saving rules settings:', error);
                return res.status(500).json({ error: 'Failed to save rules settings' });
            }
        });

        this.app.get('/giveaway', async (req: Request, res: Response) => {
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' }
                    });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildText)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor
                    }));

                res.render('giveaway', {
                    title: res.locals.locale.dashboard.giveaway.title,
                    settings: this.client.settings,
                    channels,
                    roles,
                    path: '/giveaway'
                });
            } catch (error) {
                console.error('Error rendering giveaway page:', error);
                res.status(500).render('error', {
                    title: '500 - Server Error',
                    error: { code: 500, message: 'Internal server error' }
                });
            }
        });

        this.app.post('/api/giveaway/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.giveaway = {
                    ...currentSettings.giveaway,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.giveaway
                });
            } catch (error) {
                console.error('Error saving giveaway settings:', error);
                return res.status(500).json({ error: 'Failed to save giveaway settings' });
            }
        });

        this.app.get('/tempchannels', async (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) {
                    return res.status(404).render('error', {
                        title: '404 - Not Found',
                        error: { code: 404, message: 'Guild not found' },
                        currentLang,
                        locale,
                        path: '/tempchannels'
                    });
                }

                const channels = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildVoice)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const categories = guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildCategory)
                    .map(channel => ({
                        id: channel.id,
                        name: channel.name
                    }));

                const roles = guild.roles.cache
                    .filter(role => role.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(role => ({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor || '#ffffff'
                    }));

                return res.render('tempChannels', {
                    title: locale.dashboard.tempChannels.title,
                    settings: this.client.settings,
                    channels,
                    categories,
                    roles,
                    path: '/tempchannels',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/tempchannels')
                });
            } catch (error) {
                console.error('Error rendering temp channels page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang,
                    locale,
                    path: '/tempchannels'
                });
            }
        });

        this.app.post('/api/tempchannels/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.tempChannels = {
                    ...currentSettings.tempChannels,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.tempChannels
                });
            } catch (error) {
                console.error('Error saving temp channels settings:', error);
                return res.status(500).json({ error: 'Failed to save temp channels settings' });
            }
        });

        this.app.get('/autoreply', async (_req: Request, res: Response) => {
            try {
                const settings = JSON.parse(readFileSync(join(process.cwd(), 'settings.json'), 'utf8'));
                
                res.render('autoReply', {
                    title: res.locals.locale.dashboard.autoReply.title,
                    settings,
                    path: '/autoreply',
                    locale: res.locals.locale,
                    currentLang: res.locals.currentLang || 'en',
                    script: `<script>window.settings = ${JSON.stringify(settings)};</script>`
                });
            } catch (error) {
                console.error('Error loading auto reply page:', error);
                res.status(500).render('error', {
                    title: '500 - Server Error',
                    error: { code: 500, message: 'Internal server error' }
                });
            }
        });

        this.app.post('/api/autoreply/settings', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.autoReply = {
                    ...currentSettings.autoReply,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.autoReply
                });
            } catch (error) {
                console.error('Error saving auto reply settings:', error);
                return res.status(500).json({ error: 'Failed to save settings' });
            }
        });

        this.app.get('/suggestions', async (_req: Request, res: Response) => {
            try {
                const settings = JSON.parse(readFileSync(join(process.cwd(), 'settings.json'), 'utf-8'));
                
                res.render('suggestions', {
                    title: res.locals.locale.dashboard.suggestions.title,
                    settings,
                    path: '/suggestions',
                    locale: res.locals.locale,
                    currentLang: res.locals.currentLang
                });
            } catch (error) {
                console.error('Error loading suggestions page:', error);
                res.status(500).send('Error loading page');
            }
        });

        this.app.post('/api/settings/suggestions', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));

                currentSettings.suggestions = {
                    ...currentSettings.suggestions,
                    ...settings
                };

                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;

                return res.json({ 
                    success: true,
                    settings: currentSettings.suggestions
                });
            } catch (error) {
                console.error('Error saving suggestions settings:', error);
                return res.status(500).json({ error: 'Failed to save settings' });
            }
        });

        this.app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
            try {
                const stats = await this.generateDashboardStats();
                
                return res.json({ 
                    success: true, 
                    stats,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to fetch dashboard stats' 
                });
            }
        });

        this.app.post('/api/settings/language', async (req: Request, res: Response) => {
            try {
                const { defaultLanguage, supportedLanguages } = req.body;
                
                if (!defaultLanguage || !supportedLanguages || !Array.isArray(supportedLanguages)) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Invalid input parameters' 
                    });
                }
                
                if (supportedLanguages.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'At least one language must be supported' 
                    });
                }
                
                if (!supportedLanguages.includes(defaultLanguage)) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Default language must be included in supported languages' 
                    });
                }
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                
                currentSettings.defaultLanguage = defaultLanguage;
                currentSettings.supportedLanguages = supportedLanguages;
                
                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;
                
                return res.json({ 
                    success: true,
                    settings: {
                        defaultLanguage,
                        supportedLanguages
                    }
                });
            } catch (error) {
                console.error('Error updating language settings:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to update language settings' 
                });
            }
        });

        this.app.post('/api/settings/autoRoles', async (req: Request, res: Response) => {
            try {
                const settings = req.body;
                
                if (!settings || typeof settings.enabled !== 'boolean' || 
                    !settings.members || !settings.bots || 
                    typeof settings.members.enabled !== 'boolean' || 
                    typeof settings.bots.enabled !== 'boolean' || 
                    !Array.isArray(settings.members.roleIds) || 
                    !Array.isArray(settings.bots.roleIds)) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Invalid input parameters' 
                    });
                }
                
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                
                currentSettings.autoRoles = {
                    enabled: settings.enabled,
                    members: {
                        enabled: settings.members.enabled,
                        roleIds: settings.members.roleIds
                    },
                    bots: {
                        enabled: settings.bots.enabled,
                        roleIds: settings.bots.roleIds
                    }
                };
                
                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                
                this.client.settings = currentSettings;
                
                return res.json({ 
                    success: true,
                    settings: currentSettings.autoRoles
                });
            } catch (error) {
                console.error('Error updating auto roles settings:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to update auto roles settings' 
                });
            }
        });

        this.app.get('/api/dashboard/chart/:period', async (req: Request, res: Response) => {
            try {
                const period = req.params.period;
                let days = 30; // Default to month
                
                switch (period) {
                    case 'day':
                        days = 1;
                        break;
                    case 'week':
                        days = 7;
                        break;
                    case 'month':
                    default:
                        days = 30;
                        break;
                }
                
                const dates = Array.from({length: days}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (days - 1) + i);
                    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                });
                
                const pingData = dates.map((_, i) => {
                    let baseValue = 80; 
                    const dayVariation = Math.sin(i / 3) * 10;
                    const randomVariation = Math.floor(Math.random() * 30);
                    return Math.floor(baseValue + dayVariation + randomVariation);
                });
                
                const commandsData = dates.map((_, i) => {
                    const baseValue = 50; 
                    const trendGrowth = i * 1.5;
                    const dayOfWeek = new Date(dates[i]).getDay();
                    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 25 : 0;
                    const randomVariation = Math.floor(Math.random() * 15);
                    return Math.floor(baseValue + trendGrowth + weekendBoost + randomVariation);
                });
                
                const usersData = dates.map((_, i) => {
                    const baseValue = 300; 
                    const trendGrowth = i * 5;
                    const dayOfWeek = new Date(dates[i]).getDay();
                    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 100 : 0;
                    const randomVariation = Math.floor(Math.random() * 40);
                    return Math.floor(baseValue + trendGrowth + weekendBoost + randomVariation);
                });
                
                const formattedDates = dates.map(date => {
                    const d = new Date(date);
                    return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
                });
                
                return res.json({
                    success: true,
                    data: {
                        labels: formattedDates,
                        datasets: {
                            ping: pingData,
                            commands: commandsData,
                            users: usersData
                        }
                    },
                    period,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error generating chart data:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to generate chart data' 
                });
            }
        });

        this.app.get('/welcome', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('coming-soon', {
                    title: locale.comingSoon.features.welcomeSystem.title,
                    feature: 'welcomeSystem',
                    featureIcon: 'fas fa-hand-paper',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/welcome',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/welcome')
                });
            } catch (error) {
                console.error('Error rendering welcome system page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en')
                });
            }
        });

        this.app.get('/selectroles', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('coming-soon', {
                    title: locale.comingSoon.features.selectRoles.title,
                    feature: 'selectRoles',
                    featureIcon: 'fas fa-id-badge',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/selectroles',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/selectroles')
                });
            } catch (error) {
                console.error('Error rendering select roles page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en')
                });
            }
        });

        this.app.get('/games', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('coming-soon', {
                    title: locale.comingSoon.features.games.title,
                    feature: 'games',
                    featureIcon: 'fas fa-gamepad',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/games',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/games')
                });
            } catch (error) {
                console.error('Error rendering games page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en')
                });
            }
        });

        this.app.get('/automod', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('coming-soon', {
                    title: locale.comingSoon.features.autoMod.title,
                    feature: 'autoMod',
                    featureIcon: 'fas fa-robot',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/automod',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/automod')
                });
            } catch (error) {
                console.error('Error rendering automod page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en')
                });
            }
        });

        this.app.get('/autolines', (req: Request, res: Response) => {
            try {
                const currentLang = req.cookies?.preferredLanguage || 'en';
                const locale = this.getLocale(currentLang);
                
                return res.render('coming-soon', {
                    title: locale.comingSoon.features.autoLines.title,
                    feature: 'autoLines',
                    featureIcon: 'fas fa-align-left',
                    settings: this.client.settings,
                    client: this.client,
                    config,
                    path: '/autolines',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/autolines')
                });
            } catch (error) {
                console.error('Error rendering auto lines page:', error);
                return res.status(500).render('error', { 
                    title: 'Error',
                    error: { code: 500, message: 'Internal Server Error' },
                    currentLang: 'en',
                    locale: this.getLocale('en')
                });
            }
        });

        this.app.get('/leveling', async (req: Request, res: Response) => {
            const currentLang = req.cookies?.preferredLanguage || 'en';
            const locale = this.getLocale(currentLang);
            try {
                const guild = this.client.guilds.cache.get(this.getGuildId(req));
                if (!guild) return res.status(404).render('error', { title: '404', error: { code: 404, message: 'Guild not found' }, currentLang, locale, path: '/leveling' });

                await guild.channels.fetch();
                await guild.roles.fetch();

                const channels = guild.channels.cache
                    .filter(ch => ch.type === ChannelType.GuildText)
                    .map(ch => ({ id: ch.id, name: ch.name }));

                const roles = guild.roles.cache
                    .filter(r => r.id !== guild.id)
                    .sort((a, b) => b.position - a.position)
                    .map(r => ({ id: r.id, name: r.name }));

                return res.render('leveling', {
                    title: 'نظام المستويات',
                    settings: this.client.settings,
                    channels,
                    roles,
                    path: '/leveling',
                    currentLang,
                    locale,
                    breadcrumbs: this.getBreadcrumbs('/leveling')
                });
            } catch (error) {
                console.error('Error rendering leveling page:', error);
                return res.status(500).render('error', { title: 'Error', error: { code: 500, message: 'Internal Server Error' }, currentLang, locale, path: '/leveling' });
            }
        });

        this.app.post('/api/leveling/settings', async (req: Request, res: Response) => {
            try {
                const settingsPath = join(process.cwd(), 'settings.json');
                let currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                currentSettings.leveling = { ...currentSettings.leveling, ...req.body };
                writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 4), 'utf8');
                this.client.settings = currentSettings;
                return res.json({ success: true, settings: currentSettings.leveling });
            } catch (error) {
                console.error('Error saving leveling settings:', error);
                return res.status(500).json({ error: 'Failed to save leveling settings' });
            }
        });

        this.app.get('/api/commands/list', async (_req: Request, res: Response) => {
            try {
                const settingsPath = join(process.cwd(), 'settings.json');
                const currentSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                
                const allCommands = Object.entries(currentSettings.commands).map(([name, data]) => {
                    const commandData = data as CommandSettings;
                    return {
                        name,
                        enabled: commandData.enabled || false,
                        aliases: commandData.aliases || [],
                        cooldown: commandData.cooldown || 5,
                        permissions: commandData.permissions || { enabledRoleIds: [], disabledRoleIds: [] }
                    };
                });
                
                const generalCommands = ['avatar', 'banner', 'ping', 'roles', 'server', 'user'];
                const moderationCommands = ['ban', 'kick', 'mute', 'unmute', 'warn', 'unwarn', 'clear', 'lock', 'unlock', 'hide', 'unhide', 'move', 'timeout', 'rtimeout'];
                
                const categories = {
                    general: allCommands.filter(cmd => generalCommands.includes(cmd.name)),
                    moderation: allCommands.filter(cmd => moderationCommands.includes(cmd.name)),
                    utility: allCommands.filter(cmd => !generalCommands.includes(cmd.name) && !moderationCommands.includes(cmd.name))
                };
                
                return res.json({
                    success: true,
                    categories,
                    allCommands
                });
            } catch (error) {
                console.error('Error fetching commands list:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to fetch commands list' 
                });
            }
        });

        this.app.use((_req: Request, res: Response) => {
            res.status(404).render('error', {
                title: '404 - ' + res.locals.locale.dashboard.error['404'].title,
                error: {
                    code: 404,
                    message: res.locals.locale.dashboard.error['404'].message
                }
            });
        });
    }

    private async saveSettings(settings?: any): Promise<void> {
        try {
            const settingsPath = join(__dirname, '../settings.json');
            const settingsToSave = settings || this.client.settings;
            const settingsString = JSON.stringify(settingsToSave, null, 4);
            
            await writeFileSync(settingsPath, settingsString);
            console.log('Settings saved successfully');
            
            delete require.cache[require.resolve('../settings.json')];
            
            const savedSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
            console.log('Verified saved settings:', savedSettings.commands[Object.keys(savedSettings.commands)[0]]);

            if (settings) {
                this.client.settings = settings;
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    public start(): void {
        try {
            const port = parseInt(process.env.PORT || String(config.dashboard.port), 10);
            this.app.listen(port, '0.0.0.0', () => {
                console.log(`Dashboard running on port ${port}`);
            });
        } catch (error) {
            console.error('Failed to start dashboard:', error);
        }
    }

    private async generateDashboardStats() {
        const serverCount = this.client.guilds.cache.size;
        const memberCount = this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
        const commandCount = this.client.commands.size;
        
        const totalChannels = this.client.guilds.cache.reduce(
            (acc, guild) => acc + guild.channels.cache.size, 0
        );
        
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        
        let commandsUsed = 0;
        const commandStats = (this.client as any).commandStats;
        if (commandStats && typeof commandStats === 'object') {
            commandsUsed = Object.values(commandStats as Record<string, number>).reduce(
                (sum: number, count: number) => sum + count, 
                0
            );
        }

        const protection = this.client.settings.protection || {};
        const activeProtections = Object.keys(protection)
            .filter(k => k !== 'enabled' && protection[k]?.enabled)
            .length;
            
        const protectedRoles = protection.protectedRoles?.roles?.length || 0;
        const whitelistedBots = protection.antibot?.whitelistedBots?.length || 0;
        
        const logs = this.client.settings.logs || {};
        const logsArray = Object.values(logs) as Array<{enabled: boolean}>;
        const activeLogs = logsArray.filter(log => log.enabled).length;
        
        const uptimeSeconds = process.uptime();
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptime = days > 0 
            ? `${days}d ${hours}h ${minutes}m` 
            : hours > 0 
                ? `${hours}h ${minutes}m` 
                : `${minutes}m`;
        
        return {
            servers: serverCount,
            users: memberCount,
            commands: commandCount,
            commandsUsed,
            channels: totalChannels,
            ping: this.getPing(),
            uptime,
            memoryUsage: memoryUsageMB,
            protection: {
                activeProtections,
                protectedRoles,
                whitelistedBots,
                activeLogs
            }
        };
    }

    private getModuleStatus() {
        const settings = this.client.settings;
        
        return {
            protection: {
                enabled: settings.protection?.enabled || false,
                activeRules: Object.keys(settings.protection || {})
                    .filter(k => k !== 'enabled' && settings.protection[k]?.enabled)
                    .length
            },
            tickets: {
                enabled: settings.ticket?.enabled || false,
                sections: (settings.ticket?.sections || []).length
            },
            apply: {
                enabled: settings.apply?.enabled || false,
                positions: (settings.apply?.positions || [])
                    .filter((p: any) => p.enabled)
                    .length
            },
            rules: {
                enabled: settings.rules?.enabled || false,
                sections: (settings.rules?.sections || []).length
            },
            giveaway: {
                enabled: settings.giveaway?.enabled || false
            },
            logs: {
                enabled: Object.values(settings.logs || {}).some((log: any) => log.enabled),
                activeTypes: Object.values(settings.logs || {}).filter((log: any) => log.enabled).length
            },
            autoReply: {
                enabled: settings.autoReply?.enabled || false,
                triggers: (settings.autoReply?.triggers || []).length
            },
            tempChannels: {
                enabled: settings.tempChannels?.enabled || false
            },
            suggestions: {
                enabled: settings.suggestions?.enabled || false
            }
        };
    }

    private async getRecentActivity() {
        const now = new Date();
        
        return [
            {
                id: 'system-init',
                type: 'system',
                title: 'System Initialized',
                description: 'All systems are up and running',
                icon: 'check-circle',
                color: 'blue',
                timestamp: this.startTime,
                timeAgo: this.getRelativeTime(this.startTime)
            },
            {
                id: 'api-connected',
                type: 'connection',
                title: 'API Connected',
                description: 'Gateway connection established',
                icon: 'server',
                color: 'green',
                timestamp: new Date(now.getTime() - 10 * 60000), // 10 minutes ago
                timeAgo: '10 minutes ago'
            },
            {
                id: 'protection-active',
                type: 'protection',
                title: 'Protection Active',
                description: 'Server security systems enabled',
                icon: 'shield-alt',
                color: 'purple',
                timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
                timeAgo: '30 minutes ago'
            },
            {
                id: 'settings-updated',
                type: 'settings',
                title: 'Settings Updated',
                description: 'Configuration changes applied',
                icon: 'sync',
                color: 'amber',
                timestamp: new Date(now.getTime() - 60 * 60000), // 1 hour ago
                timeAgo: '1 hour ago'
            }
        ];
    }

    private getGuildId(req: Request): string {
        return (req.session as any)?.selectedGuildId || config.mainGuildId;
    }

    private getRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    }
} 
