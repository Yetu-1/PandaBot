import env from "dotenv"
import pg from "pg"
import { v4 as uuidv4 } from 'uuid';
import { storeQuestions } from "./questionRepository.js";

env.config();

export const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT) ,
});

db.connect();

type QuizEntry = {
    id: string
    title: string
    channel_id: string
}
export type Question = {
    question: string
    options: string[]
    answer: number
}

type Quiz = {
    status: string
    title: string
    questions: Question[]
}


export async function saveQuiz(quiz: Quiz, channel_id: string) {
    try {
        const quiz_id = uuidv4();
        const new_quiz: QuizEntry = {
            id: quiz_id,
            title: quiz.title,
            channel_id: channel_id
        }
        
        let resp = await createQuizEntry(new_quiz);

        if(resp) {
            resp = await storeQuestions(quiz.questions, quiz_id);
        }
    }catch (err) {
        console.error("Error saving quiz", err);
    }
}

async function createQuizEntry(quiz: QuizEntry) {
    console.log(quiz)
    try {
        await db.query("INSERT INTO quiz (quiz_id, quiz_title, channel_id) VALUES ($1, $2, $3)", [quiz.id, quiz.title, quiz.channel_id])
        return true;
    }catch (err) {
        console.error("Error storing quiz", err);
        return false;
    }
}