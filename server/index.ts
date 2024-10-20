import env from "dotenv";
import { discord_client } from "./services/config.js";
import { createQuizMessage } from "./services/createDiscordQuestion.js";
import { generateQuiz } from "./services/generateQuiz.js";
import { Quiz, QuizUserAnswer } from "./services/models.js";
import { ButtonInteraction } from "discord.js";
import { getJSDocReturnType } from "typescript";
import { Client, CommandInteractionOption, GatewayIntentBits } from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as MessageProducer from "./redpanda/producers/DiscordMsgProducer.js";
import * as MessageConsumer from "./redpanda/consumers/ToxicityCheckConsumer.js";

import * as QuizProducer from "./redpanda/producers/QuizResponseProducer.js";
import * as QuizConsumer from "./redpanda/consumers/QuizResponseConsumer.js";

import * as QuizDBProducer from "./redpanda/producers/QuizRequestProducer.js";
import * as QuizDBConsumer from "./redpanda/consumers/QuizGenerationConsumer.js";

import { registerCommands } from "./services/registerCommands.js";
import { saveQuiz } from "./services/dataAccess/quizRepository.js";
import { sendUserResponse } from "./services/sendUserResponse.js";
import { calculateScores } from "./services/dataAccess/scoreRepository.js";

env.config();

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

async function setupServer() {
  try {
    // // Create topic
    // // const msg_topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
    // const quiz_topic = process.env.QUIZ_RESPONSE_TOPIC || "default-topic";
    // const quiz_db_topic = process.env.QUIZ_DB_TOPIC || "default-topic";
    // await Admin.createTopic([quiz_topic, quiz_db_topic]);
    // // Connect producers to repanda broker
    // // await MessageProducer.connect();
    // await QuizProducer.connect();
    // await QuizDBProducer.connect();
    // // Initialize consumners to repanda broker and subscribe to specified topic to consume messages
    // // await MessageConsumer.init();
    // await QuizConsumer.init();
    // await QuizDBConsumer.init();
    // Login discord bot
  // discord_client.login(process.env.DISCORD_TOKEN);
    await calculateScores('07dba886-b432-49c5-9695-df2655f3b961');
  } catch (error) {
    console.error("Error:", error);
  }
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
    //   const quiz: Quiz = {
    //     status: 'success',
    //     title: 'Color Theory Quiz',
    //     id: 'e818fe5d-27a6-48f0-ae74-3224f16e9ac3',
    //     channelId: message.channelId,
    //     questions: [
    //       {
    //         question: 'Which of the following color pairs are considered complementary in the RGB color model?',
    //         options: [ 'Red-Green', 'Green-Magenta', 'Blue-Orange', 'Yellow-Purple' ],
    //         answer: '2'
    //       },
    //       {
    //         question: 'According to the RYB color model, blue is complementary to which color?',
    //         options: [ 'Orange', 'Yellow', 'Green', 'Red' ],
    //         answer: '1'
    //       },
    //       {
    //         question: 'What is produced when complementary colors are combined?',
    //         options:  [
    //           'A new color',
    //           'A vibrant pattern',
    //           'A grayscale color',
    //           'A warm tone'
    //         ],
    //         answer: '3'
    //       },
    //       {
    //         question: 'Which theory suggests that red-green and blue-yellow are the most contrasting pairs?',
    //         options: [
    //           'RGB Color Model',
    //           'CMY Subtractive Model',
    //           'Opponent Process Theory',
    //           'RYB Color Model'
    //         ],
    //         answer: '3'
    //       },
    //       {
    //         question: 'What is a common pair of complementary colors in all color theories?',
    //         options: [ 'Red-Green', 'Blue-Yellow', 'Black-White', 'Purple-Orange' ],
    //         answer: '3'
    //       }
    //     ]
    //   }
    //   const discordQuestions: {
    //     embeds: any;
    //     components: any;
    //   }[] = quiz.questions.map((q, index) => createQuizMessage(q, index+1, quiz.id));

    //   discordQuestions.forEach((q) => {
    //     sendDiscordQuiz(q, message.channel.id);
    //   });
    //   console.log(quiz);
    // }
  } catch (error) {
    console.error("Error:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  if(interaction.isButton()) {
    // Send user response to redpanda broker
    sendUserResponse(interaction);
  }
  // check if interaction is not a slash command
  if (interaction.isChatInputCommand()) {
    if(interaction.commandName == 'start-quiz') {
      // Get all options
      const file1 = interaction.options.get('file1');
      const file2 = interaction.options.get('file2');
      const duration = interaction.options.get('duration') || { name: 'duration', type: 10, value: 0 }
  
      interaction.reply(`The quiz is about to start. Duration: ${duration.value}!`);
  
      if(file1 && file1.attachment) {
        const files: CommandInteractionOption[] = [];
        files.push(file1);
        if(file2 && file2.attachment) // if the second file exists
          files.push(file2);
        // send quiz to quiz generation consumer to generate, store and start quiz
        await QuizDBProducer.sendQuiz(files, interaction.channelId);
      }
    }
  }
});

process.on("SIGINT", async () => {
  console.log("Closing app...");
  try {
    // Disconnect producer and consumer from repanda broker
    await MessageProducer.disconnect();
    await MessageConsumer.disconnect();
    await QuizProducer.disconnect();
    await QuizConsumer.disconnect();
    await QuizDBProducer.disconnect();
    await QuizDBConsumer.disconnect();
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});
