import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import env from "dotenv"
import { saveQuiz, setQuizStatus } from "../../services/dataAccess/quizRepository.js";
import { Quiz } from "../../services/models.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { generateQuiz } from "../../services/generateQuiz.js";
import * as EndQuizProducer from "../producers/EndQuizProducer.js";
import { QuizStatus } from "../../services/models.js";

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
        console.log(messageObject);
        // Generate quiz
        const question_count = messageObject.question_count;
        const quiz = await generateQuiz(messageObject.files, question_count);
        if(quiz.status == 'success') {
          // save quiz into database
          const quiz_id = await saveQuiz(quiz as Quiz, messageObject.channelId);
          // send participate button to discord channel
          await sendParticpateButton(quiz as Quiz, quiz_id, messageObject.channelId);
          // Start timer
          let delay = 1000 * 60; // minutes to milliseconds
          delay = delay * messageObject.duration;
          // Setting timeout for endquiz function
          setTimeout(async () => {
            await endQuiz(quiz_id);  // Call the function after the delay
          }, delay );
          await setQuizStatus(quiz_id, QuizStatus.Active);

        }else {
          try {
            const channel = await discord_client.channels.fetch(messageObject.channelId);
            if (channel && channel.isSendable()) {
              await channel.send("Could not Generate Quiz!");
            }
          } catch (error) {
            console.error("Error sending Could not Generate Quiz! msg: ", error);
          }
        }
      },
    });
  } catch (error) {
    console.error("Error initializing quiz generation consumer: ", error);
  }
}

async function endQuiz(quiz_id : string) {
  try {
    // end quiz producer
    await EndQuizProducer.endQuiz(quiz_id);
  }catch (error) {
    console.error("Error sending end quiz id to redpanda broker: ", error);
  }
}

async function sendParticpateButton(quiz: Quiz, quiz_id: string, channel_id: string) {  
  // Create button row for each answer
  const embed = new EmbedBuilder()
  .setColor(0x3498db)
  .setTitle(`Join the ${quiz.title} quiz now!`)

  const participate_button = new ButtonBuilder()
  .setCustomId(`qz:${quiz_id}:participate`)
  .setLabel('Participate')
  .setStyle(ButtonStyle.Primary)

  const revise_button = new ButtonBuilder()
  .setCustomId(`qz:${quiz_id}:revise`)
  .setLabel('Revise')
  .setStyle(ButtonStyle.Secondary)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents([participate_button, revise_button]);

  const message = {
    embeds: [embed],
    components: [row]
  };

  try {
    const channel = await discord_client.channels.fetch(channel_id);
    if (channel && channel.isSendable()) {
      await channel.send(message);
    }
  } catch (error) {
    console.error("Error sending participate button: ", error);
  }
}

export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error disconnecting quiz generation consumer: ", error);
  }
}

