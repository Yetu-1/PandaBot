import { ChatInputCommandInteraction, CommandInteractionOption } from "discord.js";
import * as QuizDBProducer from "../redpanda/producers/QuizRequestProducer.js";
import { FileObj } from "./models.js";

export async function sendQuizRequest(interaction: ChatInputCommandInteraction) {
  console.log(interaction.options.get("file1"));
    try {
      // get files from command
      const files: FileObj[] = getFilesFromChatCommandInteraction(interaction);
      // Get duration
      const duration = interaction.options.get("duration") || {
        name: "duration",
        type: 10,
        value: 0,
      };
      const num_of_questions = interaction.options.get(
        "number-of-questions"
      ) || {
        name: "number-of-questions",
        type: 10,
        value: 0,
      };

      const time = duration.value as number;
      interaction.reply(
        `📢 **The quiz is about to start!**\n\n⏳ **Duration:** ${duration.value} minutes.\n\nPlease wait a moment while the quiz is being generated. A **Participate** button will be sent shortly!`
      );
      // send quiz to quiz generation consumer to generate, store and start quiz
      await QuizDBProducer.sendQuiz(
        files,
        interaction.channelId,
        time,
        num_of_questions.value as number
      );
    }catch(error) {
        console.error("Error sending quiz request: ", error)
    }
}

function getFilesFromChatCommandInteraction( interaction: ChatInputCommandInteraction<any> ): FileObj[] {
  const files: FileObj[] = [];
  const file1: CommandInteractionOption | null = interaction.options.get("file1");
  const file2: CommandInteractionOption | null = interaction.options.get("file2");
  if (file1 && file1.attachment) {
    files.push({
      name: file1.attachment.name,
      url: file1.attachment.url,
    });
  }
  if (file2 && file2.attachment) {
    files.push({
      name: file2.attachment.name,
      url: file2.attachment.url,
    });
  }
  return files;
}