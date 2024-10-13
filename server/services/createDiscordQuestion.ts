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

export function createQuizMessage(quiz: QuizQuestion): {
  embeds: any;
  components: any;
} {
  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("Quiz Time!")
    .setDescription(quiz.question);

  quiz.options.forEach((option, index) => {
    embed.addFields({
      name: `${getEmojiFromNumber(index + 1)}`,
      value: option,
      inline: true,
    });
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    quiz.options.map((_, index) =>
      new ButtonBuilder()
        .setCustomId(`option_${index + 1}`)
        .setLabel(`${index + 1}`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  return { embeds: [embed], components: [row] };
}
