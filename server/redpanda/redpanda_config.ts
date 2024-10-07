import env from "dotenv";
import { Kafka, KafkaConfig } from "kafkajs";

env.config();

const config: KafkaConfig = {
  brokers: JSON.parse(process.env.KAFKA_BROKERS || '["localhost:9092"]'),
  //   sasl: {
  //     mechanism: "plain",
  //     username: process.env.KAFKA_USERNAME || "",
  //     password: process.env.KAFKA_PASSWORD || "",
  //   },
};
export const redpanda = new Kafka(config);
