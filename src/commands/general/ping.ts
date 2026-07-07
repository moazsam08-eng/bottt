import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    Message
} from 'discord.js';
import settings from '../../../settings.json';
import { checkCommandPermissions } from '../../utils/permissionChecker';

const getPingBar = (ms: number): string => {
    if (ms < 100) return '🟢🟢🟢🟢🟢';
    if (ms < 200) return '🟡🟡🟡🟡⚫';
    if (ms < 300) return '🟠🟠🟠⚫⚫';
    return '🔴🔴⚫⚫⚫';
};

const getPingLabel = (ms: number): string => {
    if (ms < 100) return '🟢 ممتاز';
    if (ms < 200) return '🟡 جيد';
    if (ms < 300) return '🟠 مقبول';
    return '🔴 ضعيف';
};

const getPingColor = (ms: number): number => {
    if (ms < 100) return 0x57F287;
    if (ms < 200) return 0xFEE75C;
    if (ms < 300) return 0xE67E22;
    return 0xED4245;
};

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows bot latency');

export const command: Command = {
    name: 'ping',
    aliases: (settings.commands?.ping as any)?.aliases || ['latency', 'pong'],
    enabled: (settings.commands?.ping as any)?.enabled ?? true,
    execute: async (interaction: ChatInputCommandInteraction | Message, _args: string[], client: any): Promise<void> => {
        const isSlash = interaction instanceof ChatInputCommandInteraction;
        const guild = isSlash ? interaction.guild : (interaction as Message).guild;
        const author = isSlash ? interaction.user : (interaction as Message).author;

        try {
            const member = isSlash ? interaction.member as GuildMember : (interaction as Message).member as GuildMember;
            if (!checkCommandPermissions(member, (settings.commands?.ping as any))) {
                const msg = '❌ ليس لديك صلاحية.';
                if (isSlash) await interaction.reply({ content: msg, ephemeral: true });
                else await (interaction as Message).reply(msg);
                return;
            }

            const wsLatency = client.ws.ping;
            const start = Date.now();

            const buildEmbed = (roundtrip?: number) => {
                const ping = roundtrip ?? wsLatency;
                return new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .setColor(getPingColor(ping))
                    .addFields(
                        {
                            name: '📡 WebSocket',
                            value: `\`${wsLatency}ms\`\n${getPingBar(wsLatency)}`,
                            inline: true
                        },
                        {
                            name: '🔄 Roundtrip',
                            value: roundtrip !== undefined ? `\`${roundtrip}ms\`\n${getPingBar(roundtrip)}` : '`حساب...`',
                            inline: true
                        },
                        {
                            name: '📊 التقييم',
                            value: getPingLabel(ping),
                            inline: true
                        }
                    )
                    .setFooter({ text: `طُلب بواسطة ${author.tag}`, iconURL: author.displayAvatarURL() })
                    .setTimestamp();
            };

            const sent = await (isSlash
                ? (interaction as ChatInputCommandInteraction).reply({ embeds: [buildEmbed()], fetchReply: true })
                : (interaction as Message).reply({ embeds: [buildEmbed()] })) as Message;

            const roundtrip = Date.now() - start;
            await sent.edit({ embeds: [buildEmbed(roundtrip)] });
        } catch (err) {
            console.error('ping error:', err);
        }
    }
};
