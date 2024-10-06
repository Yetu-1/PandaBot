import { redpanda } from "./redpanda_config";
import { Message } from "discord.js";

const topic = process.env.FILTER_DISCORD_TOPIC || "filter-discord";
const producer = redpanda.producer();
export async function getConnection() {
  try {
    await producer.connect();
    return async (message: Message) => {
      await producer.send({
        topic: topic,
        messages: [{ value: JSON.stringify({ message }) }],
      });
    };
  } catch (error) {
    console.error("Error:", error);
  }
}
export async function disconnect() {
  try {
    await producer.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}
