import { db } from "./quizRepository.js";

type Score = {
    user_id: string;
    quiz_id: string;
    value: number;
}

export async function storeScore(score: Score) {
    try{
        await db.query("INSERT INTO score (user_id, quiz_id, score) VALUES ($1, $2, $3)", 
            [score.user_id, score.quiz_id, score.value] );
        return true;
    }catch(err) {
        console.error("Error storing score", err)
        return false;
    }
}