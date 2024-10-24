import { discord_client } from "./services/config.js";
import { setupRedpanda, disconnectRedpanda } from "./redpanda/redpandaManager.js";
import generateAnswerForDiscordBotAI from "./services/generateAnswerForDiscordBotAI.js";
import { registerCommands } from "./services/registerCommands.js";
import { sendUserResponse } from "./services/sendUserResponse.js";
import { sendQuizRequest } from "./services/sendQuizRequest.js";
import express from "express"

const app = express();
const port = 3000;

app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile("./index.html");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})

async function setupServer() {
  try {
    // setup redpanda producers and consumers
    await setupRedpanda();
    // Login discord bot
    discord_client.login(process.env.DISCORD_TOKEN);
    //registerCommands();
  } catch (error) {
    console.error("InitializeError:", error);
  }
}

setupServer();

discord_client.on("ready", async() => {
  console.log("Bot is online!");
});

discord_client.on("guildCreate", async (guild) => {
  try{
    console.log(`Guild ${guild.id} has added pandabot`)
    // register guild 
    await registerCommands(guild.id);
  }catch(error) {
    console.error("Error registering commands on guid create: ", error);
  }
});

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
  } catch (error) {
    console.error("onMessageCreateError:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
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
      const aiAnswer = await generateAnswerForDiscordBotAI(
        interaction.options.get("question")?.value?.toString() ||
          "Could not generate AI answer"
      );
      if (aiAnswer.status == "success") {
        interaction.reply(aiAnswer.answer);
      } else {
        interaction.reply(`Could not generate AI answer
          reason: ${aiAnswer.error}`);
      }
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