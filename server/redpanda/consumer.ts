import { EachMessagePayload, Message } from "kafkajs";
import { redpanda } from "./redpanda_config.js";
import env from "dotenv"
import { discord_client } from "../index.js";

env.config();

const groupId = process.env.GROUP_ID || "default-groupy";
const topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";

const consumer = redpanda.consumer({ groupId });

export async function init() {
  // connect consumer to the broker 
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageObject = JSON.parse(message.value?.toString() || "{}");

        const channel = await discord_client.channels.fetch(messageObject.message.channelId);
      
        channel?.isSendable() && (await channel.send(messageObject.message.content)); // this is where the filtering should happen
         //await channel?.messages.fetch(messageObject.message.channelId);
        console.log("Received message:", channel);
      },
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}
