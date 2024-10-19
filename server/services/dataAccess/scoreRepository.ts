import { db } from "./quizRepository.js";
import { Score } from "../models.js";

export async function storeScore(score: Score) : Promise<boolean>{
    try{
        await db.query("INSERT INTO score (user_id, username, quiz_id, score) VALUES ($1, $2, $3, $4)", 
            [score.user_id, score.username, score.quiz_id, score.value] );
        return true;
    }catch(err) {
        console.error("Error storing score", err)
        return false;
    }
}

export async function calculateScores(quiz_id : string ) {
    // Get quiz object to use for score calculation
    // Get all unique users who have responses for that quiz
    // Get each user's answers 
    // calculate user score using quiz object
    // save score in database
}