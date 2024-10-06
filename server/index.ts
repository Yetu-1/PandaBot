import env from "dotenv";
import { Client, GatewayIntentBits, Message } from "discord.js";
import * as KafkaAdmin from "./redpanda/admin.js";
import * as KafkaProducer from "./redpanda/producer.js";
import * as KafkaConsumer from "./redpanda/consumer.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

env.config();

KafkaAdmin.createTopic("filter-discord");

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const sendMessage = await KafkaProducer.getConnection();
  if (sendMessage) {
    await sendMessage(message);
  }
});

KafkaConsumer.connect(async (message) => {
  const messageObject = JSON.parse(message.value?.toString() || "{}");

  const channel = await client.channels.fetch(messageObject.message.channelId);

  //   channel?.isSendable() && (await channel.send(messageObject.message.content));
  console.log("Received message:", channel);
});