import { redpanda } from "../redpanda_config.js";
import env from "dotenv"

env.config();

const topic = process.env.END_QUIZ_TOPIC || "default-topic";
const producer = redpanda.producer();

export async function connect() {
  // Connect producer to the redpanda broker
  try {
    await producer.connect();
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function endQuiz(quiz_id : string) {
  // Send message to the specified topic
  try {
    await producer.send({
      topic: topic,
      messages: [{ value: JSON.stringify({ quiz_id }) }]
    });
  }catch (error) {
    console.error("Error:", error);
  }
}

export async function disconnect() {
  try {
    // Disconnet producer from redpanda broker
    await producer.disconnect();
  } catch (error) {
    console.error("Error:", error);
  } 
}
