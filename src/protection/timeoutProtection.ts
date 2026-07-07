import { GuildMember, EmbedBuilder, TextChannel, ChannelType } from 'discord.js';
import { ModBot } from '../types/ModBot';

const actionTracker = new Map<string, {
    timeouts: number;
    untimeouts: number;
    lastReset: number;
}>();

const resetCounters = (userId: string, settings: any) => {
    const now = Date.now();
    const userData = actionTracker.get(userId);
    if (userData && now - userData.lastReset >= settings.protection.timeout.limits.timeWindow) {
        actionTracker.set(userId, {
            timeouts: 0,
            untimeouts: 0,
            lastReset: now
        });
    }
};

const takeAction = async (member: GuildMember, reason: string) => {
    const client = member.client as ModBot;
    const settings = client.settings;
    const { action } = settings.protection.timeout;

    try {
        switch (action.type) {
            case 'removeRoles':
                const roles = member.roles.cache.filter(role => 
                    !action.ignoredRoles.includes(role.id)
                );
                await member.roles.remove(roles, reason);
                break;
            case 'kick':
                await member.kick(reason);
                break;
            case 'ban':
                await member.ban({ 
                    reason,
                    deleteMessageSeconds: action.duration || undefined 
                });
                break;
        }
    } catch (error) {
        console.error('Error taking protection action:', error);
    }
};

const sendProtectionLog = async (
    client: ModBot,
    member: GuildMember,
    actionType: string,
    targetMember: GuildMember,
    limitType: string,
    limit: number
) => {
    const settings = client.settings;
    try {
        if (!settings.protection?.logChannelId) return;
        
        const logChannel = member.guild.channels.cache.get(settings.protection.logChannelId) as TextChannel;
        if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

        const locale = client.locales.get(client.defaultLanguage)?.protection.timeout;
        if (!locale) return;

        const embed = new EmbedBuilder()
            .setTitle(locale.title)
            .setDescription(locale.description)
            .setColor(settings.protection.timeout.color as `#${string}`)
            .addFields([
                {
                    name: `👤 ${locale.member}`,
                    value: `${member.user.tag} (<@${member.id}>)`,
                    inline: true
                },
                {
                    name: `🎯 ${locale.targetMember}`,
                    value: `${targetMember.user.tag} (<@${targetMember.id}>)`,
                    inline: true
                },
                {
                    name: `⚡ ${locale.actionType}`,
                    value: locale.types[actionType as keyof typeof locale.types],
                    inline: true
                },
                {
                    name: `🛡️ ${locale.action}`,
                    value: locale.actions[settings.protection.timeout.action.type as keyof typeof locale.actions],
                    inline: true
                },
                {
                    name: `⏰ ${locale.timeWindow}`,
                    value: `${settings.protection.timeout.limits.timeWindow / 1000} ${locale.seconds}`,
                    inline: true
                },
                {
                    name: `📊 ${locale.limit}`,
                    value: `${locale[limitType]}: ${limit}`,
                    inline: true
                }
            ])
            .setFooter({ text: `${locale.memberId}: ${member.id}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending protection log:', error);
    }
};

export const handleTimeout = async (member: GuildMember, executor: GuildMember) => {
    const client = member.client as ModBot;
    const settings = client.settings;

    if (!settings.protection.enabled || settings.protection.timeout.enabled === false) return;

    try {
        if (executor.roles.cache.some(role => 
            settings.protection.timeout.action.ignoredRoles.includes(role.id)
        )) return;

        resetCounters(executor.id, settings);

        let userData = actionTracker.get(executor.id);
        if (!userData) {
            userData = {
                timeouts: 0,
                untimeouts: 0,
                lastReset: Date.now()
            };
            actionTracker.set(executor.id, userData);
        }

        userData.timeouts++;

        if (userData.timeouts >= settings.protection.timeout.limits.timeoutLimit) {
            await takeAction(
                executor,
                settings.protection.timeout.action.reason
            );

            await sendProtectionLog(
                client,
                executor,
                'timeout',
                member,
                'timeoutLimit',
                settings.protection.timeout.limits.timeoutLimit
            );
        }
    } catch (error) {
        console.error('Error in timeout protection:', error);
    }
};

export const handleUntimeout = async (member: GuildMember, executor: GuildMember) => {
    const client = member.client as ModBot;
    const settings = client.settings;

    if (!settings.protection.enabled || settings.protection.timeout.enabled === false) return;

    try {
        if (executor.roles.cache.some(role => 
            settings.protection.timeout.action.ignoredRoles.includes(role.id)
        )) return;

        resetCounters(executor.id, settings);

        let userData = actionTracker.get(executor.id);
        if (!userData) {
            userData = {
                timeouts: 0,
                untimeouts: 0,
                lastReset: Date.now()
            };
            actionTracker.set(executor.id, userData);
        }

        userData.untimeouts++;

        if (userData.untimeouts >= settings.protection.timeout.limits.untimeoutLimit) {
            await takeAction(
                executor,
                settings.protection.timeout.action.reason
            );

            await sendProtectionLog(
                client,
                executor,
                'untimeout',
                member,
                'untimeoutLimit',
                settings.protection.timeout.limits.untimeoutLimit
            );
        }
    } catch (error) {
        console.error('Error in untimeout protection:', error);
    }
}; 
