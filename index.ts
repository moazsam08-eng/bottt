import { Client, GatewayIntentBits, Collection, Events, REST, Routes, AuditLogEvent, GuildMember, Partials, ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import mongoose from 'mongoose';
import config from './config';
import { SettingsWatcher } from './src/utils/settingsWatcher';
import { handleChannelCreate, handleChannelDelete, handleChannelUpdate } from './src/protection/channelProtection';
import { handleRoleCreate, handleRoleDelete, handleRoleUpdate, handleRoleAdd, handleRoleRemove } from './src/protection/roleProtection';
import { handleTimeout, handleUntimeout } from './src/protection/timeoutProtection';
import { handleKick, handleBan, handleUnban } from './src/protection/moderationProtection';
import { handleBotAdd } from './src/protection/antibotProtection';
import { handleServerUpdate } from './src/protection/serverProtection';
import { handleMessage } from './src/protection/antispamProtection';
import { handleSuggestion } from './src/suggestions/suggestionHandler';
import { handleVoiceStateUpdate } from './src/tempChannels/tempChannelHandler';
import { handleAutoReply } from './src/autoReply/autoReplyHandler';

import messageDelete from './src/logs/messageDelete';
import messageUpdate from './src/logs/messageEdit';
import roleCreate from './src/logs/roleCreate';
import roleDelete from './src/logs/roleDelete';
import roleUpdate from './src/logs/roleUpdate';
import memberJoin from './src/logs/memberJoin';
import memberLeave from './src/logs/memberLeave';
import roleGive from './src/logs/roleGive';
import roleRemove from './src/logs/roleRemove';
import messageBulkDelete from './src/logs/messageBulkDelete';
import nicknameUpdate from './src/logs/nicknameUpdate';
import serverUpdate from './src/logs/serverUpdate';
import memberBan from './src/logs/memberBan';
import memberUnban from './src/logs/memberUnban';
import memberKick from './src/logs/memberKick';
import memberTimeout from './src/logs/memberTimeout';
import memberUntimeout from './src/logs/memberUntimeout';
import emojiCreate from './src/logs/emojiCreate';
import emojiDelete from './src/logs/emojiDelete';
import emojiUpdate from './src/logs/emojiUpdate';
import stickerCreate from './src/logs/stickerCreate';
import stickerDelete from './src/logs/stickerDelete';
import stickerUpdate from './src/logs/stickerUpdate';
import threadCreate from './src/logs/threadCreate';
import threadDelete from './src/logs/threadDelete';
import threadUpdate from './src/logs/threadUpdate';
import voiceJoin from './src/logs/voiceJoin';
import voiceLeave from './src/logs/voiceLeave';
import voiceMove from './src/logs/voiceMove';
import voiceServerMute from './src/logs/voiceServerMute';
import voiceServerDeafen from './src/logs/voiceServerDeafen';
import inviteCreate from './src/logs/inviteCreate';
import channelCreate from './src/logs/channelCreate';
import channelDelete from './src/logs/channelDelete';
import channelUpdate from './src/logs/channelUpdate';
import { startTranscriptCleanup } from './src/ticket/cleanupTranscripts';
import { Dashboard } from './dashboard/server';

class ModBot extends Client {
    public commands: Collection<string, any>;
    public aliases: Collection<string, string>;
    public locales: Collection<string, any>;
    public settings: any;
    private settingsWatcher: SettingsWatcher | null = null;
    public defaultLanguage: string = 'en';
    private localeMap: { [key: string]: string } = {
        'en-US': 'en',
        'en-GB': 'en',
        'ar-SA': 'ar',
        'ar': 'ar',
        'en': 'en'
    };

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.DirectMessageReactions,
                GatewayIntentBits.DirectMessageTyping,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildModeration,
                GatewayIntentBits.GuildInvites
            ],
            partials: [Partials.Channel, Partials.Message]
        });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.locales = new Collection();
        
        const settingsPath = join(__dirname, '../settings.json');
        this.settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
        this.defaultLanguage = this.settings.defaultLanguage || 'en';
    }

    private async deployCommands(commands: any[]) {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            const rest = new REST().setToken(config.token);
            await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error deploying commands:', error);
        }
    }

    public async init() {
        try {
            await mongoose.connect(config.mongoUri);
            console.log('Connected to MongoDB');

            const localesPath = join(__dirname, 'src', 'locales');
            try {
                const localeFiles = readdirSync(localesPath);
                for (const file of localeFiles) {
                    try {
                        const localePath = join(localesPath, file);
                        const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
                        const localeName = file.split('.')[0];
                        this.locales.set(localeName, locale);
                        console.log(`Loaded locale: ${localeName}`);
                    } catch (error) {
                        console.error(`Error loading locale ${file}:`, error);
                    }
                }
                console.log('Locales loaded successfully');
            } catch (error) {
                console.error('Error accessing locales directory:', error);
                process.exit(1);
            }

            const slashCommands = [];
            const commandFolders = readdirSync(join(__dirname, 'src', 'commands'));
            
            for (const folder of commandFolders) {
                const commandFiles = readdirSync(join(__dirname, 'src', 'commands', folder));
                for (const file of commandFiles) {
                    const command = require(join(__dirname, 'src', 'commands', folder, file));
                    
                    if ('data' in command) {
                        slashCommands.push(command.data.toJSON());
                    }

                    if (command.command) {
                        this.commands.set(command.command.name, command);

                        if (command.command.aliases && Array.isArray(command.command.aliases)) {
                            command.command.aliases.forEach((alias: string) => {
                                console.log(`Registering alias: ${alias} for command: ${command.command.name}`);
                                this.aliases.set(alias, command.command.name);
                            });
                        }
                    }
                }
            }

            await this.deployCommands(slashCommands);

            this.on(Events.InteractionCreate, async interaction => {
                if (interaction.isButton()) {
                    if (interaction.customId.startsWith('apply_accept_') || interaction.customId.startsWith('apply_reject_')) {
                        try {
                            const { ApplicationManager } = await import('./src/apply/applyManager');
                            const applicationManager = new ApplicationManager(this);
                            await applicationManager.handleReview(interaction);
                        } catch (error) {
                            console.error('Error handling application review:', error);
                            await interaction.reply({
                                content: '❌ An error occurred while processing your request.',
                                ephemeral: true
                            });
                        }
                        return;
                    }
                    else if (interaction.customId.startsWith('giveaway_')) {
                        try {
                            const { handleGiveawayButton } = await import('./src/giveaway/giveawayManager');
                            await handleGiveawayButton(interaction, this);
                        } catch (error) {
                            console.error('Error handling giveaway button:', error);
                            await interaction.reply({
                                content: 'An error occurred while processing your request.',
                                ephemeral: true
                            });
                        }
                        return;
                    }
                    else if (interaction.customId.startsWith('apply_')) {
                        try {
                            const { ApplicationManager } = await import('./src/apply/applyManager');
                            const applicationManager = new ApplicationManager(this);
                            await applicationManager.handleButton(interaction);
                        } catch (error) {
                            console.error('Error handling apply button:', error);
                            await interaction.reply({
                                content: '❌ An error occurred while processing your request.',
                                ephemeral: true
                            });
                        }
                        return;
                    }
                }
                else if (interaction.isModalSubmit()) {
                    if (interaction.customId.startsWith('apply_modal_')) {
                        try {
                            const { ApplicationManager } = await import('./src/apply/applyManager');
                            const applicationManager = new ApplicationManager(this);
                            await applicationManager.handleModal(interaction);
                        } catch (error) {
                            console.error('Error handling apply modal:', error);
                            await interaction.reply({
                                content: '❌ An error occurred while processing your request.',
                                ephemeral: true
                            });
                        }
                        return;
                    }
                    else if (interaction.customId.startsWith('apply_reject_')) {
                        try {
                            const { ApplicationManager } = await import('./src/apply/applyManager');
                            const applicationManager = new ApplicationManager(this);
                            await applicationManager.handleReject(interaction);
                        } catch (error) {
                            console.error('Error handling reject modal:', error);
                            await interaction.reply({
                                content: '❌ An error occurred while processing your request.',
                                ephemeral: true
                            });
                        }
                        return;
                    }
                }

                            if ((interaction.isButton() || interaction.isStringSelectMenu()) && 
                            (interaction.customId === 'rules_select' || 
                             interaction.customId.startsWith('rules_view_'))) {
                            try {
                                const { RulesManager } = await import('./src/rules/rulesManager');
                                const rulesManager = new RulesManager(this);
                                await rulesManager.handleInteraction(
                                    interaction as ButtonInteraction | StringSelectMenuInteraction
                                );
                            } catch (error) {
                                console.error('Error handling rules interaction:', error);
                                if (interaction.isRepliable() && !interaction.replied) {
                                    await interaction.reply({
                                        content: '❌ An error occurred while viewing the rules.',
                                        ephemeral: true
                                    });
                                }
                            }
                            return;
                        }        

                if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
                    try {
                        const { TicketManager } = await import('./src/ticket/ticketManager');
                        const tm = new TicketManager(this);

                        // Panel select menu
                        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_panel_select') {
                            await tm.handlePanelSelect(interaction);
                            return;
                        }

                        // In-ticket management select menu
                        if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_manage') {
                            await tm.handleManageSelect(interaction);
                            return;
                        }

                        // Claim button
                        if (interaction.isButton() && interaction.customId.startsWith('ticket_claim_')) {
                            await tm.handleClaim(interaction);
                            return;
                        }

                        // Close button
                        if (interaction.isButton() && interaction.customId.startsWith('ticket_close_')) {
                            await tm.handleClose(interaction);
                            return;
                        }

                        // Rename modal
                        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_rename_')) {
                            await tm.handleModalRename(interaction);
                            return;
                        }

                        // Add user modal
                        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_adduser_')) {
                            await tm.handleModalAddUser(interaction);
                            return;
                        }

                        // Remove user modal
                        if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_removeuser_')) {
                            await tm.handleModalRemoveUser(interaction);
                            return;
                        }
                    } catch (error) {
                        console.error('Error handling ticket interaction:', error);
                        if (interaction.isRepliable() && !interaction.replied && !(interaction as any).deferred) {
                            await interaction.reply({ content: '❌ حدث خطأ أثناء المعالجة.', ephemeral: true }).catch(() => null);
                        }
                    }
                }

                if (!interaction.isChatInputCommand()) return;

                const command = this.commands.get(interaction.commandName);
                if (!command || !command.command.enabled) {
                    await interaction.reply({ 
                        content: 'This command is currently disabled.', 
                        ephemeral: true 
                    });
                    return;
                }

                try {
                    await command.command.execute(interaction, [], this);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
                    }
                }
            });

            this.on(Events.MessageCreate, async message => {
                if (message.author.bot) return;
                
                if (message.guild && message.member) {
                    await handleMessage(message);
                }

                await handleSuggestion(message);

                await handleAutoReply(message);

                const args = message.content.trim().split(/ +/);
                const commandName = args.shift()?.toLowerCase();

                if (!commandName) return;

                let command = this.commands.get(commandName);
                if (!command) {
                    const aliasCommand = this.aliases.get(commandName);
                    if (aliasCommand) {
                        command = this.commands.get(aliasCommand);
                    }
                }

                if (!command || !command.command.enabled) {
                    return;
                }

                if (!command.command.aliases?.includes(commandName) && message.content.startsWith(config.defaultPrefix)) {
                    return;
                }

                try {
                    if (command.command.name === 'user' && args.length > 0) {
                        const targetId = args[0].replace(/[<@!>]/g, '');
                        try {
                            const member = await message.guild?.members.fetch(targetId);
                            if (member) {
                                (message as any).targetMember = member;
                            }
                        } catch (error) {
                            console.error('Error fetching member:', error);
                        }
                    }

                    await command.command.execute(message, args, this);
                } catch (error) {
                    console.error(error);
                    await message.reply('There was an error executing that command.');
                }
            });

            this.settingsWatcher = new SettingsWatcher(this);
            this.settingsWatcher.start();

            this.on(Events.MessageDelete, messageDelete);
            this.on(Events.MessageUpdate, messageUpdate);

            this.on(Events.GuildRoleCreate, roleCreate);
            this.on(Events.GuildRoleDelete, roleDelete);
            this.on(Events.GuildRoleUpdate, roleUpdate);

            this.on(Events.ChannelCreate, (channel) => {
                if ('guild' in channel) {
                    handleChannelCreate(channel);
                    channelCreate(channel);
                }
            });

            this.on(Events.ChannelDelete, (channel) => {
                if ('guild' in channel) {
                    handleChannelDelete(channel);
                    channelDelete(channel);
                }
            });

            this.on(Events.ChannelUpdate, (oldChannel, newChannel) => {
                if ('guild' in oldChannel && 'guild' in newChannel) {
                    handleChannelUpdate(oldChannel, newChannel);
                    channelUpdate(oldChannel, newChannel);
                }
            });

            this.on(Events.GuildMemberAdd, async (member) => {
                if (member.user.bot) {
                    try {
                        const auditLogs = await member.guild.fetchAuditLogs({
                            type: AuditLogEvent.BotAdd,
                            limit: 1
                        });
                        
                        const log = auditLogs.entries.first();
                        if (log && log.executor && log.target?.id === member.id && 
                            log.createdTimestamp > Date.now() - 5000) {
                            const executor = await member.guild.members.fetch(log.executor.id);
                            await handleBotAdd(member, executor);
                        }

                        if (this.settings.autoRoles?.enabled && this.settings.autoRoles.bots?.enabled) {
                            try {
                                const botRoleIds = this.settings.autoRoles.bots.roleIds;
                                if (botRoleIds && botRoleIds.length > 0) {
                                    for (const roleId of botRoleIds) {
                                        const role = member.guild.roles.cache.get(roleId);
                                        if (role) {
                                            await member.roles.add(role, 'Auto role for bots');
                                            console.log(`Assigned auto role ${role.name} to bot ${member.user.tag}`);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Error assigning auto roles to bot:', error);
                            }
                        }
                    } catch (error) {
                        console.error('Error handling bot add protection:', error);
                    }
                } else {
                    if (this.settings.autoRoles?.enabled && this.settings.autoRoles.members?.enabled) {
                        try {
                            const memberRoleIds = this.settings.autoRoles.members.roleIds;
                            if (memberRoleIds && memberRoleIds.length > 0) {
                                for (const roleId of memberRoleIds) {
                                    const role = member.guild.roles.cache.get(roleId);
                                    if (role) {
                                        await member.roles.add(role, 'Auto role for members');
                                        console.log(`Assigned auto role ${role.name} to member ${member.user.tag}`);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Error assigning auto roles to member:', error);
                        }
                    }
                }
                await memberJoin(member);
            });

            this.on(Events.GuildMemberRemove, memberLeave);

            this.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
                if (oldMember.nickname !== newMember.nickname) {
                    await nicknameUpdate(oldMember, newMember);
                }
                
                const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
                for (const [_, role] of addedRoles) {
                    await roleGive(newMember, role);
                }

                const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
                for (const [_, role] of removedRoles) {
                    await roleRemove(newMember, role);
                }

                if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
                    if (newMember.communicationDisabledUntil) {
                        await memberTimeout(newMember, oldMember.communicationDisabledUntil, newMember.communicationDisabledUntil);
                    } else {
                        await memberUntimeout(newMember);
                    }
                }

                const wasTimedOut = !oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled();
                const wasUntimedOut = oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled();
                
                if (wasTimedOut || wasUntimedOut) {
                    try {
                        const auditLogs = await newMember.guild.fetchAuditLogs({
                            type: AuditLogEvent.MemberUpdate,
                            limit: 1
                        });

                        const log = auditLogs.entries.first();
                        if (!log || !log.executor) return;

                        const executor = await newMember.guild.members.fetch(log.executor.id);
                        
                        if (wasTimedOut) {
                            await handleTimeout(newMember, executor);
                        } else {
                            await handleUntimeout(newMember, executor);
                        }
                    } catch (error) {
                        console.error('Error handling timeout protection:', error);
                    }
                }
            });

            this.on(Events.MessageBulkDelete, messageBulkDelete);

            this.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
                await serverUpdate(oldGuild, newGuild);
                try {
                    const auditLogs = await newGuild.fetchAuditLogs({
                        type: AuditLogEvent.GuildUpdate,
                        limit: 1
                    });
                    
                    const log = auditLogs.entries.first();
                    if (log && log.executor && log.createdTimestamp > Date.now() - 5000) {
                        const executor = await newGuild.members.fetch(log.executor.id);
                        await handleServerUpdate(oldGuild, newGuild, executor);
                    }
                } catch (error) {
                    console.error('Error handling server update protection:', error);
                }
            });

            this.on(Events.GuildBanAdd, async (ban) => {
                await memberBan(ban);
                try {
                    const auditLogs = await ban.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberBanAdd,
                        limit: 1
                    });
                    
                    const log = auditLogs.entries.first();
                    if (log && log.executor && log.target?.id === ban.user.id && 
                        log.createdTimestamp > Date.now() - 5000) {
                        const executor = await ban.guild.members.fetch(log.executor.id);
                        await handleBan(ban.user, executor);
                    }
                } catch (error) {
                    console.error('Error handling ban protection:', error);
                }
            });

            this.on(Events.GuildBanRemove, async (ban) => {
                await memberUnban(ban);
                try {
                    const auditLogs = await ban.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberBanRemove,
                        limit: 1
                    });
                    
                    const log = auditLogs.entries.first();
                    if (log && log.executor && log.target?.id === ban.user.id && 
                        log.createdTimestamp > Date.now() - 5000) {
                        const executor = await ban.guild.members.fetch(log.executor.id);
                        await handleUnban(ban.user, executor);
                    }
                } catch (error) {
                    console.error('Error handling unban protection:', error);
                }
            });

            this.on(Events.GuildMemberRemove, async (member) => {
                try {
                    const auditLogs = await member.guild.fetchAuditLogs({
                        type: AuditLogEvent.MemberKick,
                        limit: 1,
                    });
                    
                    const kickLog = auditLogs.entries.first();
                    if (kickLog && kickLog.target?.id === member.id && 
                        kickLog.createdTimestamp > Date.now() - 5000) {
                        if (kickLog?.executor) {
                            const executor = await member.guild.members.fetch(kickLog.executor.id);
                            if (member.joinedAt) {
                                await memberKick(member);
                                await handleKick(member as GuildMember, executor);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking for kick:', error);
                }
            });

            this.on(Events.GuildEmojiCreate, emojiCreate);
            this.on(Events.GuildEmojiDelete, emojiDelete);
            this.on(Events.GuildEmojiUpdate, emojiUpdate);

            this.on(Events.GuildStickerCreate, stickerCreate);
            this.on(Events.GuildStickerDelete, stickerDelete);
            this.on(Events.GuildStickerUpdate, stickerUpdate);

            this.on(Events.ThreadCreate, threadCreate);
            this.on(Events.ThreadDelete, threadDelete);
            this.on(Events.ThreadUpdate, threadUpdate);

            this.on(Events.VoiceStateUpdate, (oldState, newState) => {
                voiceJoin(oldState, newState);
                voiceLeave(oldState, newState);
                voiceMove(oldState, newState);
                voiceServerMute(oldState, newState);
                voiceServerDeafen(oldState, newState);
            });

            this.on(Events.InviteCreate, inviteCreate);

            this.on(Events.GuildRoleCreate, handleRoleCreate);
            this.on(Events.GuildRoleDelete, handleRoleDelete);
            this.on(Events.GuildRoleUpdate, handleRoleUpdate);
            this.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
                const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
                const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
                
                if (addedRoles.size > 0) {
                    handleRoleAdd(newMember, addedRoles.first()!);
                }
                if (removedRoles.size > 0) {
                    handleRoleRemove(newMember, removedRoles.first()!);
                }
            });

            this.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

            await this.login(config.token);
            console.log(`Logged in as ${this.user?.tag}`);

            const dashboard = new Dashboard(this);
            dashboard.start();

            startTranscriptCleanup();

        } catch (error) {
            console.error('Error during initialization:', error);
            process.exit(1);
        }
    }

    public async destroy(): Promise<void> {
        if (this.settingsWatcher) {
            this.settingsWatcher.stop();
        }
        await super.destroy();
    }

    public getLocale(guildLocale: string): string {
        return this.localeMap[guildLocale] || this.defaultLanguage || 'en';
    }

    public reloadSettings(): void {
        try {
            const settingsPath = join(__dirname, '../settings.json');
            const newSettings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
            
            this.settings = newSettings;
            
            if (newSettings.defaultLanguage !== this.defaultLanguage) {
                this.defaultLanguage = newSettings.defaultLanguage;
            }

            this.aliases.clear();
            for (const [name, _command] of this.commands) {
                const aliases = newSettings.commands?.[name]?.aliases || [];
                for (const alias of aliases) {
                    this.aliases.set(alias, name);
                }
            }

            console.log('Settings reloaded successfully');
        } catch (error) {
            console.error('Error reloading settings:', error);
        }
    }
}

const bot = new ModBot();
bot.init();

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await bot.destroy();
    process.exit(0);
});