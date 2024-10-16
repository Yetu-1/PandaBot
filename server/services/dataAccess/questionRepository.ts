import { db } from "./quizRepository.js";
import { v4 as uuidv4 } from 'uuid';
import { Question } from "./quizRepository.js";

export async function storeQuestions(quizQuestions: Question[], quiz_id: string): Promise<boolean>{
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