import {
  Client,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  InteractionType,
} from 'discord.js';
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COUNTER_FILE = resolve(__dirname, '../data/counter.json');

// ── ID counter ────────────────────────────────────────────────────────────────
function getNextId() {
  const dir = resolve(__dirname, '../data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let data = { count: 0 };
  if (existsSync(COUNTER_FILE)) {
    data = JSON.parse(readFileSync(COUNTER_FILE, 'utf8'));
  }
  data.count += 1;
  writeFileSync(COUNTER_FILE, JSON.stringify(data), 'utf8');
  return String(data.count).padStart(3, '0');
}

// ── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = {
  blocker: { label: '🔴 Blocker — can\'t continue working', colour: 0xe74c3c, tag: 'BLOCKER' },
  visual:  { label: '🟡 Visual — looks wrong but I can continue', colour: 0xf39c12, tag: 'VISUAL'  },
  minor:   { label: '🟢 Minor — small issue', colour: 0x2ecc71, tag: 'MINOR'   },
};

// ── Platform options ──────────────────────────────────────────────────────────
const PLATFORMS = ['PC (Windows)', 'PC (Mac)', 'Android', 'iOS', 'Other'];

// ── Client setup ─────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`✅ Foolbug is online as ${client.user.tag}`);
  client.user.setActivity('for bugs 🐛', { type: 3 }); // WATCHING
});

// ── Interaction handler ───────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  try {

    // ── /bug command → show platform select first ───────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === 'bug') {
      const select = new StringSelectMenuBuilder()
        .setCustomId('bug_platform')
        .setPlaceholder('What platform are you testing on?')
        .addOptions(
          PLATFORMS.map(p =>
            new StringSelectMenuOptionBuilder().setLabel(p).setValue(p)
          )
        );

      await interaction.reply({
        content: '**Step 1 of 2** — Pick your platform:',
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true,
      });
      return;
    }

    // ── Platform selected → show severity select ────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === 'bug_platform') {
      const platform = interaction.values[0];

      const select = new StringSelectMenuBuilder()
        .setCustomId(`bug_severity__${platform}`)
        .setPlaceholder('How bad is it?')
        .addOptions(
          Object.entries(SEVERITY).map(([value, { label }]) =>
            new StringSelectMenuOptionBuilder().setLabel(label).setValue(value)
          )
        );

      await interaction.update({
        content: '**Step 2 of 2** — How bad is the bug?',
        components: [new ActionRowBuilder().addComponents(select)],
      });
      return;
    }

    // ── Severity selected → open the modal ─────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('bug_severity__')) {
      const platform = interaction.customId.split('__')[1];
      const severity = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`bug_report__${platform}__${severity}`)
        .setTitle('🐛 Report a Bug — Foolking');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('what_happened')
            .setLabel('What happened? (describe what you saw)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('e.g. The character floated off the ground after jumping near the wall')
            .setRequired(true)
            .setMaxLength(500)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('what_expected')
            .setLabel('What should have happened?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('e.g. The character should have landed normally')
            .setRequired(true)
            .setMaxLength(500)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('scene_name')
            .setLabel('Which scene / level?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Level_02, MainMenu, CharacterSelect')
            .setRequired(false)
            .setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('steps')
            .setLabel('Steps to reproduce (optional but helpful)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('e.g. 1. Start level 2  2. Jump near the left wall  3. Bug appears')
            .setRequired(false)
            .setMaxLength(500)
        ),
      );

      await interaction.showModal(modal);
      return;
    }

    // ── Modal submitted → post the bug report ──────────────────────────────
    if (
      interaction.type === InteractionType.ModalSubmit &&
      interaction.customId.startsWith('bug_report__')
    ) {
      const [, platform, severity] = interaction.customId.split('__');
      const sev = SEVERITY[severity] ?? SEVERITY.minor;

      const whatHappened = interaction.fields.getTextInputValue('what_happened');
      const whatExpected = interaction.fields.getTextInputValue('what_expected');
      const sceneName    = interaction.fields.getTextInputValue('scene_name') || '_Not specified_';
      const steps        = interaction.fields.getTextInputValue('steps') || '_Not provided_';

      const bugId   = getNextId();
      const reporter = interaction.user;

      const embed = new EmbedBuilder()
        .setColor(sev.colour)
        .setTitle(`FB-${bugId} · ${sev.tag}`)
        .setDescription(`> ${whatHappened}`)
        .addFields(
          { name: '✅ Expected behaviour', value: whatExpected },
          { name: '🎮 Scene / Level',      value: sceneName, inline: true },
          { name: '💻 Platform',           value: platform,  inline: true },
          { name: '📋 Steps to reproduce', value: steps },
        )
        .setFooter({
          text: `Reported by ${reporter.username}`,
          iconURL: reporter.displayAvatarURL(),
        })
        .setTimestamp();

      const bugChannel = await client.channels.fetch(process.env.BUG_CHANNEL_ID);
      if (!bugChannel?.isTextBased()) {
        await interaction.reply({
          content: '❌ Bug reports channel not found. Ask the server admin to check the BUG_CHANNEL_ID config.',
          ephemeral: true,
        });
        return;
      }

      const report = await bugChannel.send({ embeds: [embed] });

      await report.startThread({
        name: `FB-${bugId} — ${sev.tag}`,
        autoArchiveDuration: 10080, // 7 days
      });

      await report.react('🔧'); // in progress
      await report.react('✅'); // fixed

      await interaction.reply({
        content: `✅ Bug **FB-${bugId}** reported! Check <#${process.env.BUG_CHANNEL_ID}>.\n\nDrop any screenshots into the thread that was created on your report.`,
        ephemeral: true,
      });
    }

  } catch (err) {
    console.error('Interaction error:', err);
    try {
      const msg = { content: '❌ Something went wrong. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else if (interaction.isRepliable()) {
        await interaction.reply(msg);
      }
    } catch {
      // If we can't reply, just log and move on
    }
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
