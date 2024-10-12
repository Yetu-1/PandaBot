import OpenAI from "openai";
import env from "dotenv";

env.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

export async function generateQuiz(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
  
      messages: [
        {
          "role": "system",
          "content": [
            {
              "type": "text",
              "text": `
                You are a helpful assistant That creates multiple choice quizes, 5 questions with 4 
                answer options from text prompts and returns an array of questions in this format: 
                [
                  {
                    question: "",
                    options: [
                      "Orange", "Pink", "Blue", "Green"
                    ]
                  }
                ]
              `
            }
          ]
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": text
            }
          ]
        }
      ]
    });
    return completion.choices[0].message.content;
  }catch(err) {
    console.log("Error", err);
  }
}