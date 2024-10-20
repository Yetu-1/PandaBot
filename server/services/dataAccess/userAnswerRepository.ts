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

export async function getQuizUsers(quiz_id: string) : Promise<any> {
    try {
        // Fetch users that answered a quiz from db
        const resp = await db.query("SELECT DISTINCT user_id, username FROM user_answer WHERE quiz_id=$1", [quiz_id]);
        return resp.rows;
    }catch (err) {
        console.error("Error fetching quiz questions", err);
        return "Error";
    }
}

export async function getUserAnswers(quiz_id: string , user_id: string ) : Promise<any> {
    try {
        // Fetch user's answers to the quiz from db
        const resp = await db.query("SELECT number, answer FROM user_answer WHERE quiz_id=$1 AND user_id=$2", [quiz_id, user_id]);
        if( resp.rows.length > 0) {
            return resp.rows;
        }else {
            return "NONE";
        }
    }catch (err) {
        console.error("Error fetching quiz questions", err);
        return "Error";
    } 
}