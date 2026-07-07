import {
    TextChannel,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    ChannelType,
    GuildMember,
    StringSelectMenuInteraction,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction,
    PermissionFlagsBits
} from 'discord.js';
import { ModBot } from '../types/ModBot';
import { Ticket } from '../models/Ticket';
import { createTranscript } from './transcriptGenerator';
import { TicketSection } from '../types/TicketSection';

const EMBED_COLOR = 0x5865F2 as const;
const MANAGE_MENU_ID = 'ticket_manage';

export class TicketManager {
    constructor(private client: ModBot) {}

    /* ─────────────────────────────── PANEL ────────────────────────────── */

    public async setupPanel(channel: TextChannel): Promise<void> {
        const settings = this.client.settings.ticket;
        if (!settings.enabled) throw new Error('Ticket system is disabled');

        const enabledSections: TicketSection[] = settings.sections.filter((s: TicketSection) => s.enabled);
        if (enabledSections.length === 0) throw new Error('No enabled sections found in settings.json');

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('🎫 نظام التذاكر')
            .setDescription(
                '> مرحباً بك في نظام التذاكر\n' +
                '> قم باختيار نوع التذكرة المناسب لك من القائمة أدناه'
            )
            .setFooter({ text: settings.embed?.footer || 'نظام الدعم' })
            .setTimestamp();

        if (settings.embed?.image) embed.setImage(settings.embed.image);
        if (settings.embed?.thumbnail) embed.setThumbnail(settings.embed.thumbnail);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_panel_select')
            .setPlaceholder('📩 اختر نوع التذكرة')
            .addOptions(enabledSections.map((s: TicketSection) => ({
                label: s.name,
                description: (s as any).description || `فتح تذكرة ${s.name}`,
                value: s.name,
                emoji: s.emoji
            })));

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await channel.send({ embeds: [embed], components: [row] });
    }

    /* ──────────────────────────── PANEL SELECT ─────────────────────────── */

    public async handlePanelSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        const sectionName = interaction.values[0];
        const settings = this.client.settings.ticket;
        const section: TicketSection | undefined = settings.sections.find(
            (s: TicketSection) => s.name === sectionName && s.enabled
        );

        if (!section) {
            await interaction.editReply({ content: '❌ هذا القسم غير متاح.' });
            return;
        }

        // Required-server check
        const req = settings.requiredServer;
        if (req?.enabled && req?.guildId) {
            try {
                const rg = await this.client.guilds.fetch(req.guildId);
                await rg.members.fetch({ user: interaction.user.id, force: true });
            } catch {
                const msg = req.message || '❌ يجب الانضمام لسيرفرنا أولاً!';
                await interaction.editReply({ content: req.inviteUrl ? `${msg}\n🔗 ${req.inviteUrl}` : msg });
                return;
            }
        }

        // One active ticket per user
        const existing = await Ticket.find({ guildId: interaction.guildId, userId: interaction.user.id, status: { $in: ['open', 'claimed'] } });
        for (const t of existing) {
            const ch = interaction.guild?.channels.cache.get(t.channelId) || await interaction.guild?.channels.fetch(t.channelId).catch(() => null);
            if (!ch) { t.status = 'closed'; t.closedBy = 'system'; t.closedAt = new Date(); await t.save(); }
        }
        const active = existing.filter(t => t.status !== 'closed');
        if (active.length > 0) {
            await interaction.editReply({ content: `❌ لديك تذكرة مفتوحة بالفعل: <#${active[0].channelId}>` });
            return;
        }

        // Category check
        const category = await interaction.guild?.channels.fetch(section.categoryId).catch(() => null);
        if (!category || category.type !== ChannelType.GuildCategory) {
            await interaction.editReply({ content: '❌ الكاتيقوري غير صحيح. يرجى تحديث `categoryId` في settings.json' });
            return;
        }

        // Create channel
        const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const channelName = `🎫・${safeName}`;
        const ticketChannel = await interaction.guild!.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                { id: this.client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
                ...section.adminRoles.map((roleId: string) => ({
                    id: roleId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }))
            ]
        });

        const ticket = await Ticket.create({
            guildId: interaction.guildId,
            channelId: ticketChannel.id,
            userId: interaction.user.id,
            section: section.name,
            status: 'open'
        });

        await this.sendTicketWelcome(ticketChannel, ticket, interaction.member as GuildMember, section);

        await interaction.editReply({ content: `✅ تم فتح تذكرتك بنجاح! ${ticketChannel}` });
    }

    /* ──────────────────────────── WELCOME MSG ──────────────────────────── */

    private async sendTicketWelcome(
        channel: TextChannel,
        ticket: any,
        member: GuildMember,
        section: TicketSection
    ): Promise<void> {
        const settings = this.client.settings.ticket;

        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(`${section.emoji} تذكرة ${section.name}`)
            .setDescription(
                `> مرحباً بك ${member} في تذكرتك\n` +
                `> سيقوم فريق الدعم بالرد عليك قريباً\n` +
                (typeof (section as any).welcomeMessage === 'string' && (section as any).welcomeMessage
                    ? `\n${(section as any).welcomeMessage}` : '')
            )
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: '👤 المستخدم', value: `${member}`, inline: true },
                { name: '📅 وقت الفتح', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                { name: '🏷️ القسم', value: `${section.emoji} ${section.name}`, inline: true }
            )
            .setFooter({ text: `${settings.embed?.footer || 'نظام الدعم'} • ID: ${ticket.id}` })
            .setTimestamp();

        if ((section as any).imageUrl) embed.setImage((section as any).imageUrl);

        // Action buttons for staff
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('👋 استلام').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`ticket_close_${ticket.id}`).setLabel('🔒 إغلاق').setStyle(ButtonStyle.Danger)
        );

        // Management select menu (visible to everyone in ticket)
        const manageRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(MANAGE_MENU_ID)
                .setPlaceholder('⚙️ إدارة التذكرة')
                .addOptions([
                    { label: 'إعادة التسمية', description: 'تغيير اسم قناة التذكرة', value: 'rename', emoji: '✏️' },
                    { label: 'إضافة مستخدم', description: 'إضافة مستخدم للتذكرة', value: 'add_user', emoji: '➕' },
                    { label: 'إزالة مستخدم', description: 'إزالة مستخدم من التذكرة', value: 'remove_user', emoji: '➖' },
                    { label: 'إغلاق التذكرة', description: 'إغلاق وأرشفة التذكرة', value: 'close', emoji: '🔒' }
                ])
        );

        await channel.send({
            content: `${member} ${section.adminRoles.map((r: string) => `<@&${r}>`).join(' ')}`,
            embeds: [embed],
            components: [actionRow, manageRow]
        });
    }

    /* ─────────────────────────── MANAGE SELECT ─────────────────────────── */

    public async handleManageSelect(interaction: StringSelectMenuInteraction): Promise<void> {
        const value = interaction.values[0];
        const channel = interaction.channel as TextChannel;

        // Find ticket by channelId
        const ticket = await Ticket.findOne({ channelId: channel.id, status: { $in: ['open', 'claimed'] } });

        const isOwner = ticket?.userId === interaction.user.id;
        const member = interaction.member as GuildMember;
        const section = ticket ? this.client.settings.ticket.sections.find((s: TicketSection) => s.name === ticket.section) : null;
        const isStaff = section ? section.adminRoles.some((r: string) => member.roles.cache.has(r)) : false;
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

        if (value === 'rename') {
            if (!isStaff && !isAdmin) {
                await interaction.reply({ content: '❌ هذا الخيار للإداريين فقط.', ephemeral: true });
                return;
            }
            const modal = new ModalBuilder()
                .setCustomId(`ticket_rename_${channel.id}`)
                .setTitle('إعادة تسمية التذكرة')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('new_name')
                            .setLabel('الاسم الجديد للقناة')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('مثال: ticket-ahmed')
                            .setMaxLength(50)
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            return;
        }

        if (value === 'add_user') {
            if (!isStaff && !isAdmin) {
                await interaction.reply({ content: '❌ هذا الخيار للإداريين فقط.', ephemeral: true });
                return;
            }
            const modal = new ModalBuilder()
                .setCustomId(`ticket_adduser_${channel.id}`)
                .setTitle('إضافة مستخدم للتذكرة')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('user_id')
                            .setLabel('آيدي المستخدم أو منشنه')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('مثال: 123456789012345678')
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            return;
        }

        if (value === 'remove_user') {
            if (!isStaff && !isAdmin) {
                await interaction.reply({ content: '❌ هذا الخيار للإداريين فقط.', ephemeral: true });
                return;
            }
            const modal = new ModalBuilder()
                .setCustomId(`ticket_removeuser_${channel.id}`)
                .setTitle('إزالة مستخدم من التذكرة')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('user_id')
                            .setLabel('آيدي المستخدم أو منشنه')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('مثال: 123456789012345678')
                            .setRequired(true)
                    )
                );
            await interaction.showModal(modal);
            return;
        }

        if (value === 'close') {
            if (!isOwner && !isStaff && !isAdmin) {
                await interaction.reply({ content: '❌ ليس لديك صلاحية لإغلاق هذه التذكرة.', ephemeral: true });
                return;
            }
            if (!ticket) {
                await interaction.reply({ content: '❌ لم يتم العثور على بيانات التذكرة.', ephemeral: true });
                return;
            }
            await this.closeTicket(interaction, ticket, channel);
        }
    }

    /* ──────────────────────────── MODALS ───────────────────────────────── */

    public async handleModalRename(interaction: ModalSubmitInteraction): Promise<void> {
        const channelId = interaction.customId.replace('ticket_rename_', '');
        const newName = interaction.fields.getTextInputValue('new_name').toLowerCase().replace(/\s+/g, '-');
        const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;

        if (!channel) { await interaction.reply({ content: '❌ القناة غير موجودة.', ephemeral: true }); return; }

        await channel.setName(newName).catch(() => null);
        await interaction.reply({ content: `✅ تم تغيير اسم التذكرة إلى **${newName}**`, ephemeral: true });
    }

    public async handleModalAddUser(interaction: ModalSubmitInteraction): Promise<void> {
        const channelId = interaction.customId.replace('ticket_adduser_', '');
        const rawId = interaction.fields.getTextInputValue('user_id').replace(/\D/g, '');
        const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;

        if (!channel) { await interaction.reply({ content: '❌ القناة غير موجودة.', ephemeral: true }); return; }

        const target = await interaction.guild?.members.fetch(rawId).catch(() => null);
        if (!target) { await interaction.reply({ content: '❌ المستخدم غير موجود.', ephemeral: true }); return; }

        await channel.permissionOverwrites.edit(target.id, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true
        });
        await interaction.reply({ content: `✅ تم إضافة ${target} للتذكرة.`, ephemeral: true });
        await channel.send({ content: `➕ تم إضافة ${target} للتذكرة بواسطة ${interaction.user}` });
    }

    public async handleModalRemoveUser(interaction: ModalSubmitInteraction): Promise<void> {
        const channelId = interaction.customId.replace('ticket_removeuser_', '');
        const rawId = interaction.fields.getTextInputValue('user_id').replace(/\D/g, '');
        const channel = interaction.guild?.channels.cache.get(channelId) as TextChannel | undefined;

        if (!channel) { await interaction.reply({ content: '❌ القناة غير موجودة.', ephemeral: true }); return; }

        const ticket = await Ticket.findOne({ channelId: channel.id });
        if (ticket?.userId === rawId) {
            await interaction.reply({ content: '❌ لا يمكن إزالة صاحب التذكرة.', ephemeral: true });
            return;
        }

        const target = await interaction.guild?.members.fetch(rawId).catch(() => null);
        if (!target) { await interaction.reply({ content: '❌ المستخدم غير موجود.', ephemeral: true }); return; }

        await channel.permissionOverwrites.delete(target.id).catch(() => null);
        await interaction.reply({ content: `✅ تم إزالة ${target} من التذكرة.`, ephemeral: true });
        await channel.send({ content: `➖ تم إزالة ${target} من التذكرة بواسطة ${interaction.user}` });
    }

    /* ──────────────────────────── CLAIM ────────────────────────────────── */

    public async handleClaim(interaction: ButtonInteraction): Promise<void> {
        const ticketId = interaction.customId.replace('ticket_claim_', '');
        const ticket = await Ticket.findById(ticketId);
        if (!ticket || ticket.status !== 'open') {
            await interaction.reply({ content: '❌ التذكرة غير موجودة أو تم استلامها بالفعل.', ephemeral: true });
            return;
        }

        const section = this.client.settings.ticket.sections.find((s: TicketSection) => s.name === ticket.section);
        const member = interaction.member as GuildMember;
        const isStaff = section?.adminRoles.some((r: string) => member.roles.cache.has(r));
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff && !isAdmin) {
            await interaction.reply({ content: '❌ هذا الزر للإداريين فقط.', ephemeral: true });
            return;
        }

        ticket.status = 'claimed';
        ticket.claimedBy = interaction.user.id;
        ticket.claimedAt = new Date();
        await ticket.save();

        const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0x57F287)
            .addFields({ name: '✅ استُلم بواسطة', value: `${member}`, inline: true });

        // Remove claim button, keep close
        const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`ticket_close_${ticket.id}`).setLabel('🔒 إغلاق').setStyle(ButtonStyle.Danger)
        );

        const manageRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(MANAGE_MENU_ID)
                .setPlaceholder('⚙️ إدارة التذكرة')
                .addOptions([
                    { label: 'إعادة التسمية', description: 'تغيير اسم قناة التذكرة', value: 'rename', emoji: '✏️' },
                    { label: 'إضافة مستخدم', description: 'إضافة مستخدم للتذكرة', value: 'add_user', emoji: '➕' },
                    { label: 'إزالة مستخدم', description: 'إزالة مستخدم من التذكرة', value: 'remove_user', emoji: '➖' },
                    { label: 'إغلاق التذكرة', description: 'إغلاق وأرشفة التذكرة', value: 'close', emoji: '🔒' }
                ])
        );

        await interaction.update({ embeds: [updatedEmbed], components: [closeRow, manageRow] });
        await (interaction.channel as TextChannel).send({ content: `👋 تم استلام التذكرة بواسطة ${member}` });
    }

    /* ──────────────────────────── CLOSE ────────────────────────────────── */

    public async handleClose(interaction: ButtonInteraction): Promise<void> {
        const ticketId = interaction.customId.replace('ticket_close_', '');
        const ticket = await Ticket.findById(ticketId);
        if (!ticket || ticket.status === 'closed') {
            await interaction.reply({ content: '❌ هذه التذكرة مغلقة بالفعل.', ephemeral: true });
            return;
        }

        const section = this.client.settings.ticket.sections.find((s: TicketSection) => s.name === ticket.section);
        const member = interaction.member as GuildMember;
        const isOwner = ticket.userId === member.id;
        const isStaff = section?.adminRoles.some((r: string) => member.roles.cache.has(r));
        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !isStaff && !isAdmin) {
            await interaction.reply({ content: '❌ ليس لديك صلاحية لإغلاق هذه التذكرة.', ephemeral: true });
            return;
        }

        const channel = interaction.channel as TextChannel;
        await this.closeTicket(interaction, ticket, channel);
    }

    private async closeTicket(
        interaction: ButtonInteraction | StringSelectMenuInteraction,
        ticket: any,
        channel: TextChannel
    ): Promise<void> {
        const settings = this.client.settings.ticket;
        const section = settings.sections.find((s: TicketSection) => s.name === ticket.section);

        await interaction.reply({
            embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('🔒 سيتم إغلاق التذكرة خلال **5 ثواني**...')],
        });

        ticket.status = 'closed';
        ticket.closedBy = interaction.user.id;
        ticket.closedAt = new Date();
        await ticket.save();

        // Send transcript to log channel
        if (section?.logChannelId) {
            const logCh = interaction.guild?.channels.cache.get(section.logChannelId) as TextChannel | undefined;
            if (logCh) {
                try {
                    const transcript = await createTranscript(channel);
                    const logEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLOR)
                        .setTitle('📋 سجل التذكرة المغلقة')
                        .addFields(
                            { name: '🎫 القناة', value: `#${channel.name}`, inline: true },
                            { name: '👤 المستخدم', value: `<@${ticket.userId}>`, inline: true },
                            { name: '🏷️ القسم', value: ticket.section, inline: true },
                            { name: '🔒 أُغلق بواسطة', value: `<@${interaction.user.id}>`, inline: true },
                            { name: '📅 وقت الفتح', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
                            { name: '🕒 وقت الإغلاق', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                            ...(ticket.claimedBy ? [{ name: '✅ استُلم بواسطة', value: `<@${ticket.claimedBy}>`, inline: true }] : [])
                        )
                        .setTimestamp();
                    await logCh.send({ embeds: [logEmbed], files: [transcript] });
                } catch (err) {
                    console.error('Transcript error:', err);
                }
            }
        }

        setTimeout(() => channel.delete().catch(() => {}), 5000);
    }
}
