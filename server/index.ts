import env from "dotenv";
import { discord_client } from "./services/config.js";

import { CommandInteractionOption, GatewayIntentBits } from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as MessageProducer from "./redpanda/producers/DiscordMsgProducer.js";
import * as MessageConsumer from "./redpanda/consumers/ToxicityCheckConsumer.js";

import * as QuizProducer from "./redpanda/producers/QuizResponseProducer.js";
import * as QuizConsumer from "./redpanda/consumers/QuizResponseConsumer.js";

import * as QuizDBProducer from "./redpanda/producers/QuizRequestProducer.js";
import * as QuizDBConsumer from "./redpanda/consumers/QuizGenerationConsumer.js";

import * as EndQuizProducer from "./redpanda/producers/EndQuizProducer.js";
import * as EndQuizConsumer from "./redpanda/consumers/EndQuizConsumer.js";

import { registerCommands } from "./services/registerCommands.js";
import { sendUserResponse } from "./services/sendUserResponse.js";
import { endQuiz } from "./redpanda/consumers/EndQuizConsumer.js";

env.config();

async function sendMessage(content: string, channelId: string) {
  try {
    if (!channelId) {
      throw new Error(
        "CHANNEL_ID is not defined in the environment variables."
      );
    }
    const channel = await discord_client.channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(content);
    }
  } catch (error) {
    console.error("Error:", error);
  }
} 

async function sendDiscordQuiz(
  messageObj: {
    embeds: any;
    components: any;
  },
  channelId: string
) {
  try {
    if (!channelId) {
      throw new Error(
        "CHANNEL_ID is not defined in the environment variables."
      );
    }
    const channel = await discord_client.channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(messageObj);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function setupServer() {
  try {
    // Create topic
    // const msg_topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
    const quiz_topic = process.env.QUIZ_RESPONSE_TOPIC || "default-topic";
    const quiz_db_topic = process.env.QUIZ_DB_TOPIC || "default-topic";
    await Admin.createTopic([quiz_topic, quiz_db_topic]);
    // Connect producers to repanda broker
    // await MessageProducer.connect();
    await QuizProducer.connect();
    await QuizDBProducer.connect();
    await EndQuizProducer.connect();
    // Initialize consumners to repanda broker and subscribe to specified topic to consume messages
    // await MessageConsumer.init();
    await QuizConsumer.init();
    await QuizDBConsumer.init();
    await EndQuizConsumer.init();
    // Login discord bot
  discord_client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error:", error);
  }
}
 
setupServer();

discord_client.on("ready", () => {
  console.log("Bot is online!");
})

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {

  } catch (error) {
    console.error("Error:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  if(interaction.isButton()) {
    // Send user response to redpanda broker
    sendUserResponse(interaction);
  }
  // check if interaction is not a slash command
  if (interaction.isChatInputCommand()) {
    if(interaction.commandName == 'start-quiz') {
      // Get all options
      const file1 = interaction.options.get('file1');
      const file2 = interaction.options.get('file2');
      const duration = interaction.options.get('duration') || { name: 'duration', type: 10, value: 0 }
      const time = duration.value as number;
      interaction.reply(`The quiz is about to start. Duration: ${duration.value}!`);
  
      if(file1 && file1.attachment) {
        const files: CommandInteractionOption[] = [];
        files.push(file1);
        if(file2 && file2.attachment) // if the second file exists
          files.push(file2);
        // send quiz to quiz generation consumer to generate, store and start quiz
        await QuizDBProducer.sendQuiz(files, interaction.channelId, time);
      }
    }
  }
});

process.on("SIGINT", async () => {
  console.log("Closing app...");
  try {
    // Disconnect producer and consumer from repanda broker
    await MessageProducer.disconnect();
    await MessageConsumer.disconnect();
    await QuizProducer.disconnect();
    await QuizConsumer.disconnect();
    await QuizDBProducer.disconnect();
    await QuizDBConsumer.disconnect();
    await EndQuizProducer.disconnect();
    await EndQuizConsumer.disconnect();
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});
