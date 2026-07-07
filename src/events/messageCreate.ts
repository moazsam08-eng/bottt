import { Message } from 'discord.js';
import config from '../../config';
import { handleXP } from '../leveling/levelingManager';

export const name = 'messageCreate';
export const once = false;
export const execute = async (message: Message, client: any) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Grant XP for every message
    await handleXP(message, client);

    if (!message.content.startsWith(config.defaultPrefix)) return;

    const args = message.content.slice(config.defaultPrefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName) || 
                   client.commands.get(client.aliases.get(commandName));

    if (!command || !command.enabled) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        await message.reply('There was an error executing that command.');
    }
}; 
