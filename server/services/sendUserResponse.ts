import { ButtonInteraction } from "discord.js";
import { QuizUserResponse} from "./models.js";

import * as QuizProducer from "../redpanda/producers/QuizResponseProducer.js";

export async function sendUserResponse(interaction: ButtonInteraction) {
  const params = interaction.customId.split(":");
  // filter by quiz button. structure of quiz button = 'qz:quizid:qn:ans' or 'qz:quizid:participate / start / revise buttons
  if (params[0] != "qz" && params.length <= 0) return;

  if (params[2] == "participate" || params[2] == "start" || params[2] == "revise") {
    if (params[2] == "participate"  || params[2] == "revise") {
      await interaction.reply({
        content: `**Check your dm for the ${(params[2] == "participate")? "start quiz button**" : "questions and answers**"}`,
        ephemeral: true,
      });
    } else {
      // delete start quiz button
      const message = await interaction.channel?.messages.fetch(
        interaction.message.id
      );
      message?.delete();
    }
    const user_response: QuizUserResponse = {
      user_id: interaction.user.id,
      username: interaction?.user.globalName || "",
      quiz_id: params[1],
      question_number: "0",
      answer: "",
      type: params[2],
    };
    await QuizProducer.sendUserResponse(user_response);
  } else {
    // Delete message
    const message = await interaction.channel?.messages.fetch(
      interaction.message.id
    );
    message?.delete();

    const user_response: QuizUserResponse = {
      user_id: interaction.user.id,
      username: interaction.user.globalName || "",
      quiz_id: params[1],
      question_number: params[2],
      answer: params[3],
      type: "answer",
    };
    await QuizProducer.sendUserResponse(user_response);
  }
}
