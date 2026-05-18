# Foolbug 🐛

Discord bug reporting bot for game development teams. Built for Foolking.

## What it does

- `/bug` opens a guided 3-step flow: platform → severity → details form
- Posts a formatted embed to `#bug-reports` with a unique `FB-XXX` ID
- Auto-creates a thread on each report for screenshots and discussion
- Reactions (🔧 in progress, ✅ fixed) for the developer to track status

## Setup

### 1. Create the Discord bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. New Application → name it **Foolbug**
3. Bot → Reset Token → copy the token
4. Bot → enable **applications.commands** scope
5. OAuth2 → URL Generator → scopes: `bot` + `applications.commands`
6. Bot permissions: `Send Messages`, `Create Public Threads`, `Add Reactions`, `Embed Links`, `Read Message History`
7. Copy the invite URL → invite to your server

### 2. Get your IDs

- **Client ID**: Application → General Information → Application ID
- **Bot Token**: Bot → Token
- **Channel ID**: Right-click your `#bug-reports` channel → Copy Channel ID (enable Developer Mode in Discord settings first)

### 3. Configure

```bash
cp .env.example .env
# Fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, BUG_CHANNEL_ID
```

### 4. Register slash commands (run once)

```bash
npm install
npm run register
```

### 5. Run locally

```bash
npm start
```

## Deploying to Dokploy

1. Push to GitHub
2. Dokploy → New Service → Application → connect repo
3. Add env vars: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `BUG_CHANNEL_ID`
4. Build command: (none — uses Dockerfile)
5. Deploy

**After first deploy:** Run the register command once to register slash commands:
```bash
# In Dokploy terminal or locally with prod env vars
npm run register
```

## Bug report format

Each report includes:
- Unique ID (`FB-001`, `FB-002`...)
- Severity (🔴 Blocker / 🟡 Visual / 🟢 Minor) with colour-coded embed
- What happened
- What should have happened
- Scene / level name
- Platform (PC Windows / Mac / Android / iOS)
- Steps to reproduce (optional)
- Reporter name + avatar
- Timestamp
- Auto-thread for screenshots

## Adding it to another server

Just use the same OAuth2 invite URL. The bot works across multiple servers simultaneously. Each server needs its own `BUG_CHANNEL_ID` — or you can run separate instances with different env configs.
