import * as Admin from "./admin.js";

// import * as MessageConsumer from "./consumers/ToxicityCheckConsumer.js";
// import * as MessageProducer from "./producers/DiscordMsgProducer.js";

import * as QuizConsumer from "./consumers/QuizResponseConsumer.js";
import * as QuizProducer from "./producers/QuizResponseProducer.js";

import * as QuizDBConsumer from "./consumers/QuizGenerationConsumer.js";
import * as QuizDBProducer from "./producers/QuizRequestProducer.js";

import * as EndQuizConsumer from "./consumers/EndQuizConsumer.js";
import * as EndQuizProducer from "./producers/EndQuizProducer.js";


export async function setupRedpanda() {
    try {
        // Create topic
        // const msg_topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
        const quiz_topic = process.env.QUIZ_RESPONSE_TOPIC || "default-topic";
        const quiz_db_topic = process.env.QUIZ_DB_TOPIC || "default-topic";
        const discord_msg_topic = process.env.DISCORD_MESSAGES_TOPIC || "default-topic";
        const end_quiz_topic = process.env.END_QUIZ_TOPIC || "default-topic";
        await Admin.createTopic([quiz_topic, quiz_db_topic, discord_msg_topic, end_quiz_topic]);
        // Connect producers to repanda broker
        // await MessageProducer.connect();
        await QuizProducer.connect();
        await QuizDBProducer.connect();
        await EndQuizProducer.connect();
        // Initialize consumners to repanda broker and subscribe to specified topic to consume messages
        // await MessageConsumer.init();
        await QuizConsumer.init();
        await QuizDBConsumer.init();
        await EndQuizConsumer.init();
        console.log("All redpanda resources connected!")
    }catch(error) {
        console.error("Error setting up redpanda: ", error);
    }
}

export async function disconnectRedpanda() {
    try{
        // Disconnect producers and consumers from repanda broker
        // await MessageProducer.disconnect();
        // await MessageConsumer.disconnect();
        await QuizProducer.disconnect();
        await QuizConsumer.disconnect();
        await QuizDBProducer.disconnect();
        await QuizDBConsumer.disconnect();
        await EndQuizProducer.disconnect();
        await EndQuizConsumer.disconnect();
    }catch (error) {
        console.error("Error disconnecting producers and consumers: ", error)
    }
}