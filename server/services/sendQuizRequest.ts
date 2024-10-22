import { ChatInputCommandInteraction, CommandInteractionOption } from "discord.js";
import * as QuizDBProducer from "../redpanda/producers/QuizRequestProducer.js";
import { FileObj } from "./models.js";

export async function sendQuizRequest(interaction: ChatInputCommandInteraction) {
  console.log(interaction.options.get("file1"));
    try {
        // get files from command
        const files : FileObj[] = getFilesFromChatCommandInteraction(interaction);
        // Get duration
        const duration = interaction.options.get("duration") || {
            name: "duration",
            type: 10,
            value: 0,
        };
        const time = duration.value as number;
        interaction.reply(
        `The quiz is about to start. Duration: ${duration.value} minutes!`
        );
        // send quiz to quiz generation consumer to generate, store and start quiz
        await QuizDBProducer.sendQuiz(files, interaction.channelId, time);
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
        name: file2.name,
        url: file2.attachment.url,
      });
    }
    console.log(files);
    return files;
}