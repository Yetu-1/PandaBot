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
const fileds_per_embed = 3;
const questions_per_embed = 9;
const questions_per_field = 3;

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
    console.error("Error initializing end quiz consumer: ", error);
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
    console.error("Error sending start quiz prompt: ", error);
  }
}

export async function sendUserAnswerReport(quiz_id: string, user_id: string) {
  try {
    // Get all the questions for the quiz
    const questions = await getQuestions(quiz_id);
    // Get all the user's answers
    const user_answers = await getUserAnswers(quiz_id, user_id);
    if(questions != 'NONE' && questions != "Error") {
      // create embeds for the report
      const embeds = createEmbeds(questions, user_answers);
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

function createEmbeds(questions : any[], user_answers? : any[]) : EmbedBuilder[] {
  const length = questions.length;
  const total_no_of_embeds = Math.ceil(length / questions_per_embed);  // round up
  // console.log("Total no of Embeds: ", total_no_of_embeds);
  let total_no_of_fields = Math.ceil(length / questions_per_field); 
  // console.log("Total no of Fields: ", total_no_of_fields);
  let current_question : number = 0;
  let embeds : EmbedBuilder[] = [];
  const heading = new EmbedBuilder()
  .setColor(0x3498db)
  .setTitle("Thats a wrap!")
  .setDescription('Time to see how you did.\n\n**Review Questions**')
  embeds.push(heading);

  for(let i = 0; i < total_no_of_embeds; i++) {
    const embed = new EmbedBuilder();
    for(let j = 0; j < fileds_per_embed && total_no_of_fields > 0; j++) {
      // Slice the array into a subarray of a set of 4 questions and add them to a field
      let curr_set : string = questions.slice(current_question, current_question+questions_per_field).map((question : any, index : number) => {
        const question_number = current_question + index + 1;
        let answer = '';
        return (
          `(${question_number}) ${question.question}\n` + 
          question.options.map((option : string, index:number) => {
            const opt_text = ` (${index+1}) ${option} `;
            if(user_answers) {
              // filter the array for the user's answer that corresponds to the current question
              const user_answer = user_answers.filter((answer : any) => (question_number) == answer.number);
              let suffix = ''
              // check if the current option is the correct answer and add the check to indicate that
              if(index+1 == question.answer )
                suffix = '✅';
              
              else if(index+1 == user_answer[0].answer && index+1 != question.answer) // if the current option is the user's answer and also the current option
                suffix = '❌';
              return ( opt_text + suffix)
            }else {
              if(index+1 == question.answer )
                answer = option;

              return opt_text;
            }
          })
          .join('\n')
          + `${(user_answers)? "" : `\n\nAns: ${answer}`}`
        )
      }).join('\n\n')

      curr_set = `\`\`\`\n${curr_set}\n\`\`\`` // put the current set of questions in a code block
      // add field containing 4 questions to the embed
      embed.addFields(
        {
            name: "...",
            value: curr_set
        }
      )
      current_question += questions_per_field;
      total_no_of_fields--;
    }
    // add the embed to the list of embeds
    embeds.push(embed);
  }

  return embeds;
}

export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error disconnecting quiz response consumer: ", error);
  }
}