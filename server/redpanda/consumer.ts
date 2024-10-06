import { redpanda } from "./redpanda_config.ts";

const groupId = process.env.GROUP_ID || "default-group";
const topic = process.env.FILTER_DISCORD_TOPIC || "filter_discord_messages";
const consumer = redpanda.consumer({ groupId });
export async function connect(handleMessage?: (message: any) => Promise<void>) {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: topic });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const formattedValue = JSON.parse((message.value as Buffer).toString());
        if (handleMessage) {
          await handleMessage(formattedValue);
        }

        console.log(`messageContent: ${formattedValue.content}`);
      },
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
export async function disconnect() {
  try {
    await consumer.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}
