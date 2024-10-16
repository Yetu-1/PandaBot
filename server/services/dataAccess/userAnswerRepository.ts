import { db } from "./quizRepository.js";

export type UserAnswer = {
    user_id: string;
    quiz_id: string;
    question_number: string;
    answer: number;
}

export async function storeUserAnswer(user_answer: UserAnswer): Promise<boolean> {
    try{
        await db.query("INSERT INTO user_answer (user_id, quiz_id, question_number, answer) VALUES ($1, $2, $3, $4)", 
            [user_answer.user_id, user_answer.quiz_id, user_answer.question_number, user_answer.answer] );
        return true;
    }catch(err) {
        console.error("Error storing user answer", err)
        return false;
    }
}