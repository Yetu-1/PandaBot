import { QuizUserAnswer } from "../models.js";
import { db } from "./quizRepository.js";

export async function storeUserAnswer(user_answer: QuizUserAnswer): Promise<boolean> {
    try{
        await db.query("INSERT INTO user_answer (user_id, username, quiz_id, question_number, answer) VALUES ($1, $2, $3, $4, $5)", 
            [user_answer.user_id, user_answer.username, user_answer.quiz_id, user_answer.question_number, user_answer.answer] );
        return true;
    }catch(err) {
        console.error("Error storing user answer", err)
        return false;
    }
}