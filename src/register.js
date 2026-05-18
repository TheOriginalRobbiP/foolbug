// register.js — run once to register slash commands with Discord
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug in Foolking 🐛')
    .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commands },
  );
  console.log('✅ Slash commands registered globally.');
} catch (err) {
  console.error('Failed to register commands:', err);
  process.exit(1);
}
