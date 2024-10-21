import { redpanda } from "../redpanda_config.js";
import { calculateScores } from "../../services/dataAccess/scoreRepository.js";
import { QuizStatus } from "../../services/models.js";
import { setQuizStatus } from "../../services/dataAccess/quizRepository.js";
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
        const quiz_id = messageObject.quiz_id;
        console.log(quiz_id);

      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function endQuiz(quiz_id : string ) {
    try {
        // calculate scores of each user and saved scores in the database
        const resp = await calculateScores(quiz_id);
        if(resp) {
            // set quiz status from "active" to "done" in database
            await setQuizStatus(quiz_id, QuizStatus.Done);
            // send end of quiz message and leaderboard
        }
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
