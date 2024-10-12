import { redpanda } from "./redpanda_config.js";
import { discord_client } from "../index.js";
import { checkMsgSafety } from "../services/checkMessageSafety.js";
import env from "dotenv"
import { TextChannel } from "discord.js";

env.config();

const groupId = process.env.GROUP_ID || "default-groupy";
const topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";

const consumer = redpanda.consumer({ groupId });

export async function init() {
  try {
    // Connect consumer to redpanda broker
    await consumer.connect();
    // Subscribe to specified topic
    await consumer.subscribe({ topic: topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageObject = JSON.parse(message.value?.toString() || "{}");
        const messageContent = messageObject.message.content;
        // Fetch channel and cast the channel as Textchannel cause it has the "messages" property
        const channel = await discord_client.channels.fetch(messageObject.message.channelId) as TextChannel; 
        const author = await discord_client.users.fetch(messageObject.message.authorId);
        const toxicity: any = await checkMsgSafety(messageContent);
        if(toxicity > 60) {
          console.log("Sending warning")
          // Send warning to message author
          channel?.isSendable() && (await channel.send(`WARNING!! Toxic Language @${author.globalName}`));
          // Delete message from discord channel
          await channel.messages.delete(messageObject.message.id);
        }
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
