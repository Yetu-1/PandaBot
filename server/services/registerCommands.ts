import { ApplicationCommandOptionType, REST, Routes } from "discord.js";
import env from "dotenv";

env.config();

const token = process.env.DISCORD_TOKEN!;
const bot_id = process.env.DISCORD_BOT_ID!;

const rest = new REST({ version: "10" }).setToken(token);

const commands = [
  {
    name: "start-quiz",
    description: "Starts quiz",
    options: [
      {
        name: "file1",
        description: "File containing course content",
        type: ApplicationCommandOptionType.Attachment,
        required: true,
      },
      {
        name: "number-of-questions",
        description: "Duration of quiz in minutes",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "duration",
        description: "Duration of quiz in minutes",
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
      {
        name: "file2",
        description: "Optional second file containing course content",
        type: ApplicationCommandOptionType.Attachment,
      },
    ],
  },
  {
    name: "ask-ai-anything",
    description: "Ask AI anything",
    options: [
      {
        name: "question",
        description: "Question to ask AI",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

// TODO: register when bot is added to server
export async function registerCommands(guild_id : string): Promise<boolean> {
  try {
    await rest.put(Routes.applicationGuildCommands(bot_id, guild_id), {
      body: commands,
    });
    console.log("Slash commands were registerd successfully");
    return true;
  } catch (error) {
    console.error("RegisterCommandsError: ", error);
    return false;
  }
}
