import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    GuildVerificationLevel,
    GuildExplicitContentFilter,
    GuildPremiumTier,
    ChannelType
} from 'discord.js';
import settings from '../../../settings.json';
import { checkCommandPermissions } from '../../utils/permissionChecker';

const verificationEmoji: Record<number, string> = {
    [GuildVerificationLevel.None]: '🟢 لا يوجد',
    [GuildVerificationLevel.Low]: '🟡 منخفض',
    [GuildVerificationLevel.Medium]: '🟠 متوسط',
    [GuildVerificationLevel.High]: '🔴 عالي',
    [GuildVerificationLevel.VeryHigh]: '🔴🔴 عالي جداً'
};

const filterEmoji: Record<number, string> = {
    [GuildExplicitContentFilter.Disabled]: '🟢 معطّل',
    [GuildExplicitContentFilter.MembersWithoutRoles]: '🟡 بدون رتبة',
    [GuildExplicitContentFilter.AllMembers]: '🔴 الجميع'
};

const boostTier: Record<number, string> = {
    [GuildPremiumTier.None]: 'لا يوجد',
    [GuildPremiumTier.Tier1]: '🥈 المستوى 1',
    [GuildPremiumTier.Tier2]: '🥇 المستوى 2',
    [GuildPremiumTier.Tier3]: '💎 المستوى 3'
};

export const data = new SlashCommandBuilder()
    .setName('server')
    .setDescription('Shows server information');

export const command: Command = {
    name: 'server',
    aliases: (settings.commands?.server as any)?.aliases || ['serverinfo', 'si', 'guild'],
    enabled: (settings.commands?.server as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const member = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(member, (settings.commands?.server as any))) {
                const msg = '❌ ليس لديك صلاحية.';
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            if (!guild) return;

            const roles = guild.roles.cache.filter(r => r.id !== guild.id);
            const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
            const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
            const animatedEmojis = guild.emojis.cache.filter(e => !!e.animated).size;
            const staticEmojis = guild.emojis.cache.filter(e => !e.animated).size;

            const topRoles = Array.from(roles.values())
                .sort((a, b) => b.position - a.position)
                .slice(0, 5)
                .map(r => `<@&${r.id}>`)
                .join(' ');

            const rolesValue = roles.size > 5
                ? `${topRoles} **+${roles.size - 5}**`
                : topRoles || '—';

            const embed = new EmbedBuilder()
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 256 }) || undefined })
                .setTitle('🏰 معلومات السيرفر')
                .setColor(0x5865F2)
                .setThumbnail(guild.iconURL({ size: 512 }) || null)
                .setImage(guild.bannerURL({ size: 1024 }) || null)
                .addFields(
                    { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '🆔 الآيدي', value: `\`${guild.id}\``, inline: true },
                    { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '👥 الأعضاء', value: `**${guild.memberCount.toLocaleString()}** عضو`, inline: true },
                    { name: '🎭 الرتب', value: `**${roles.size}** رتبة`, inline: true },
                    { name: '🚀 البوستات', value: `**${guild.premiumSubscriptionCount || 0}** • ${boostTier[guild.premiumTier]}`, inline: true },
                    {
                        name: '📊 القنوات',
                        value: `💬 نصية: \`${textChannels}\`\n🔊 صوتية: \`${voiceChannels}\`\n📁 فئات: \`${categories}\``,
                        inline: true
                    },
                    {
                        name: '😄 الإيموجيز',
                        value: `ثابتة: \`${staticEmojis}\`\nمتحركة: \`${animatedEmojis}\``,
                        inline: true
                    },
                    {
                        name: '🛡️ التحقق',
                        value: verificationEmoji[guild.verificationLevel] || '—',
                        inline: true
                    },
                    { name: `👑 أعلى الرتب [${roles.size}]`, value: rolesValue, inline: false }
                )
                .setFooter({ text: `طُلب بواسطة ${author.tag}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            if (guild.description) embed.setDescription(`> ${guild.description}`);

            if (isSlash) await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed] });
            else await (interaction as Message).reply({ embeds: [embed] });
        } catch (err) {
            console.error('server error:', err);
        }
    }
};
