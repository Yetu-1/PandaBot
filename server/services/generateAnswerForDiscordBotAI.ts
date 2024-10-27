import fs from "fs";
import OpenAI from "openai";
import { AIAnswerDiscord } from "./models.js";

const openai = new OpenAI();

function getSystemPrompt() {
  const systemPromptPath = "services/prompts/generateAIAnswerPrompt.txt";
  return fs.readFileSync(systemPromptPath, "utf-8");
}

export async function generateAnswerForDiscordBotAI(
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
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: getSystemPrompt(),
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

export async function continueConversation(
  prompt: string,
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
): Promise<AIAnswerDiscord> {
  console.info("ContinueConversationPrompt:", prompt, messages);
  return new Promise(async (resolve, reject) => {
    if (prompt === "")
      reject({
        question: "",
        status: "failure",
        answer: "",
        error: "Prompt is empty",
      });
    try {
      const completion = await openai.chat.completions.create({
        messages: messages.concat({
          role: "system",
          content: getSystemPrompt(),
        }),
        model: "gpt-4o-mini",
      });

      const discordAnswer: AIAnswerDiscord = JSON.parse(
        completion.choices[0].message.content!
      );

      if(discordAnswer.status === "failure") {
        reject(discordAnswer);
      }

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