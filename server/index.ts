import env from "dotenv";
import { Client, CommandInteractionOption, GatewayIntentBits } from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as MessageProducer from "./redpanda/producers/discord_msg_producer.js";
import * as MessageConsumer from "./redpanda/consumers/toxicity_check_consumer.js";

import * as QuizProducer from "./redpanda/producers/quiz_response_producer.js";
import * as QuizConsumer from "./redpanda/consumers/quiz_response_consumer.js";

import { generateQuiz } from "./services/generateQuiz.js";
import { registerCommands } from "./services/registerCommands.js";
import { saveQuiz } from "./services/dataAccess/quizRepository.js";


env.config();

export const discord_client = new Client({
  intents: [ 
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

async function setupServer() {
  try {
    // Create topic
    const msg_topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
    const quiz_topic = process.env.QUIZ_RESPONSE_TOPIC || "default-topic";
    await Admin.createTopic([msg_topic, quiz_topic]);
    // Connect producers to repanda broker
    await MessageProducer.connect();
    await QuizProducer.connect();
    // Initialize consumners to repanda broker and subscribe to specified topic to consume messages
    await MessageConsumer.init();
    await QuizConsumer.init();
    // Login discord bot
  discord_client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error("Error:", error);
  }
}
 
setupServer();

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
    if (message.attachments.size > 0) {
      // const quiz = await generateQuiz(message);
      // sendMessage(quiz, message.channel.id);
      // console.log(quiz);
    }
    // await Producer.sendMessage(message);
  } catch (error) {
    console.error("Error:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  // check if interaction is not a slash command
  if (!interaction.isChatInputCommand()) return;

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
      const quiz = await generateQuiz(files);
      // const quiz = {
      //   status: 'success',
      //   title: 'Color Theory Quiz',
      //   questions: [
      //     {
      //       question: 'Which of the following color pairs are considered complementary in the RGB color model?',
      //       options: [ 'Red-Green', 'Green-Magenta', 'Blue-Orange', 'Yellow-Purple' ],
      //       answer: 2
      //     },
      //     {
      //       question: 'According to the RYB color model, blue is complementary to which color?',
      //       options: [ 'Orange', 'Yellow', 'Green', 'Red' ],
      //       answer: 1
      //     },
      //     {
      //       question: 'What is produced when complementary colors are combined?',
      //       options:  [
      //         'A new color',
      //         'A vibrant pattern',
      //         'A grayscale color',
      //         'A warm tone'
      //       ],
      //       answer: 3
      //     },
      //     {
      //       question: 'Which theory suggests that red-green and blue-yellow are the most contrasting pairs?',
      //       options: [
      //         'RGB Color Model',
      //         'CMY Subtractive Model',
      //         'Opponent Process Theory',
      //         'RYB Color Model'
      //       ],
      //       answer: 3
      //     },
      //     {
      //       question: 'What is a common pair of complementary colors in all color theories?',
      //       options: [ 'Red-Green', 'Blue-Yellow', 'Black-White', 'Purple-Orange' ],
      //       answer: 3
      //     }
      //   ]
      // }
      
      if(quiz.status == 'success') {
        // store quiz in database
        await saveQuiz(quiz, interaction.channelId);
      }
      await sendMessage(quiz, interaction.channelId);
      console.log(quiz);
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
  } catch (err) {
    console.error("Error during cleanup:", err);
    process.exit(1);
  } finally {
    console.log("Cleanup finished. Exiting");
    process.exit(0);
  }
});