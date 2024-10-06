import env from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import * as KafkaAdmin from "./redpanda/admin.ts";
import * as KafkaProducer from "./redpanda/producer.ts";
import * as KafkaConsumer from "./redpanda/consumer.ts";

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

//export async function connect(handleMessage?: (message: any) => Promise<void>)
KafkaConsumer.connect(async (message) => {
  console.log("Received message:", message);
});