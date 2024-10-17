import { Client, GatewayIntentBits, Partials } from "discord.js";

export const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Channel // Required to receive DMs
  ]
});
