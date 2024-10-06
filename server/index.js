import env from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

env.config();

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", async (message) => {
    console.log(message);

    if(!message?.author.bot) {
        message.channel.send(`Echo ${message.content}`) // echo back message
    }
});