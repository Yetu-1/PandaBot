import { redpanda } from "../redpanda_config.js";
import { storeUserAnswer } from "../../services/dataAccess/userAnswerRepository.js";
import env from "dotenv"
env.config();

const groupId = process.env.END_QUIZ_GROUP_ID || "default-groupy";
const topic = process.env.END_QUIZ_TOPIC || "default-topic";

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
        const response = messageObject.quiz_id;
        console.log("i am here at the end quiz consumer!")
        console.log(response);

      }
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
