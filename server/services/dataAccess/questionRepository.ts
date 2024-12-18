import { db } from "./dbConfig.js";
import { QuizQuestion } from "../models.js";

export async function storeQuestions(quizQuestions: QuizQuestion[], quiz_id: string): Promise<boolean>{
    try {
        quizQuestions.forEach(async (question, index) => {
            const resp = await db.query('INSERT INTO "Questions" (number, quiz_id, question, options, answer) VALUES ($1, $2, $3, $4, $5)', [index+1, quiz_id, question.question, question.options, question.answer]);
        });
        return true;
    }catch (err) {
        console.error("Error storing quiz questions: ", err);
        return false;
    }
}

export async function getQuestion(quiz_id: string, number: number) : Promise<any> {
    try {
        // Fetch question from db using the quiz id and question number
        const resp = await db.query('SELECT * FROM "Questions" WHERE quiz_id=$1 AND number=$2', [quiz_id, number]);
        if(resp.rows.length > 0) {
            return resp.rows[0];
        }else {
            return "End";
        }
    }catch (err) {
        console.error("Error fetching quiz question: ", err);
        return "Error";
    }
}

export async function getAnswers(quiz_id: string) : Promise<any> {
    try {
        // Fetch question numbers and corresponding answers from db using the quiz id 
        const resp = await db.query('SELECT number, answer FROM "Questions" WHERE quiz_id=$1', [quiz_id]);
        if(resp.rows.length > 0) {
            return resp.rows;
        }else {
            return "NONE";
        }
    }catch (err) {
        console.error("Error fetching quiz answers: ", err);
        return "Error";
    }
}

export async function getQuestions(quiz_id: string) {
    try {
        // Fetch question from db using the quiz id and question number
        const resp = await db.query('SELECT * FROM "Questions" WHERE quiz_id=$1', [quiz_id]);
        if(resp.rows.length > 0) {
            return resp.rows;
        }else {
            return "NONE";
        }
    }catch (err) {
        console.error("Error fetching quiz questions: ", err);
        return "Error";
    }  
}