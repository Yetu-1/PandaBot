import { ButtonInteraction } from "discord.js";
import { QuizUserAnswer } from "./models.js";

import * as QuizProducer from "../redpanda/producers/QuizResponseProducer.js";
import * as QuizConsumer from "../redpanda/consumers/QuizResponseConsumer.js";

export async function sendUserResponse(interaction:  ButtonInteraction) {
    const params = interaction.customId.split(':');
    // filter by quiz button. structure of quiz button = 'qz:quizid:qn:ans' or 'qz:quizid:participate for participate button
    if(params[0] != 'qz' && params.length <= 0) return;
    
    if(params[2] == 'participate') {
      interaction.reply(
        { 
          content: "Check your dm for the start quiz button",
          ephemeral: true
        }
      );
      const user_response : QuizUserAnswer = {
        user_id: interaction.user.id,
        quiz_id: params[1],
        question_number: '',
        answer: '',
        type: 'participate'
      }
      await QuizProducer.sendUserResponse(user_response);
    }else {
     const user_response : QuizUserAnswer = {
        user_id: interaction.user.id,
        quiz_id: params[1],
        question_number: params[2],
        answer: params[3],
        type: 'answer'
      }
      await QuizProducer.sendUserResponse(user_response);
    }
  }