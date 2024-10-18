import { redpanda } from "../redpanda_config.js";
import { discord_client } from "../../services/config.js";
import env from "dotenv"
import { saveQuiz } from "../../services/dataAccess/quizRepository.js";
import { Quiz } from "../../services/models.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { generateQuiz } from "../../services/generateQuiz.js";

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

        // Generate quiz
        //const quiz = await generateQuiz(messageObject.files);
      
        const quiz: any = {
          status: 'success',
          title: 'Color Theory Quiz',
          questions: [
            {
              question: 'Which of the following color pairs are considered complementary in the RGB color model?',
              options: [ 'Red-Green', 'Green-Magenta', 'Blue-Orange', 'Yellow-Purple' ],
              answer: '2'
            },
            {
              question: 'According to the RYB color model, blue is complementary to which color?',
              options: [ 'Orange', 'Yellow', 'Green', 'Red' ],
              answer: '1'
            },
            {
              question: 'What is produced when complementary colors are combined?',
              options:  [
                'A new color',
                'A vibrant pattern',
                'A grayscale color',
                'A warm tone'
              ],
              answer: '3'
            },
            {
              question: 'Which theory suggests that red-green and blue-yellow are the most contrasting pairs?',
              options: [
                'RGB Color Model',
                'CMY Subtractive Model',
                'Opponent Process Theory',
                'RYB Color Model'
              ],
              answer: '3'
            },
            {
              question: 'What is a common pair of complementary colors in all color theories?',
              options: [ 'Red-Green', 'Blue-Yellow', 'Black-White', 'Purple-Orange' ],
              answer: '3'
            }
          ]
        }
        console.log(messageObject.channelId);
        // save quiz into database
        const quiz_id = await saveQuiz(quiz, messageObject.channelId);
        // send participate button to discord channel
        await sendParticpateButton(quiz, quiz_id, messageObject.channelId);
      },
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendParticpateButton(quiz: Quiz, quiz_id: string, channelId: string) {  
  // Create button row for each answer
  const embed = new EmbedBuilder()
  .setColor(0x3498db)
  .setTitle(`Join the ${quiz.title} now!`)

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
    .setCustomId(`qz:${quiz_id}:participate`)
    .setLabel('Participate')
    .setStyle(ButtonStyle.Primary)
  );

  const message = {
    embeds: [embed],
    components: [row]
  };

  try {
    const channel = await discord_client.channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(message);
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

