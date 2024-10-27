import fs from "fs";
import OpenAI from "openai";
import { AIAnswerDiscord } from "./models.js";

const openai = new OpenAI();

async function generateAnswerForDiscordBotAI(
  prompt: string
): Promise<AIAnswerDiscord> {
  return new Promise(async (resolve, reject) => {
    if (prompt === "")
      reject({
        question: "",
        status: "failure",
        answer: "",
        error: "Prompt is empty",
      });
    try {
      const systemPromptPath = "services/prompts/generateAIAnswerPrompt.txt";
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

      resolve(discordAnswer);
    } catch (err) {
      console.error("GenerateAIAnswerError:", err);
      reject({
        question: "",
        status: "failure",
        answer: "",
        error: (err as Error).message,
      });
    }
  });
}

export default generateAnswerForDiscordBotAI;
