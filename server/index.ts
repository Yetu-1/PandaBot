import env from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import {google} from 'googleapis';
import { check_text_safety } from "./textFliter.js";

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
    const toxicity: any = await check_text_safety(message.content);
    if(!message?.author.bot) {
        if(toxicity > 60) {
            message.channel.send(`WARNING!! Toxic Language @${message.author.globalName}`) // echo back message
            message.delete();
        }
    }
});

// const discovery_url: string = String(process.env.DISCOVERY_URL);

// google.discoverAPI(discovery_url)
//     .then((client: any) => {
//       const analyzeRequest = {
//         comment: {
//           text: 'Jiminy cricket! Well gosh pussy it! Oh damn it all!',
//         },
//         requestedAttributes: {
//           TOXICITY: {},
//         },
//       };

//       client.comments.analyze(
//           {
//             key: process.env.GOOGLE_API_KEY,
//             resource: analyzeRequest,
//           },
//           (err: any, response: any) => {
//             if (err) throw err;
//             console.log(JSON.stringify(response.data, null, 2));
//           });
// })
// .catch(err => {
//     throw err;
// });