import { redpanda } from "./redpanda_config.js";

const admin = redpanda.admin();
export async function createTopic( topics: string[], partitions?: number, replicas?: number ) {
  await admin.connect();
  const existingTopics = await admin.listTopics();
  let newTopics = topics.filter((topic) => (!existingTopics.includes(topic)))

  await admin.createTopics({
    topics: newTopics.map((topic) => (
      {
        topic: topic,
        numPartitions: partitions ? partitions : 1,
        replicationFactor: replicas ? replicas : 3,
      }
    ))
  });
  await admin.disconnect();
}