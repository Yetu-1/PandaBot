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

export async function endQuiz(quiz_id : string ) {
    try {
        // calculate scores of each user and save scores in the database
        const resp = await calculateScores(quiz_id);
        if(resp) {
            console.log("sending embed!")
            // Get Quiz
            const quiz = await getQuiz(quiz_id);
            console.log(quiz);
            // set quiz status from "active" to "done" in database
            await setQuizStatus(quiz_id, QuizStatus.Done);
            // send end of quiz message and score board
            const scores = await getScores(quiz_id);
            console.log(scores);
            if(scores != "Error") {
                await sendLeaderboard(quiz.quiz_title, scores, quiz.channel_id);
            }
        }
    } catch (error) {
    console.error("Error:", error);
  }
}

async function sendLeaderboard(quiz_title: string, scores : any[], channel_id: string) {  
    const padding = 4;
    const maxLength = Math.max(...scores.map(user => user.username.length)) + padding; // needed to properly format the table
    const fieldtitle = "Name".padEnd(maxLength, ' ') + '  |  ' + "Score"
    try {
        // Create button row for each answer
        const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("Time's Up! Check Your Score")
        .setDescription(`${quiz_title} Quiz`)
        .addFields(
            {
                name: 'Score board',
                value: `\`\`\`\n${fieldtitle}\n${scores.map(user => `${user.username.padEnd(maxLength, ' ')}  |  ${user.score}`).join('\n')}\n\`\`\``,
            }
        )
    
        const scoreBoard = {
        embeds: [embed]
        };
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
