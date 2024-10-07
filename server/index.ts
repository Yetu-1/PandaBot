import env from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { checkMsgSafety } from "./checkMessageSafety.js";

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
    // console.log(message);
    // console.log(message.content);
    const toxicity: any = await checkMsgSafety(message.content);
    if(!message?.author.bot) {
        if(toxicity > 60) {
            message.channel.send(`WARNING!! Toxic Language @${message.author.globalName}`) // echo back message
            message.delete();
        }
    }
});