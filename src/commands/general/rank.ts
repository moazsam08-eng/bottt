import { Command } from '../../interfaces/Command';
import { SlashCommandBuilder, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { UserLevel } from '../../models/UserLevel';

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your rank and XP')
    .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(false));

export const command: Command = {
    name: 'rank',
    enabled: true,
    aliases: ['level', 'xp'],
    async execute(interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> {
        try {
            if (!interaction.guild) return;

            let target;
            if (interaction instanceof ChatInputCommandInteraction) {
                target = interaction.options.getUser('user') || interaction.user;
            } else {
                target = (interaction instanceof Message && interaction.mentions.users.first()) || (interaction as Message).author;
            }

            const userLevel = await UserLevel.findOne({ guildId: interaction.guild.id, userId: target.id });
            if (!userLevel) {
                const msg = '❌ هذا المستخدم لم يتحدث بعد في السيرفر!';
                if (interaction instanceof ChatInputCommandInteraction) { await interaction.reply({ content: msg, ephemeral: true }); return; }
                await (interaction as Message).reply(msg);
                return;
            }

            const allUsers = await UserLevel.find({ guildId: interaction.guild.id }).sort({ totalXP: -1 });
            const rank = allUsers.findIndex(u => u.userId === target.id) + 1;
            const nextXP = userLevel.level * 2 * 250 + 250;
            const color = (client.settings?.leveling?.embed?.color || '#5865F2') as `#${string}`;

            const embed = new EmbedBuilder()
                .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                .setColor(color)
                .setThumbnail(target.displayAvatarURL())
                .addFields(
                    { name: '🏆 الترتيب', value: `#${rank}`, inline: true },
                    { name: '⭐ المستوى', value: `${userLevel.level}`, inline: true },
                    { name: '✨ الـ XP', value: `${userLevel.xp} / ${nextXP}`, inline: true },
                    { name: '📊 إجمالي الـ XP', value: `${userLevel.totalXP}`, inline: true }
                )
                .setTimestamp();

            if (interaction instanceof ChatInputCommandInteraction) { await interaction.reply({ embeds: [embed] }); return; }
            await (interaction as Message).reply({ embeds: [embed] });
        } catch (err) {
            console.error('rank command error:', err);
        }
    }
};
