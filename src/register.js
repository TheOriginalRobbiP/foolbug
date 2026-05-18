// register.js — run once to register slash commands with Discord
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug in Foolking 🐛')
    .toJSON(),
];

const GUILD_ID = '1059823908217425920';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Registering slash commands (guild)...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
    { body: commands },
  );
  console.log('✅ Slash commands registered for guild — active immediately.');
} catch (err) {
  console.error('Failed to register commands:', err);
  process.exit(1);
}
