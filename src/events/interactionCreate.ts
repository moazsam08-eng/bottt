import { Interaction } from 'discord.js';
import { ModBot } from '../types/ModBot';
import { TicketManager } from '../ticket/ticketManager';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction: Interaction, client: ModBot): Promise<void> {
    const tm = () => new TicketManager(client);

    try {
        /* ───── Slash Commands ───── */
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command || !command.enabled) return;
            await command.execute(interaction, [], client);
            return;
        }

        /* ───── StringSelectMenus ───── */
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_panel_select') {
                await tm().handlePanelSelect(interaction);
                return;
            }
            if (interaction.customId === 'ticket_manage') {
                await tm().handleManageSelect(interaction);
                return;
            }
        }

        /* ───── Buttons ───── */
        if (interaction.isButton()) {
            if (interaction.customId.startsWith('ticket_claim_')) {
                await tm().handleClaim(interaction);
                return;
            }
            if (interaction.customId.startsWith('ticket_close_')) {
                await tm().handleClose(interaction);
                return;
            }
        }

        /* ───── Modal Submits ───── */
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('ticket_rename_')) {
                await tm().handleModalRename(interaction);
                return;
            }
            if (interaction.customId.startsWith('ticket_adduser_')) {
                await tm().handleModalAddUser(interaction);
                return;
            }
            if (interaction.customId.startsWith('ticket_removeuser_')) {
                await tm().handleModalRemoveUser(interaction);
                return;
            }
        }

    } catch (err) {
        console.error('interactionCreate error:', err);
        if (interaction.isRepliable() && !interaction.replied && !(interaction as any).deferred) {
            await interaction.reply({ content: '❌ حدث خطأ أثناء المعالجة.', ephemeral: true }).catch(() => null);
        }
    }
}
