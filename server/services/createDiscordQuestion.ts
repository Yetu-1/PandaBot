import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { QuizQuestion } from "./models.js";

function getEmojiFromNumber(number: number): string {
  switch (number) {
    case 1:
      return "1️⃣";
    case 2:
      return "2️⃣";
    case 3:
      return "3️⃣";
    case 4:
      return "4️⃣";
    case 5:
      return "5️⃣";

    default:
      return "";
  }
}

export function createQuizMessage(question: QuizQuestion): {
  embeds: any;
  components: any;
} {
  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(`(${question.number}) ${question.question}`)
    .setDescription(question.options.map((option, index) => `${getEmojiFromNumber(index + 1)}  ${option}` ).join('\n\n'));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    question.options.map((_, index) =>
      new ButtonBuilder()
        .setCustomId(`qz:${question.quiz_id}:${question.number}:${index + 1}`)
        .setLabel(`${index + 1}`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  return { embeds: [embed], components: [row] };
}
