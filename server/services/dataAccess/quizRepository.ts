import env from "dotenv"
import pg from "pg"
import { v4 as uuidv4 } from 'uuid';
import { storeQuestions } from "./questionRepository.js";
import { Quiz, QuizEntry } from "../models.js";

env.config();

export const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT) ,
});

db.connect();

export async function saveQuiz(quiz: Quiz) : Promise<boolean> {
    try {
        const quiz_id = uuidv4();
        const new_quiz: QuizEntry = {
            id: quiz_id,
            title: quiz.title,
            channel_id: quiz.channelId,
        }
        // save quiz into database
        let resp = await createQuizEntry(new_quiz);
        if(resp) {
            // save each question entry into the database
            resp = await storeQuestions(quiz.questions, quiz_id);
            return resp;
        }
        return resp;
    }catch (err) {
        console.error("Error saving quiz", err);
        return false;
    }
}

async function createQuizEntry(quiz: QuizEntry): Promise<boolean>{
    console.log(quiz)
    try {
        await db.query("INSERT INTO quiz (quiz_id, quiz_title, channel_id) VALUES ($1, $2, $3)", [quiz.id, quiz.title, quiz.channel_id])
        return true;
    }catch (err) {
        console.error("Error storing quiz", err);
        return false;
    }
}