import env from "dotenv";
import { Client, GatewayIntentBits, Message } from "discord.js";
import * as Admin from "./redpanda/admin.js";
import * as Producer from "./redpanda/producer.js";
import * as Consumer from "./redpanda/consumer.js";
import OpenAI from "openai";


const Questions = [
  {
    question: "What is the colors of an apple",
    options: [
      "Orange", "Pink", "Blue", "Green"
    ]
  },
  {
    question: "What is the name of the Nigerian President",
    options: [
      "Poverty", "City Boy", "Batman", "Tinubu"
    ]
  },
  {
    question: "What is the current Price of fuel",
    options: [
      "1600", "1000", "400", "150"
    ]
  }
]

export const discord_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

env.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();
const example_text = "The development of television systems Mechanical systems The dream of seeing distant places is as old as the human imagination. Priests in ancient Greece studied the entrails of birds, trying to see in them what the birds had seen when they flew over the horizon. They believed that their gods, sitting in comfort on Mount Olympus, were gifted with the ability to watch human activity all over the world. And the opening scene of William Shakespeare’s play Henry IV, Part 1 introduces the character Rumour, upon whom the other characters rely for news of what is happening in the far corners of England. For ages it remained a dream, and then television came along, beginning with an accidental discovery. In 1872, while investigating materials for use in the transatlantic cable, English telegraph worker Joseph May realized that a selenium wire was varying in its electrical conductivity. Further investigation showed that the change occurred when a beam of sunlight fell on the wire, which by chance had been placed on a table near the window. Although its importance was not realized at the time, this happenstance provided the basis for changing light into an electric signal. In 1880 a French engineer, Maurice LeBlanc, published an article in the journal La Lumière électrique that formed the basis of all subsequent television. LeBlanc proposed a scanning mechanism that would take advantage of the retina’s temporary but finite retainment of a visual image. He envisaged a photoelectric cell that would look upon only one portion at a time of the picture to be transmitted. Starting at the upper left corner of the picture, the cell would proceed to the right-hand side and then jump back to the left-hand side, only one line lower. It would continue in this way, transmitting information on how much light was seen at each portion, until the entire picture was scanned, in a manner similar to the eye reading a page of text. A receiver would be synchronized with the transmitter, reconstructing the original image line by line. The concept of scanning, which established the possibility of using only a single wire or channel for transmission of an entire image, became and remains to this day the basis of all television. LeBlanc, however, was never able to construct a working machine. Nor was the man who took television to the next stage: Paul Nipkow, a German engineer who invented the scanning disk. Nipkow’s 1884 patent for an Elektrisches Telescop was based on a simple rotating disk perforated with an inward-spiraling sequence of holes. It would be placed so that it blocked reflected light from the subject. As the disk rotated, the outermost hole would move across the scene, letting through light from the first “line” of the picture. The next hole would do the same thing slightly lower, and so on. One complete revolution of the disk would provide a complete picture, or “scan,” of the subject"
async function testOpenAi() {
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",

    messages: [
      {
        "role": "system",
        "content": [
          {
            "type": "text",
            "text": `
              You are a helpful assistant That creates multiple choice quizes, 5 questions with 4 
              answer options from text prompts and returns an array of questions in this format: 
              [
                {
                  question: "",
                  options: [
                    "Orange", "Pink", "Blue", "Green"
                  ]
                }
              ]
            `
          }
        ]
      },
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": example_text
          }
        ]
      }
    ]
  });
  console.log(completion.choices[0].message);
}

async function setupServer() {
  testOpenAi()
  // try {
  //   // Create topic
  //   const topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
  //   await Admin.createTopic(topic);
  //   // Connect producer to repanda broker 
  //   await Producer.connect();
  //   // Initialize consumner to repanda broker and subscribe to specified topic to consume messages
  //   await Consumer.init();
  //   // Login discord bot 
  //   discord_client.login(process.env.DISCORD_TOKEN);
  // } catch (error) {
  //   console.error("Error:", error);
  // }
}

setupServer();

discord_client.on("messageCreate", async (message) => {
  console.log(message);
  // if (message.author.bot) return;
  // try {
  //   await Producer.sendMessage(message);
  // } catch (error) {
  //   console.error("Error:", error);
  // }

});

process.on("SIGINT", async () => {
  console.log('Closing app...');
  try {
    // Disconnect producer and consumer from repanda broker
    await Producer.disconnect();
    await Consumer.disconnect(); 
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  } finally {
    console.log('Cleanup finished. Exiting');
    process.exit(0);
  }
});