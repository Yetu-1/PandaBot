import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import { getUserAnswers, storeUserAnswer } from "../../services/dataAccess/userAnswerRepository.js";
import env from "dotenv"
import { QuizQuestion, QuizUserResponse } from "../../services/models.js";
import { getQuestion, getQuestions } from "../../services/dataAccess/questionRepository.js";
import { createQuizMessage } from "../../services/createDiscordQuestion.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, getUserAgentAppendix } from "discord.js";
import { createReportEmbeds, createRevisionEmbeds } from "../../services/createEmbeds.js";
import { calculateUserScore } from "../../services/dataAccess/scoreRepository.js";
env.config();

const groupId = process.env.QUIZ_RESPONSE_GROUP || "default-groupy";
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
        }else if(response.type == 'revise') {
          await sendQuizRevision(response); // send questions and answers for the quiz
        }
      },
    });
  } catch (error) {
    console.error("Error initializing end quiz consumer: ", error);
  }
}

async function sendNextQuestion(lastAnswer: QuizUserResponse) {
    try {
      // Fetch next queston from DB
      const resp = await getQuestion(lastAnswer.quiz_id, Number(lastAnswer.question_number)+1);
      if(resp != 'End' && resp != 'Error') {
        // send that question to User's DM
        await sendQuestion(resp, lastAnswer.user_id);
      }if(resp == 'End') {
        const user = await discord_client.users.fetch(lastAnswer.user_id);
        if (user) {
          // Send user answer report
          await sendUserAnswerReport(lastAnswer.quiz_id, lastAnswer.user_id);
        }
      }
      // console.log(resp);
    } catch (error) {
      console.error("Error sending next question: ", error);
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
    console.error("Error sending question: ", error);
  }
} 

async function sendStartQuizPrompt(quiz: QuizUserResponse) {  
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
    console.error("Error sending start quiz prompt: ", error);
  }
}

async function sendUserAnswerReport(quiz_id: string, user_id: string) {
  try {
    // Get all the questions for the quiz
    const questions = await getQuestions(quiz_id);
    // Get all the user's answers
    const user_answers = await getUserAnswers(quiz_id, user_id);
    // calculate user score
    const user_score = await calculateUserScore(quiz_id, user_id);

    if(questions != 'NONE' && questions != "Error" && user_score != "Error") {
      // create embeds for the report
      const embeds = createReportEmbeds(questions, user_answers, user_score);
      const report = {
        embeds: embeds
      };
      const user = await discord_client.users.fetch(user_id);
      if (user) {
        await user.send(report);
      }
    }
  }catch (error) {
    console.error("Error sending user answer report: ", error);
  }
}

async function sendQuizRevision(response: QuizUserResponse) {
  const user = await discord_client.users.fetch(response.user_id);
  // Get all the questions for the quiz
  const questions = await getQuestions(response.quiz_id);
  if(questions != 'NONE' && questions != "Error") {
    const embeds = createRevisionEmbeds(questions);
    const quiz = {
      embeds: embeds
    };
    if (user) {
      await user.send(quiz);
    }
  }else {
    if (user) {
      await user.send("Could not fetch Quiz!");
    }
  }
}

export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error disconnecting quiz response consumer: ", error);
  }
}