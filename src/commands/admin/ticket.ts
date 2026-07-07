import { Command } from '../../interfaces/Command';
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Message,
    PermissionFlagsBits,
    TextChannel,
    GuildMember,
    EmbedBuilder
} from 'discord.js';
import { TicketManager } from '../../ticket/ticketManager';
import { Ticket } from '../../models/Ticket';
import { checkCommandPermissions } from '../../utils/permissionChecker';

export const data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إدارة نظام التذاكر')
    .addSubcommand(sub =>
        sub.setName('panel')
            .setDescription('إرسال بانل التذاكر في قناة')
            .addChannelOption(opt => opt.setName('channel').setDescription('القناة').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('add')
            .setDescription('إضافة مستخدم للتذكرة الحالية')
            .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('remove')
            .setDescription('إزالة مستخدم من التذكرة الحالية')
            .addUserOption(opt => opt.setName('user').setDescription('المستخدم').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('rename')
            .setDescription('إعادة تسمية قناة التذكرة الحالية')
            .addStringOption(opt => opt.setName('name').setDescription('الاسم الجديد').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('close')
            .setDescription('إغلاق التذكرة الحالية')
    )
    .addSubcommand(sub =>
        sub.setName('info')
            .setDescription('معلومات التذكرة الحالية')
    );

export const command: Command = {
    name: 'ticket',
    enabled: true,
    aliases: [],
    async execute(interaction: ChatInputCommandInteraction | Message, _: string[], client: any): Promise<void> {
        if (!(interaction instanceof ChatInputCommandInteraction)) return;
        if (!interaction.guild) return;

        const member = interaction.member as GuildMember;
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        const subcommand = interaction.options.getSubcommand();
        const channel = interaction.channel as TextChannel;

        /* ─── PANEL (admin only) ─── */
        if (subcommand === 'panel') {
            if (!isAdmin && !checkCommandPermissions(member, client.settings.commands?.ticket, PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({ content: '❌ تحتاج صلاحية **Administrator** لإرسال بانل التذاكر.', ephemeral: true });
                return;
            }
            const target = interaction.options.getChannel('channel') as TextChannel;
            if (!target?.isTextBased()) {
                await interaction.reply({ content: '❌ يرجى اختيار قناة نصية صحيحة.', ephemeral: true });
                return;
            }
            try {
                const tm = new TicketManager(client);
                await tm.setupPanel(target);
                await interaction.reply({ content: `✅ تم إرسال بانل التذاكر في ${target}`, ephemeral: true });
            } catch (err: any) {
                await interaction.reply({ content: `❌ ${err.message}`, ephemeral: true });
            }
            return;
        }

        /* ─── TICKET-SCOPED (must be inside a ticket channel) ─── */
        const ticket = await Ticket.findOne({ channelId: channel.id, status: { $in: ['open', 'claimed'] } });

        // For add/remove/rename/close/info — need to be in a ticket channel
        if (!ticket) {
            await interaction.reply({ content: '❌ هذا الأمر يجب استخدامه داخل قناة تذكرة.', ephemeral: true });
            return;
        }

        const section = client.settings.ticket.sections.find((s: any) => s.name === ticket.section);
        const isStaff = section?.adminRoles?.some((r: string) => member.roles.cache.has(r));
        const isOwner = ticket.userId === member.id;

        if (!isAdmin && !isStaff && !isOwner) {
            await interaction.reply({ content: '❌ ليس لديك صلاحية.', ephemeral: true });
            return;
        }

        if (subcommand === 'add') {
            if (!isAdmin && !isStaff) { await interaction.reply({ content: '❌ للإداريين فقط.', ephemeral: true }); return; }
            const target = interaction.options.getMember('user') as GuildMember | null;
            if (!target) { await interaction.reply({ content: '❌ المستخدم غير موجود.', ephemeral: true }); return; }
            await channel.permissionOverwrites.edit(target.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
            await interaction.reply({ content: `✅ تم إضافة ${target} للتذكرة.` });
            return;
        }

        if (subcommand === 'remove') {
            if (!isAdmin && !isStaff) { await interaction.reply({ content: '❌ للإداريين فقط.', ephemeral: true }); return; }
            const target = interaction.options.getMember('user') as GuildMember | null;
            if (!target) { await interaction.reply({ content: '❌ المستخدم غير موجود.', ephemeral: true }); return; }
            if (target.id === ticket.userId) { await interaction.reply({ content: '❌ لا يمكن إزالة صاحب التذكرة.', ephemeral: true }); return; }
            await channel.permissionOverwrites.delete(target.id).catch(() => null);
            await interaction.reply({ content: `✅ تم إزالة ${target} من التذكرة.` });
            return;
        }

        if (subcommand === 'rename') {
            if (!isAdmin && !isStaff) { await interaction.reply({ content: '❌ للإداريين فقط.', ephemeral: true }); return; }
            const newName = interaction.options.getString('name', true).toLowerCase().replace(/\s+/g, '-');
            await channel.setName(newName).catch(() => null);
            await interaction.reply({ content: `✅ تم تغيير اسم التذكرة إلى **${newName}**` });
            return;
        }

        if (subcommand === 'close') {
            ticket.status = 'closed';
            ticket.closedBy = member.id;
            ticket.closedAt = new Date();
            await ticket.save();

            await interaction.reply({
                embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('🔒 سيتم إغلاق التذكرة خلال **5 ثواني**...')]
            });
            setTimeout(() => channel.delete().catch(() => {}), 5000);
            return;
        }

        if (subcommand === 'info') {
            const embed = new EmbedBuilder()
                .setTitle('🎫 معلومات التذكرة')
                .setColor(0x5865F2)
                .addFields(
                    { name: '👤 المستخدم', value: `<@${ticket.userId}>`, inline: true },
                    { name: '🏷️ القسم', value: ticket.section, inline: true },
                    { name: '📌 الحالة', value: ticket.status === 'open' ? '🟢 مفتوح' : '🟡 مستلم', inline: true },
                    { name: '📅 وقت الفتح', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
                    ...(ticket.claimedBy ? [{ name: '✅ مستلم بواسطة', value: `<@${ticket.claimedBy}>`, inline: true }] : [])
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
    }
};
