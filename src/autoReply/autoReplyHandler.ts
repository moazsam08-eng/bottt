import { Message, TextChannel, ThreadChannel, NewsChannel } from 'discord.js';
import { ModBot } from '../types/ModBot';

interface AutoReplySection {
    enabled: boolean;
    triggers: string[];
    responses: string[];
}

interface AutoReplySettings {
    enabled: boolean;
    mentionUser: boolean;
    replyToMessage: boolean;
    channels: {
        enabled: string[];
        disabled: string[];
    };
    roles: {
        enabled: string[];
        disabled: string[];
    };
    sections: {
        [key: string]: AutoReplySection;
    };
    matchType: 'exact' | 'includes' | 'startsWith' | 'endsWith' | 'regex';
    caseSensitive: boolean;
    chance: number;
    cooldown: number;
}

const cooldowns = new Map<string, { [key: string]: number }>();

export const handleAutoReply = async (message: Message): Promise<void> => {
    const client = message.client as ModBot;
    const settings = client.settings.autoReply as AutoReplySettings;
    
    try {
        if (!settings?.enabled) return;
        if (!message.guild || message.author.bot) return;
        
        if (!('send' in message.channel)) return;

        const channelId = message.channel.id;
        if (settings.channels.enabled.length > 0 && !settings.channels.enabled.includes(channelId)) {
            return;
        }
        if (settings.channels.disabled.includes(channelId)) {
            return;
        }

        if (settings.roles.enabled.length > 0 && 
            !message.member?.roles.cache.some(role => settings.roles.enabled.includes(role.id))) return;
        if (message.member?.roles.cache.some(role => settings.roles.disabled.includes(role.id))) return;

        const now = Date.now();
        const userCooldowns = cooldowns.get(message.author.id) || {};

        for (const [sectionName, section] of Object.entries(settings.sections)) {
            if (!section.enabled) continue;

            if (userCooldowns[sectionName] && 
                now - userCooldowns[sectionName] < settings.cooldown) continue;

            const matches = section.triggers.some((trigger: string) => {
                const content = settings.caseSensitive ? 
                    message.content : message.content.toLowerCase();
                const triggerText = settings.caseSensitive ? 
                    trigger : trigger.toLowerCase();

                switch (settings.matchType) {
                    case 'exact':
                        return content === triggerText;
                    case 'startsWith':
                        return content.startsWith(triggerText);
                    case 'endsWith':
                        return content.endsWith(triggerText);
                    case 'regex':
                        try {
                            return new RegExp(triggerText).test(content);
                        } catch {
                            return false;
                        }
                    case 'includes':
                    default:
                        return content.includes(triggerText);
                }
            });

            if (!matches) continue;

            if (Math.random() * 100 > settings.chance) continue;

            const response = section.responses[Math.floor(Math.random() * section.responses.length)];

            if (message.channel instanceof TextChannel || 
                message.channel instanceof ThreadChannel || 
                message.channel instanceof NewsChannel) {
                const replyOptions: any = { content: response };
                
                if (settings.replyToMessage) {
                    replyOptions.reply = { messageReference: message.id };
                } else if (settings.mentionUser) {
                    replyOptions.content = `${message.author} ${response}`;
                }

                await message.channel.send(replyOptions);

                userCooldowns[sectionName] = now;
                cooldowns.set(message.author.id, userCooldowns);

                break;
            }
        }

    } catch (error) {
        console.error('Error handling auto reply:', error);
    }
}; 
