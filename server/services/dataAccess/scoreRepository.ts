import { db } from "./dbConfig.js";
import { Answer, Score } from "../models.js";
import { getQuizParticipants, getUserAnswers } from "./userAnswerRepository.js";
import { getAnswers } from "./questionRepository.js";

export async function storeScore(score: Score) : Promise<boolean>{
    try{
        await db.query('INSERT INTO "QuizScores" (user_id, username, quiz_id, score) VALUES ($1, $2, $3, $4)', 
            [score.user_id, score.username, score.quiz_id, score.value] );
        return true;
    }catch(err) {
        console.error("Error storing score: ", err)
        return false;
    }
}

export async function calculateScores(quiz_id : string) : Promise<boolean> {
    console.log("Calculating Scores!"); 
    try{
        const answers = await getAnswers(quiz_id);
        console.log(answers);
        // Get all unique users who participated in the quiz
        const users = await getQuizParticipants(quiz_id);
        users.forEach(async (user: any) => {
            // Get each user's answers
            const user_answers = await getUserAnswers(quiz_id , user.user_id);
            // use qusetions to calculate user score
            const score = calcUserScore(answers, user_answers);
            // save score in database
            console.log(user.user_id, ": ", score);
            await storeScore( {quiz_id: quiz_id, user_id: user.user_id, username: user.username, value: score} );
        })
        return true;
    }catch(error) {
        console.error("Error calculating scores: ", error);
        return false;
    }
}

function calcUserScore(answers : Answer[], user_answers: Answer[]) {
    let score = 0;
    user_answers.forEach((question) => {
        const curr_question = answers.filter((ans)=> question.number == ans.number); // fileter and return ans for the current question
        const curr_answer = curr_question[0] && curr_question[0].answer;
        if (curr_answer != undefined && curr_answer == question.answer) {
            score++;
        }
    });
    return score;
}

export async function getScores(quiz_id : string) {
    try{
        const resp = await db.query('SELECT * FROM "QuizScores" WHERE quiz_id=$1 ORDER BY score DESC', 
            [quiz_id] );
        if(resp.rows.length > 0) {
            return resp.rows;
        }
        else {
            return []
        }
    }catch(err) {
        console.error("Error fetching score: ", err)
        return "Error"
    }  
}

// calculate user's score without saving in db
export async function calculateUserScore(quiz_id: string, user_id: string ) : Promise<any> {
    console.log("Calculating Scores!"); 
    try{
        const answers = await getAnswers(quiz_id);
        console.log(answers);
        // Get user's answers
        const user_answers = await getUserAnswers(quiz_id , user_id);
        // use qusetions to calculate user score
        const score = calcUserScore(answers, user_answers);
        return score;
    }catch(error) {
        console.error("Error calculating scores: ", error);
        return "Error";
    }
}