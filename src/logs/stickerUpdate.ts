import { Sticker, EmbedBuilder, TextChannel, ChannelType, AuditLogEvent } from 'discord.js';
import { ModBot } from '../types/ModBot';

export default async (oldSticker: Sticker, newSticker: Sticker) => {
    try {
        const client = newSticker.client as ModBot;
        const settings = client.settings;

        if (!settings.logs?.enabled || !settings.logs.stickerUpdate?.enabled) return;

        console.log('Sticker Update Event Triggered:', oldSticker.name, '->', newSticker.name); // Debug log

        const logChannelId = settings.logs.stickerUpdate.channelId;
        if (!logChannelId) return;

        const logChannel = await client.channels.fetch(logChannelId) as TextChannel;
        if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

        const locale = client.locales.get(client.defaultLanguage)?.logs?.stickerUpdate;
        if (!locale) {
            console.error(`Failed to find sticker update locale data for ${client.defaultLanguage}`);
            return;
        }

        const auditLogs = await newSticker.guild?.fetchAuditLogs({
            type: AuditLogEvent.StickerUpdate,
            limit: 1,
        });

        const updateLog = auditLogs?.entries.first();
        const executor = updateLog?.executor;

        const embed = new EmbedBuilder()
            .setTitle(locale.title)
            .setDescription(locale.description)
            .setColor(settings.logs.stickerUpdate.color as `#${string}`)
            .setThumbnail(newSticker.url)
            .addFields(
                {
                    name: `📝 ${locale.oldName}`,
                    value: oldSticker.name || locale.unknown,
                    inline: true
                },
                {
                    name: `📝 ${locale.newName}`,
                    value: newSticker.name || locale.unknown,
                    inline: true
                },
                {
                    name: `📋 ${locale.oldDescription}`,
                    value: oldSticker.description || locale.unknown,
                    inline: true
                },
                {
                    name: `📋 ${locale.newDescription}`,
                    value: newSticker.description || locale.unknown,
                    inline: true
                },
                {
                    name: `🏷️ ${locale.oldTags}`,
                    value: oldSticker.tags || locale.unknown,
                    inline: true
                },
                {
                    name: `🏷️ ${locale.newTags}`,
                    value: newSticker.tags || locale.unknown,
                    inline: true
                },
                {
                    name: `👮 ${locale.updatedBy}`,
                    value: executor ? `${executor.tag} (<@${executor.id}>)` : locale.unknown,
                    inline: true
                }
            )
            .setFooter({ text: `${locale.stickerId}: ${newSticker.id}` })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging sticker update:', error);
    }
};
