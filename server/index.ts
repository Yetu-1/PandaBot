import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  CommandInteractionOption,
  Message,
} from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as MessageConsumer from "./redpanda/consumers/toxicity_check_consumer.js";
import * as MessageProducer from "./redpanda/producers/discord_msg_producer.js";
import { discord_client } from "./services/config.js";
import { createQuizMessage } from "./services/createDiscordQuestion.js";
import { generateQuiz } from "./services/generateQuiz.js";
import { FileObj, Quiz } from "./services/models.js";

import * as QuizConsumer from "./redpanda/consumers/quiz_response_consumer.js";
import * as QuizProducer from "./redpanda/producers/quiz_response_producer.js";

import { saveQuiz } from "./services/dataAccess/quizRepository.js";
import generateAnswerForDiscordBotAI from "./services/generateAnswerForDiscordBotAI.js";
import { registerCommands } from "./services/registerCommands.js";

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
    registerCommands();
  } catch (error) {
    console.error("InitializeError:", error);
  }
}

function getFilesFromChatCommandInteraction(
  interaction: ChatInputCommandInteraction<any>
): FileObj[] {
  const files: FileObj[] = [];
  const file1: CommandInteractionOption | null =
    interaction.options.get("file1");
  const file2: CommandInteractionOption | null =
    interaction.options.get("file2");
  if (file1 && file1.attachment) {
    files.push({
      name: file1.name,
      url: file1.attachment.url,
    });
  }
  if (file2 && file2.attachment) {
    files.push({
      name: file2.name,
      url: file2.attachment.url,
    });
  }
  return files;
}

function getFilesFromMessage(message: Message): FileObj[] {
  const files: FileObj[] = [];
  if (message.attachments.size > 0) {
    message.attachments.forEach((attachment) => {
      files.push({
        name: attachment.name,
        url: attachment.url,
      });
    });
  }
  return files;
}

setupServer();

discord_client.on("ready", () => {
  console.log("Bot is online!");
});

discord_client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  try {
    if (message.attachments.size > 0) {
      console.log("Message has attachments");
      const quizStr = await generateQuiz(getFilesFromMessage(message));
      const quiz: Quiz = JSON.parse(quizStr); //

      const discordQuestions: {
        embeds: any;
        components: any;
      }[] = quiz.questions.map((q, index) =>
        createQuizMessage(q, index + 1, quiz.id)
      );

      discordQuestions.forEach((q) => {
        sendDiscordQuiz(q, message.channel.id);
      });
      console.log(quiz);
    }
    // await Producer.sendMessage(message);
  } catch (error) {
    console.error("onMessageCreateError:", error);
  }
});

discord_client.on("interactionCreate", async (interaction) => {
  console.log("NewInteraction", interaction);
  if (!interaction.isButton) {
    const buttonInteraction = interaction as ButtonInteraction;
    const params = buttonInteraction.customId.split(":");
    // filter by quiz button. structure of quiz button = 'qz:quizid:qn:opt'
    if (params[0] != "qz") return;
    console.log(params);
  }
  // check if interaction is not a slash command
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName == "start-quiz") {
    const files = getFilesFromChatCommandInteraction(interaction);
    const duration = interaction.options.get("duration") || {
      name: "duration",
      type: 10,
      value: 0,
    };

    interaction.reply(
      `The quiz is about to start. Duration: ${duration.value}!`
    );

    if (files.length > 0) {
      const quiz = await generateQuiz(files);

      if (quiz.status == "success") {
        await saveQuiz(quiz, interaction.channelId);
      }
      await sendMessage(quiz, interaction.channelId);
      console.log(quiz);
    }
  } else if (interaction.commandName == "ask-ai-anything") {
    const aiAnswer = await generateAnswerForDiscordBotAI(
      interaction.options.get("question")?.value?.toString() ||
        "Could not generate AI answer"
    );
    if (aiAnswer.status == "success") {
      interaction.reply(aiAnswer.answer);
    } else {
      interaction.reply(`Could not generate AI answer
        reason: ${aiAnswer.error}`);
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
