import { EachMessagePayload, Message } from "kafkajs";
import { redpanda } from "./redpanda_config.js";

const groupId = process.env.GROUP_ID || "default-groupy";
const topic = process.env.FILTER_DISCORD_TOPIC || "filter_discord_messages";
const consumer = redpanda.consumer({ groupId });
export async function connect(
  handleMessage?: (message: Message) => Promise<void>
) {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic });
    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        if (handleMessage) {
          await handleMessage(message);
        }

        console.log(`messageContent: ${message.value}`);
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
