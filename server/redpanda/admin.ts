import { redpanda } from "./redpanda_config";

const admin = redpanda.admin();
export async function createTopic(
  topic: string,
  partitions?: number,
  replicas?: number
) {
  await admin.connect();
  const existingTopics = await admin.listTopics();
  if (!existingTopics.includes(topic)) {
    await admin.createTopics({
      topics: [
        {
          topic: topic,
          numPartitions: partitions ? partitions : 1,
          replicationFactor: replicas ? replicas : 1,
        },
      ],
    });
  }
  await admin.disconnect();
}

export async function topicExists(topic: string) {
  await admin.connect();
  const existingTopics = await admin.listTopics();
  await admin.disconnect();
  return existingTopics.includes(topic);
}
