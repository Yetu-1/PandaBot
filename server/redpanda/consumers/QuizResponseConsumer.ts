import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import { storeUserAnswer } from "../../services/dataAccess/userAnswerRepository.js";
import env from "dotenv"
import { QuizQuestion, QuizUserAnswer } from "../../services/models.js";
import { getQuestion } from "../../services/dataAccess/questionRepository.js";
import { createQuizMessage } from "../../services/createDiscordQuestion.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
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
        const response = messageObject.answer;
        // console.log(response);
        if(response.type === 'answer') {
          // Save user response into database
          await storeUserAnswer(response);
          // console.log("user answer saved!")
          // send next question
          await sendNextQuestion(response);

        }else if (response.type == 'participate') {
          await sendStartQuizPrompt(response);
        }else if(response.type == 'start') {
          await sendNextQuestion(response);
        }
      },
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendNextQuestion(lastAnswer: QuizUserAnswer) {
    try {
      // Fetch next queston from DB
      const resp = await getQuestion(lastAnswer.quiz_id, Number(lastAnswer.question_number)+1);
      if(resp != 'End' && resp != 'Error') {
        // send that question to User's DM
        await sendQuestion(resp, lastAnswer.user_id);
      }
      // console.log(resp);
    } catch (error) {
      console.error("Error:", error);
    }
}

async function sendQuestion(question : any, userId: string) {
  delete question.id;
  const discordQuestion: {
    embeds: any;
    components: any;
  } = createQuizMessage(question as QuizQuestion);
  try {
    const user = await discord_client.users.fetch(userId);
    if (user) {
      await user.send(discordQuestion);
    }
  } catch (error) {
    console.error("Error:", error);
  }
} 

async function sendStartQuizPrompt(quiz: QuizUserAnswer) {  
  // Create button row for each answer
  const embed = new EmbedBuilder()
  .setColor(0x3498db)
  .setTitle(`Start the quiz now!`)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
    .setCustomId(`qz:${quiz.quiz_id}:start`)
    .setLabel('Start')
    .setStyle(ButtonStyle.Primary)
  );

  const message = {
    embeds: [embed],
    components: [row]
  };

  try {
    const user = await discord_client.users.fetch(quiz.user_id);
    await user.send(message);
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
