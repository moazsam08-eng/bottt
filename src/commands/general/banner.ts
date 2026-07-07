import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import settings from '../../../settings.json';
import { checkCommandPermissions } from '../../utils/permissionChecker';

export const data = new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Shows user or server banner')
    .addUserOption(opt => opt.setName('target').setDescription('المستخدم').setRequired(false));

export const command: Command = {
    name: 'banner',
    aliases: (settings.commands?.banner as any)?.aliases || ['userbanner', 'serverbanner'],
    enabled: (settings.commands?.banner as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const execMember = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(execMember, (settings.commands?.banner as any))) {
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

            const user = await member.user.fetch(true);
            const userBanner = user.bannerURL({ size: 4096, extension: 'png' });
            const serverBanner = guild?.bannerURL({ size: 4096, extension: 'png' });
            const displayColor = member.displayHexColor && member.displayHexColor !== '#000000'
                ? member.displayHexColor as `#${string}`
                : '#5865F2';

            if (!userBanner && !serverBanner) {
                const msg = `❌ **${user.tag}** ليس لديه/لها بانر، وليس للسيرفر بانر أيضاً.`;
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 64 }) })
                .setTitle('🎨 البانر')
                .setColor(displayColor)
                .setImage(userBanner || serverBanner || null)
                .setFooter({ text: `طُلب بواسطة ${author.tag}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            const desc: string[] = [];
            if (userBanner) desc.push(`[💾 تحميل بانر المستخدم](${userBanner}?size=4096)`);
            if (serverBanner) desc.push(`[🏰 بانر السيرفر](${serverBanner}?size=4096)`);
            embed.setDescription(desc.join('\n'));

            const row = new ActionRowBuilder<ButtonBuilder>();
            if (userBanner) row.addComponents(new ButtonBuilder().setLabel('💾 بانر المستخدم').setStyle(ButtonStyle.Link).setURL(userBanner));
            if (serverBanner) row.addComponents(new ButtonBuilder().setLabel('🏰 بانر السيرفر').setStyle(ButtonStyle.Link).setURL(serverBanner));

            if (isSlash) await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed], components: [row] });
            else await (interaction as Message).reply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('banner error:', err);
        }
    }
};
