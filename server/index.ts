import env from "dotenv";
import { Client, GatewayIntentBits, Message } from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as Producer from "./redpanda/producer.js";
import * as Consumer from "./redpanda/consumer.js";
import OpenAI from "openai";
import { generateQuiz } from "./services/generateQuiz.js";

export const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

env.config();

async function setupServer() {
  // try {
  //   // Create topic
  //   const topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
  //   await Admin.createTopic(topic);
  //   // Connect producer to repanda broker
  //   await Producer.connect();
  //   // Initialize consumner to repanda broker and subscribe to specified topic to consume messages
  //   await Consumer.init();
  //   // Login discord bot
  discord_client.login(process.env.DISCORD_TOKEN);
  // } catch (error) {
  //   console.error("Error:", error);ff
  // }
}

setupServer();

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
    if (message.attachments.size > 0) {
      const quiz = await generateQuiz(message);
      sendMessage(quiz, message.channel.id);
      console.log(quiz);
    }
    // await Producer.sendMessage(message);
  } catch (error) {
    console.error("Error:", error);
  }
});

process.on("SIGINT", async () => {
  console.log("Closing app...");
  try {
    // Disconnect producer and consumer from repanda broker
    await Producer.disconnect();
    await Consumer.disconnect();
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});