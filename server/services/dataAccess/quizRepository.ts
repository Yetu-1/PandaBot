import env from "dotenv"
import pg from "pg"
import { v4 as uuidv4 } from 'uuid';
import { storeQuestions } from "./questionRepository.js";
import { Quiz, QuizEntry } from "../models.js";

env.config();

const isProduction =  process.env.NODE_ENV === 'production';


export const db = new pg.Client({
    connectionString: isProduction? process.env.DATABASE_URL : undefined, 
    user: isProduction? '' : process.env.PG_USER,
    host: isProduction? '' : process.env.PG_HOST,
    database: isProduction? '' : process.env.PG_DATABASE,
    password: isProduction? '' : process.env.PG_PASSWORD,
    port: isProduction? 0 : Number(process.env.PG_PORT) ,
});

db.connect();

export async function saveQuiz(quiz: Quiz, channel_id: string) : Promise<string> {
    const quiz_id = uuidv4();
    try {
        const new_quiz: QuizEntry = {
            id: quiz_id,
            title: quiz.title, 
            channel_id: channel_id,
        }
        // save quiz into database
        let resp = await createQuizEntry(new_quiz);
        if(resp) {
            // save each question entry into the database
            resp = await storeQuestions(quiz.questions, quiz_id);
            return quiz_id;
        }
        return '';
    }catch (err) {
        console.error("Error saving quiz: ", err);
        return '';
    }
}

async function createQuizEntry(quiz: QuizEntry): Promise<boolean>{
    try {
        await db.query('INSERT INTO "Quizzes" (id, title, channel_id) VALUES ($1, $2, $3)', [quiz.id, quiz.title, quiz.channel_id])
        return true;
    }catch (err) {
        console.error("Error storing quiz: ", err);
        return false;
    }
}

export async function getQuiz(quiz_id: string) : Promise<any> {
    try {
        const resp = await db.query('SELECT * FROM "Quizzes" WHERE id=$1', [quiz_id])
        if(resp.rows.length > 0) {
            return resp.rows[0];
        }else {
            return "Null";
        }
    }catch (err) {
        console.error("Error fetching quiz: ", err);
        return "Error";
    }
}

export async function getQuizStatus(quiz_id : string) {
    try {
        const resp = await db.query('SELECT status FROM "Quizzes" WHERE id=$1', [quiz_id])
        if(resp.rows.length > 0) {
            return resp.rows[0];
        }else {
            return "Null";
        }
    }catch (err) {
        console.error("Error fetching quiz status: ", err);
        return "Error";
    }
}

export async function setQuizStatus(quiz_id : string, status : string ) {
    try {
        await db.query('UPDATE "Quizzes" SET status=$1 WHERE id=$2', [status, quiz_id])
        return true;
    }catch (err) {
        console.error("Error setting quiz status: ", err);
        return false;
    }
}