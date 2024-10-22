import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import { getUserAnswers, storeUserAnswer } from "../../services/dataAccess/userAnswerRepository.js";
import env from "dotenv"
import { QuizQuestion, QuizUserAnswer } from "../../services/models.js";
import { getQuestion, getQuestions } from "../../services/dataAccess/questionRepository.js";
import { createQuizMessage } from "../../services/createDiscordQuestion.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, getUserAgentAppendix } from "discord.js";
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
      }if(resp == 'End') {
        const user = await discord_client.users.fetch(lastAnswer.user_id);
        if (user) {
          // Send user answer report
          await sendUserAnswerReport(lastAnswer.quiz_id, lastAnswer.user_id);
        }
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

export async function sendUserAnswerReport(quiz_id: string, user_id: string) {
  try {
    // Get all the questions for the quiz
    const questions = await getQuestions(quiz_id);
    // Get all the user's answers
    const user_answers = await getUserAnswers(quiz_id, user_id);
    console.log(user_answers);
    if(questions != 'NONE' && questions != "Error") {
      let report_content = questions.map( (question : any) => {
        return (
          `(${question.number}) ${question.question}\n` + 
          question.options.map((option : string, index:number) => {
            const opt_text = ` (${index+1}) ${option} `;
            const user_answer = user_answers.filter((answer : any) => question.number == answer.number); // get user answer for the question
            let suffix = ''
            if(index+1 == question.answer ) 
              suffix = '✅';
            else if(index+1 == user_answer[0].answer && index+1 != question.answer)
              suffix = '❌';
            return ( opt_text + suffix)
          })
          .join('\n')
        )
      }).join('\n\n\n')
      
      report_content = `\`\`\`\n${report_content}\n\`\`\`` // put the report in a code block
      // construct message
      // Create button row for each answer
      const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("Thats a wrap!")
      .setDescription('Time to see how you did.')
      .addFields(
          {
              name: 'Review Questions and Answers:',
              value: report_content
          }
      )

      const report = {
      embeds: [embed]
      };
      const user = await discord_client.users.fetch(user_id);
      if (user) {
        await user.send(report);
      }
    }
  }catch (error) {
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