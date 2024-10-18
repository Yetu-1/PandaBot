import { db } from "./quizRepository.js";
import { v4 as uuidv4 } from 'uuid';
import { QuizQuestion } from "../models.js";

export async function storeQuestions(quizQuestions: QuizQuestion[], quiz_id: string): Promise<boolean>{
    try {
        quizQuestions.forEach(async (question, index) => {
            const resp = await db.query("INSERT INTO question (number, quiz_id, question, options, answer) VALUES ($1, $2, $3, $4, $5)", [index+1, quiz_id, question.question, question.options, question.answer]);
        });
        return true;
    }catch (err) {
        console.error("Error storing quiz questions", err);
        return false;
    }
}

export async function getQuestion(quiz_id: string, number: number) : Promise<any> {
    console.log(quiz_id, " ", number);
    try {
        // Fetch question from db using the quiz id and question number
        const resp = await db.query("SELECT * FROM question WHERE quiz_id=$1 AND number=$2", [quiz_id, number]);
        if(resp.rows.length > 0) {
            return resp.rows[0];
        }else {
            return "End";
        }
    }catch (err) {
        console.error("Error fetching quiz questions", err);
        return "Error";
    }
}