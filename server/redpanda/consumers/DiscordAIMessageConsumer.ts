import { Message } from "discord.js";
import { discord_client } from "../../services/config.js";
import { DiscordAIMessage } from "../../services/dataAccess/dbModels.js";
import { continueConversation } from "../../services/generateAnswerForDiscordBotAI.js";
import { redpanda } from "../redpanda_config.js";

const groupId = process.env.DISCORD_AI_MESSAGES_GROUP_ID!;
const topic = process.env.DISCORD_MESSAGES_TOPIC!;

const consumer = redpanda.consumer({ groupId });

async function fetchMessage(
  id: string,
  channelId: string
): Promise<Message | undefined> {
  if (!id || !channelId) {
    throw new Error("Message ID or Channel ID is undefined");
  }
  const channel = await discord_client.channels.fetch(channelId);

  if (channel && channel.isTextBased()) {
    return channel.messages.fetch(id);
  }

  return undefined;
}

export async function init() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageJSON = JSON.parse(message.value?.toString() || "{}");

        console.log(
          "messageId:",
          messageJSON.id,
          "channelId:",
          messageJSON.channelId,
          "messageJSON:",
          messageJSON
        );
        const messageObject = await fetchMessage(
          messageJSON.message.id,
          messageJSON.message.channelId
        );

        if (!messageObject || messageObject.author.bot) return;

        if (messageObject.reference?.messageId != null) {
          const referencedMessage = await DiscordAIMessage.findOne({
            where: { id: messageObject.reference.messageId },
          });

          if (referencedMessage != null) {
            //load all previous messages in the conversation
            const messages = await DiscordAIMessage.findAll({
              where: { conversationId: referencedMessage.conversationId },
            });

            continueConversation(
              messageObject.content,
              messages.map((message) => {
                return {
                  content: message.content,
                  role: message.role,
                };
              })
            )
              .then(async (aiAnswer) => {
                //add user message to db
                DiscordAIMessage.create({
                  id: messageObject.id,
                  content: messageObject.content,
                  authorId: messageObject.author.id,
                  conversationId: referencedMessage.conversationId,
                  role: "user",
                });
                const aiMessage = await messageObject.reply(aiAnswer.answer);
                DiscordAIMessage.create({
                  id: aiMessage.id,
                  content: aiAnswer.answer,
                  authorId: aiMessage.author.id,
                  conversationId: referencedMessage.conversationId,
                  role: "assistant",
                });
              })
              .catch((err) => {
                console.error("AICOnversationContinuationError", err);
                messageObject.reply("Could not continue conversation");
              });
          }
        }
      },
    });
  } catch (error) {
    console.error("InitializingDiscordAIMessageConsumer", error);
  }
}

export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("DisconnectingDiscordAIMessageConsumerError", error);
  }
}
