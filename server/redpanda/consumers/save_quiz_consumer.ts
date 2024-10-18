import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import env from "dotenv"
import { saveQuiz } from "../../services/dataAccess/quizRepository.js";
import { Quiz } from "../../services/models.js";

env.config();

const groupId = process.env.QUIZ_DB_GROUP_ID || "default-groupy";
const topic = process.env.QUIZ_DB_TOPIC || "default-topic";

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
        console.log("consumer received quiz object");
        console.log(messageObject);
        await saveQuiz(messageObject.quiz);
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
