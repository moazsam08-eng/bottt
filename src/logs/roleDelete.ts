import { Role, EmbedBuilder, TextChannel, ChannelType, AuditLogEvent } from 'discord.js';
import { ModBot } from '../types/ModBot';

export default async (role: Role) => {
    if (!role.guild) return;

    const client = role.client as ModBot;
    const settings = client.settings;

    if (!settings.logs?.enabled || !settings.logs.roleDelete?.enabled) return;

    const logChannelId = settings.logs.roleDelete.channelId;
    if (!logChannelId) return;

    const logChannel = client.channels.cache.get(logChannelId) as TextChannel;
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const locale = client.locales.get(client.defaultLanguage)?.logs?.roleDelete;
    if (!locale) {
        console.error(`Failed to find role delete locale data for ${client.defaultLanguage}`);
        return;
    }

    try {
        const auditLogs = await role.guild.fetchAuditLogs({
            type: AuditLogEvent.RoleDelete,
            limit: 1,
        });

        const deleteLog = auditLogs.entries.first();
        const executor = deleteLog?.executor;

        const embed = new EmbedBuilder()
            .setTitle(locale.title)
            .setDescription(locale.description)
            .setColor(settings.logs.roleDelete.color as `#${string}`)
            .addFields(
                {
                    name: `📝 ${locale.name}`,
                    value: role.name,
                    inline: true
                },
                {
                    name: `👤 ${locale.deletedBy}`,
                    value: executor ? `${executor.tag} (${executor.id})` : locale.unknown,
                    inline: true
                },
                {
                    name: `🎨 ${locale.color}`,
                    value: role.hexColor,
                    inline: true
                },
                {
                    name: `📊 ${locale.position}`,
                    value: role.position.toString(),
                    inline: true
                },
                {
                    name: `🔝 ${locale.hoisted}`,
                    value: role.hoist ? locale.yes : locale.no,
                    inline: true
                },
                {
                    name: `💬 ${locale.mentionable}`,
                    value: role.mentionable ? locale.yes : locale.no,
                    inline: true
                },
                {
                    name: `🔒 ${locale.permissions}`,
                    value: `\`\`\`${role.permissions.toArray().join(', ') || 'None'}\`\`\``,
                    inline: false
                }
            )
            .setFooter({ text: `${locale.roleId}: ${role.id}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging role delete:', error);
    }
}; 
