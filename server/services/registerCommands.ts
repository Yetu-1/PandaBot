import {REST, Routes, ApplicationCommandOptionType} from "discord.js"
import env from "dotenv"
import { file } from "googleapis/build/src/apis/file/index.js";

env.config();

const token = process.env.DISCORD_TOKEN || "";
const bot_id = process.env.BOT_ID || "";
const guild_id = process.env.GUILD_ID || "";

const rest = new REST({version: '10'}).setToken(token);

const commands = [
    {
        name: 'start-quiz',
        description: 'Starts quiz',
        options: [
            {
                name: "file1",
                description: "File containing course content",
                type: ApplicationCommandOptionType.Attachment,
                required: true
            },
            {
                name: "duration",
                description: "Duration of quiz in minutes",
                type: ApplicationCommandOptionType.Number,
                required: true
            },
            {
                name: "file2",
                description: "Optional second file containing course content",
                type: ApplicationCommandOptionType.Attachment,
            }
        ]
    },
];

// TODO: register when bot is added to server
export async function registerCommands() : Promise<boolean> {
    try {
        console.log('Registering slash commands...')
        await rest.put(
            Routes.applicationGuildCommands(bot_id, guild_id),
            {body: commands}
        )
        console.log("Slash commands were registerd successfully")
        return true;
    } catch (error) {
        console.error("Error registering commands: ", error);
        return false;
    }
}
