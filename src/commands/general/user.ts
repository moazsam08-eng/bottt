import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    ActivityType
} from 'discord.js';
import settings from '../../../settings.json';
import { checkCommandPermissions } from '../../utils/permissionChecker';

const flagEmojis: Record<string, string> = {
    Staff: '<:staff:> 👨‍💼',
    Partner: '🤝',
    BugHunterLevel1: '🐛',
    BugHunterLevel2: '🏅',
    HypeSquadEvents: '🎉',
    PremiumEarlySupporter: '💎',
    VerifiedDeveloper: '👨‍💻',
    VerifiedBot: '✅',
    ActiveDeveloper: '🔨'
};

const statusEmoji: Record<string, string> = {
    online: '🟢 متصل',
    idle: '🟡 بعيد',
    dnd: '🔴 لا تزعج',
    offline: '⚫ غير متصل'
};

export const data = new SlashCommandBuilder()
    .setName('user')
    .setDescription('Shows user information')
    .addUserOption(opt => opt.setName('target').setDescription('المستخدم').setRequired(false));

export const command: Command = {
    name: 'user',
    aliases: (settings.commands?.user as any)?.aliases || ['userinfo', 'ui', 'whois'],
    enabled: (settings.commands?.user as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const execMember = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(execMember, (settings.commands?.user as any))) {
                const msg = '❌ ليس لديك صلاحية.';
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            let member: GuildMember | null | undefined;
            if (isSlash) {
                const targetUser = (interaction as ChatInputCommandInteraction).options.getUser('target');
                member = targetUser ? await guild?.members.fetch(targetUser.id).catch(() => null) : (interaction.member as GuildMember);
            } else {
                member = (interaction as Message).mentions.members?.first() || (interaction as Message).member;
            }

            if (!member) {
                const msg = '❌ المستخدم غير موجود.';
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            const { user } = member;
            const flags = user.flags?.toArray() || [];
            const badges = flags.map(f => flagEmojis[f] || '').filter(Boolean).join(' ') || '—';

            const roles = member.roles.cache
                .filter(r => r.name !== '@everyone')
                .sort((a, b) => b.position - a.position);

            const rolesDisplay = roles.size
                ? Array.from(roles.values()).slice(0, 10).map(r => `<@&${r.id}>`).join(' ') + (roles.size > 10 ? ` **+${roles.size - 10}**` : '')
                : '—';

            const status = member.presence?.status || 'offline';
            const activity = member.presence?.activities?.[0];
            const activityText = activity
                ? (activity.type === ActivityType.Playing ? `🎮 يلعب **${activity.name}**`
                    : activity.type === ActivityType.Listening ? `🎵 يستمع لـ **${activity.name}**`
                    : activity.type === ActivityType.Watching ? `📺 يشاهد **${activity.name}**`
                    : `✨ ${activity.name}`)
                : '—';

            const isBot = user.bot ? '✅ نعم' : '❌ لا';
            const topRole = member.roles.highest.id !== guild?.id ? `<@&${member.roles.highest.id}>` : '—';

            const embed = new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 256 }) })
                .setTitle('👤 معلومات المستخدم')
                .setColor(member.displayHexColor && member.displayHexColor !== '#000000' ? member.displayHexColor as `#${string}` : '#5865F2')
                .setThumbnail(user.displayAvatarURL({ size: 512 }))
                .setImage(user.bannerURL({ size: 1024 }) || null)
                .addFields(
                    { name: '🏷️ الاسم', value: user.tag, inline: true },
                    { name: '🆔 الآيدي', value: `\`${user.id}\``, inline: true },
                    { name: '🤖 بوت؟', value: isBot, inline: true },
                    { name: '📝 اللقب', value: member.nickname || '—', inline: true },
                    { name: '🌐 الحالة', value: statusEmoji[status] || '⚫ غير متصل', inline: true },
                    { name: '🎯 النشاط', value: activityText, inline: true },
                    { name: '📅 انضم للسيرفر', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
                    { name: '📆 أنشأ حسابه', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: '👑 أعلى رتبة', value: topRole, inline: true },
                    { name: '🏅 الشارات', value: badges, inline: false },
                    { name: `🎭 الرتب [${roles.size}]`, value: rolesDisplay, inline: false }
                )
                .setFooter({ text: `طُلب بواسطة ${author.tag}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            if (isSlash) await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed] });
            else await (interaction as Message).reply({ embeds: [embed] });
        } catch (err) {
            console.error('user error:', err);
        }
    }
};
