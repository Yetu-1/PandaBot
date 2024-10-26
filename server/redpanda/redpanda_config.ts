import env from "dotenv";
import { Kafka, KafkaConfig } from "kafkajs";

env.config();

const config: KafkaConfig = {
  brokers: JSON.parse(process.env.KAFKA_BROKERS || '["localhost:9092"]'),
  ssl: {
    },
  sasl: {
    mechanism: "scram-sha-256",
    username: process.env.KAFKA_USERNAME || 'your_username', 
    password: process.env.KAFKA_PASSWORD || 'your_password', 
  }
};
export const redpanda = new Kafka(config);
