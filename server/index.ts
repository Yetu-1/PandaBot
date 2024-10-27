import express from "express";
import * as MessageProducer from "./redpanda/producers/DiscordMsgProducer.js";
import {
  disconnectRedpanda,
  setupRedpanda,
} from "./redpanda/redpandaManager.js";
import { discord_client } from "./services/config.js";
import {
  DiscordGuild,
  initializeDatabase,
} from "./services/dataAccess/dbModels.js";
import generateAnswerForDiscordBotAI from "./services/generateAnswerForDiscordBotAI.js";
import { registerCommands } from "./services/registerCommands.js";
import { sendQuizRequest } from "./services/sendQuizRequest.js";
import { sendUserResponse } from "./services/sendUserResponse.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile("index.html");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
async function setupServer() {
  try {
    // setup redpanda producers and consumers
    setupRedpanda();

    // Login discord bot
    discord_client.login(process.env.DISCORD_TOKEN);

    initializeDatabase();
  } catch (error) {
    console.error("InitializeError:", error);
  }
}

setupServer();

discord_client.on("ready", async () => {
  console.log("Bot is online!");
});

discord_client.on("guildCreate", async (guild) => {
  try {
    console.log(`Guild ${guild.id} has added pandabot`);
    await registerCommands(guild.id);

    const discordGuild = await DiscordGuild.create({
      id: guild.id,
      name: guild.name,
    });
  } catch (error) {
    console.error("Error registering commands on guild create: ", error);
  }
});

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (
    message.channel.id === process.env.DEV_CHANNEL_ID &&
    "production" === process.env.NODE_ENV
  )
    return;
  try {
    if (!message?.author.bot) {
      // send discord message to redpanda broker
      await MessageProducer.sendMessage(message);
    }
  } catch (error) {
    console.error("onMessageCreateError:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  if (
    interaction.channelId === process.env.DEV_CHANNEL_ID &&
    "production" === process.env.NODE_ENV
  )
    return;
  if (interaction.isButton()) {
    // Send user response to redpanda broker
    await sendUserResponse(interaction);
  }
  // check if interaction is not a slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName == "start-quiz") {
      // send quiz request
      await sendQuizRequest(interaction);
    } else if (interaction.commandName == "ask-ai-anything") {
      const response = await interaction.reply("AI is thinking...");
      generateAnswerForDiscordBotAI(
        interaction.options.get("question")?.value?.toString() ||
          "Could not generate AI answer"
      )
        .then((aiAnswer) => {
          response.edit(aiAnswer.answer);
        })
        .catch((err) => {
          console.error("Error generating AI answer:", err);
          response.edit("Could not generate AI answer");
        });
    }
  }
});

process.on("SIGINT", async () => {
  console.log("Closing app...");
  try {
    // Disconnect producers and consumers from repanda broker
    await disconnectRedpanda();
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});
