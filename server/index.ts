import env from "dotenv";
import * as Consumer from "./redpanda/consumer.js";
import * as Producer from "./redpanda/producer.js";
import { discord_client } from "./services/config.js";
import { createQuizMessage } from "./services/createDiscordQuestion.js";
import { generateQuiz } from "./services/generateQuiz.js";
import { Quiz } from "./services/models.js";
import { ButtonInteraction } from "discord.js";
import { getJSDocReturnType } from "typescript";

async function sendMessage(content: string, channelId: string) {
  try {
    if (!channelId) {
      throw new Error(
        "CHANNEL_ID is not defined in the environment variables."
      );
    }
    const channel = await discord_client.channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(content);
    }
  } catch (error) {
    console.error("Error:", error);
  }
} 

async function sendDiscordQuiz(
  messageObj: {
    embeds: any;
    components: any;
  },
  channelId: string
) {
  try {
    if (!channelId) {
      throw new Error(
        "CHANNEL_ID is not defined in the environment variables."
      );
    }
    const channel = await discord_client.channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(messageObj);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

env.config();

async function setupServer() {
  // try {
  //   // Create topic
  //   const topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
  //   await Admin.createTopic(topic);
  //   // Connect producer to repanda broker
  //   await Producer.connect();
  //   // Initialize consumner to repanda broker and subscribe to specified topic to consume messages
  //   await Consumer.init();
  //   // Login discord bot
  await discord_client.login(process.env.DISCORD_TOKEN);
  // } catch (error) {
  //   console.error("Error:", error);ff
  // }
}

setupServer();

discord_client.on("ready", () => {
  console.log("Bot is online!");
})

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
    // if (message.attachments.size > 0) {
    //   console.log("Message has attachments");
      // const quizStr = await generateQuiz(message);
      // const quiz: Quiz = JSON.parse(quizStr); //
      const quiz: Quiz = {
        status: 'success',
        id: '3748474372782487',
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
      const discordQuestions: {
        embeds: any;
        components: any;
      }[] = quiz.questions.map((q, index) => createQuizMessage(q, index+1, quiz.id));

      discordQuestions.forEach((q) => {
        sendDiscordQuiz(q, message.channel.id);
      });
      console.log(quiz);
    // }
    // await Producer.sendMessage(message);
  } catch (error) {
    console.error("Error:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  if(!interaction.isButton) return;
  const buttonInteraction = interaction as ButtonInteraction;
  const params = buttonInteraction.customId.split(':');
  // filter by quiz button. structure of quiz button = 'qz:quizid:qn:opt'
  if(params[0] != 'qz') return;
  console.log(params)
});

process.on("SIGINT", async () => {
  console.log("Closing app...");
  try {
    // Disconnect producer and consumer from repanda broker
    await Producer.disconnect();
    await Consumer.disconnect();
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});
