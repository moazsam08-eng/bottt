import { Message, EmbedBuilder, TextChannel } from 'discord.js';
import { ModBot } from '../types/ModBot';
import { UserLevel } from '../models/UserLevel';

const cooldowns = new Map<string, number>();

export async function handleXP(message: Message, client: ModBot): Promise<void> {
    try {
        const settings = client.settings?.leveling;
        if (!settings?.enabled) return;
        if (!message.guild) return;

        const { blacklistedChannels = [], blacklistedRoles = [] } = settings;

        if (blacklistedChannels.includes(message.channelId)) return;

        const member = message.member;
        if (!member) return;
        if (blacklistedRoles.some((roleId: string) => member.roles.cache.has(roleId))) return;

        const cooldownKey = `${message.guild.id}-${message.author.id}`;
        const cooldownMs = (settings.cooldown || 10) * 1000;
        const now = Date.now();

        if (cooldowns.has(cooldownKey)) {
            const lastMsg = cooldowns.get(cooldownKey)!;
            if (now - lastMsg < cooldownMs) return;
        }
        cooldowns.set(cooldownKey, now);

        const xpGain = Math.floor(Math.random() * (settings.xpPerMessage || 16)) + 1;

        let userLevel = await UserLevel.findOne({ guildId: message.guild.id, userId: message.author.id });
        if (!userLevel) {
            userLevel = await UserLevel.create({ guildId: message.guild.id, userId: message.author.id, xp: 0, level: 0, totalXP: 0 });
        }

        userLevel.xp += xpGain;
        userLevel.totalXP += xpGain;

        const nextXP = userLevel.level * 2 * 250 + 250;

        if (userLevel.xp >= nextXP) {
            userLevel.xp = 0;
            userLevel.level += 1;

            await sendLevelUpMessage(message, client, userLevel.level);
            await assignLevelRoles(message, client, userLevel.level);
        }

        await userLevel.save();
    } catch (err) {
        console.error('Error handling XP:', err);
    }
}

async function sendLevelUpMessage(message: Message, client: ModBot, newLevel: number): Promise<void> {
    const settings = client.settings?.leveling;
    const rawMsg = (settings?.levelUpMessage || '🎉 تهانينا {member}! وصلت للمستوى **{level}**!')
        .replace(/{member}/g, `${message.member}`)
        .replace(/{level}/g, `${newLevel}`)
        .replace(/{user}/g, message.author.tag);

    const embed = new EmbedBuilder()
        .setDescription(rawMsg)
        .setColor((settings?.embed?.color || '#5865F2') as `#${string}`)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();

    try {
        const channelId = settings?.levelUpChannel;
        if (channelId) {
            const ch = message.guild?.channels.cache.get(channelId) as TextChannel | undefined;
            if (ch) { await ch.send({ embeds: [embed] }); return; }
        }
        await (message.channel as TextChannel).send({ embeds: [embed] });
    } catch {}
}

async function assignLevelRoles(message: Message, client: ModBot, newLevel: number): Promise<void> {
    const levelRoles: { level: number; roleId: string }[] = client.settings?.leveling?.levelRoles || [];
    const member = message.member;
    if (!member) return;

    for (const lr of levelRoles) {
        if (newLevel >= lr.level) {
            const role = message.guild?.roles.cache.get(lr.roleId);
            if (role && !member.roles.cache.has(lr.roleId)) {
                await member.roles.add(role).catch(() => null);
            }
        }
    }
}
