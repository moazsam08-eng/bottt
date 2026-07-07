import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    Role,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import settings from '../../../settings.json';
import { checkCommandPermissions } from '../../utils/permissionChecker';

const ROLES_PER_PAGE = 20;

const formatRolePage = (roles: Role[], page: number): string => {
    const start = (page - 1) * ROLES_PER_PAGE;
    const slice = roles.slice(start, start + ROLES_PER_PAGE);
    return slice.map((r, i) => {
        const num = start + i + 1;
        return `\`${String(num).padStart(2, '0')}.\` <@&${r.id}> \`(${r.members.size})\``;
    }).join('\n') || '—';
};

export const data = new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Shows all server roles');

export const command: Command = {
    name: 'roles',
    aliases: (settings.commands?.roles as any)?.aliases || ['rolelist', 'listroles'],
    enabled: (settings.commands?.roles as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const member = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(member, (settings.commands?.roles as any))) {
                const msg = '❌ ليس لديك صلاحية لاستخدام هذا الأمر.';
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            if (!guild) return;

            const allRoles = Array.from(guild.roles.cache.values())
                .filter(r => r.id !== guild.id)
                .sort((a, b) => b.position - a.position);

            const totalPages = Math.max(1, Math.ceil(allRoles.length / ROLES_PER_PAGE));
            let page = 1;

            const buildEmbed = (p: number) => new EmbedBuilder()
                .setTitle(`📋 قائمة الرتب — \`${guild.name}\` [${allRoles.length}]`)
                .setDescription(formatRolePage(allRoles, p))
                .setColor(0x5865F2)
                .setThumbnail(guild.iconURL({ size: 256 }))
                .setFooter({ text: `طُلب بواسطة ${author.tag} • صفحة ${p} من ${totalPages}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            const buildRow = (p: number) => new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('prev_roles').setEmoji('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(p === 1),
                new ButtonBuilder().setCustomId('page_roles').setLabel(`${p} / ${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('next_roles').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(p === totalPages)
            );

            const sent = await (isSlash
                ? (interaction as ChatInputCommandInteraction).reply({ embeds: [buildEmbed(page)], components: totalPages > 1 ? [buildRow(page)] : [], fetchReply: true })
                : (interaction as Message).reply({ embeds: [buildEmbed(page)], components: totalPages > 1 ? [buildRow(page)] : [] })) as Message;

            if (totalPages <= 1) return;

            const collector = sent.createMessageComponentCollector({ filter: i => i.user.id === author.id, time: 90_000 });
            collector.on('collect', async i => {
                if (i.customId === 'prev_roles') page = Math.max(1, page - 1);
                else if (i.customId === 'next_roles') page = Math.min(totalPages, page + 1);
                await i.update({ embeds: [buildEmbed(page)], components: [buildRow(page)] });
            });
            collector.on('end', () => sent.edit({ components: [] }).catch(() => {}));
        } catch (err) {
            console.error('roles error:', err);
        }
    }
};
