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
    .setName('avatar')
    .setDescription('Shows a user avatar')
    .addUserOption(opt => opt.setName('target').setDescription('المستخدم').setRequired(false));

export const command: Command = {
    name: 'avatar',
    aliases: (settings.commands?.avatar as any)?.aliases || ['av', 'pfp', 'icon'],
    enabled: (settings.commands?.avatar as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const execMember = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(execMember, (settings.commands?.avatar as any))) {
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
            const globalAvatar = user.displayAvatarURL({ size: 4096, extension: 'png' });
            const serverAvatar = member.avatarURL({ size: 4096, extension: 'png' });
            const displayColor = member.displayHexColor && member.displayHexColor !== '#000000'
                ? member.displayHexColor as `#${string}`
                : '#5865F2';

            const embed = new EmbedBuilder()
                .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 64 }) })
                .setTitle('🖼️ الصورة الشخصية')
                .setColor(displayColor)
                .setImage(serverAvatar || globalAvatar)
                .setFooter({ text: `طُلب بواسطة ${author.tag}`, iconURL: author.displayAvatarURL() })
                .setTimestamp();

            if (serverAvatar && serverAvatar !== globalAvatar) {
                embed.setDescription(`> صورة السيرفر معروضة أدناه\n[🌐 الصورة العالمية](${globalAvatar}) • [💾 تحميل](${serverAvatar}?size=4096)`);
            } else {
                embed.setDescription(`[💾 تحميل بجودة عالية](${globalAvatar}?size=4096)`);
            }

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setLabel('💾 تحميل').setStyle(ButtonStyle.Link).setURL(serverAvatar || globalAvatar)
            );
            if (serverAvatar && serverAvatar !== globalAvatar) {
                row.addComponents(
                    new ButtonBuilder().setLabel('🌐 الصورة العالمية').setStyle(ButtonStyle.Link).setURL(globalAvatar)
                );
            }

            if (isSlash) await (interaction as ChatInputCommandInteraction).reply({ embeds: [embed], components: [row] });
            else await (interaction as Message).reply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error('avatar error:', err);
        }
    }
};
