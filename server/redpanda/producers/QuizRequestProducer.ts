import { CommandInteractionOption } from "discord.js";
import { redpanda } from "../redpanda_config.js";
import env from "dotenv"
import { FileObj } from "../../services/models.js";

env.config();

const topic = process.env.QUIZ_DB_TOPIC || "default-topic";
const producer = redpanda.producer();

export async function connect() {
  // Connect producer to the redpanda broker
  try {
    await producer.connect();
  } catch (error) {
    console.error("Error connecting quiz request producer: ", error);
  }
}

export async function sendQuiz(files: FileObj[], channelId: string, duration: number, question_count: number) {
  // Send message to the specified topic
  try {
    await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify({ files, channelId, duration, question_count }) }]
    });
  }catch (error) {
    console.error("Error sending quiz to repanda broker: ", error);
  }
}

export async function disconnect() {
  try {
    // Disconnet producer from redpanda broker
    await producer.disconnect();
  } catch (error) {
    console.error("Error disconnection quiz request producer: ", error);
  } 
}
