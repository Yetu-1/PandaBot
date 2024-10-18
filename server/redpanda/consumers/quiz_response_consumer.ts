import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import env from "dotenv"

env.config();

const groupId = process.env.QUIZ_GROUP_ID || "default-groupy";
const topic = process.env.QUIZ_RESPONSE_TOPIC || "default-topic";

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

        //TODO: save user response into database
        //TODO: send next question to user
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
