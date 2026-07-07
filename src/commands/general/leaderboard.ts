import { Command } from '../../interfaces/Command';
import { SlashCommandBuilder, ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';
import { UserLevel } from '../../models/UserLevel';

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show top users by XP');

export const command: Command = {
    name: 'leaderboard',
    enabled: true,
    aliases: ['lb', 'top'],
    async execute(interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> {
        try {
            if (!interaction.guild) return;

            const top10 = await UserLevel.find({ guildId: interaction.guild.id }).sort({ totalXP: -1 }).limit(10);
            const color = (client.settings?.leveling?.embed?.color || '#5865F2') as `#${string}`;

            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${interaction.guild.name} — لوحة الترتيب`)
                .setColor(color)
                .setTimestamp();

            if (top10.length === 0) {
                embed.setDescription('لا يوجد مستخدمون بعد!');
            } else {
                const medals = ['🥇', '🥈', '🥉'];
                const lines = top10.map((u, i) => {
                    const nextXP = u.level * 2 * 250 + 250;
                    const prefix = medals[i] || `**#${i + 1}**`;
                    return `${prefix} <@${u.userId}> — المستوى \`${u.level}\` | XP: \`${u.xp}/${nextXP}\``;
                });
                embed.setDescription(lines.join('\n'));
            }

            if (interaction instanceof ChatInputCommandInteraction) { await interaction.reply({ embeds: [embed] }); return; }
            await (interaction as Message).reply({ embeds: [embed] });
        } catch (err) {
            console.error('leaderboard command error:', err);
        }
    }
};
