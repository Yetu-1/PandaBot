import fs from "fs";
import OpenAI from "openai";
import { AIAnswerDiscord } from "./models.js";

const openai = new OpenAI();

async function generateAnswerForDiscordBotAI(
  prompt: string
): Promise<AIAnswerDiscord> {
  if (prompt === "")
    return {
      question: "",
      status: "failure",
      answer: "",
      error: "Prompt is empty",
    };
  try {
    const systemPromptPath =
      "services/generateAIAnswerPrompt.txt";
    const systemPrompt = fs.readFileSync(systemPromptPath, "utf-8");
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
    });

    const discordAnswer: AIAnswerDiscord = JSON.parse(
      completion.choices[0].message.content!
    );

    return discordAnswer;
  } catch (err) {
    console.error("GenerateAIAnswerError:", err);
    return {
      question: "",
      status: "failure",
      answer: "",
      error: (err as Error).message,
    };
  }
}

export default generateAnswerForDiscordBotAI;
