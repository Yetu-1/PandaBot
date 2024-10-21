import { redpanda } from "../redpanda_config.js";
import { calculateScores, getScores } from "../../services/dataAccess/scoreRepository.js";
import { QuizStatus } from "../../services/models.js";
import { getQuiz, setQuizStatus } from "../../services/dataAccess/quizRepository.js";
import env from "dotenv"
import { EmbedBuilder } from "discord.js";
import { discord_client } from "../../services/config.js";
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
        await endQuiz(quiz_id);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function endQuiz(quiz_id : string ) {
    try {
        // calculate scores of each user and save scores in the database
        const resp = await calculateScores(quiz_id);
        if(resp) {
            // Get Quiz
            const quiz = await getQuiz(quiz_id);
            // set quiz status from "active" to "done" in database
            await setQuizStatus(quiz_id, QuizStatus.Done);
            // send end of quiz message and score board
            const scores = await  getScores(quiz_id);
            if(scores != "Error") {
                await sendLeaderboard(quiz.quiz_title, scores, quiz.channel_id);
            }
        }
    } catch (error) {
    console.error("Error:", error);
  }
}

async function sendLeaderboard(quiz_title: string, scores : any[], channel_id: string) {  
    // Create button row for each answer
    const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle('Scores')
    .setDescription(`${quiz_title} Quiz`)
    .addFields(
        {
            name: "Leaderboard",
            value: scores.map(user => `${user.username.padEnd(15, ' ')} | ${user.score}`).join('\n'), // Align names and scores
            inline: false // Keep as false to ensure proper layout
        }
    )
  
    const scoreBoard = {
      embeds: [embed]
    };
    try {
        const channel = await discord_client.channels.fetch(channel_id);
        if (channel && channel.isSendable()) {
          await channel.send(scoreBoard)
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
