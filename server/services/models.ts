import { Thread } from "openai/resources/beta/index.mjs";
import { FileObject } from "openai/resources/files.mjs";

export interface FileObj {
  name: string;
  url: string;
}
export interface ThreadObj {
  thread: Thread;
  quizFiles: FileObject[];
}
export interface QuizQuestion {
  quiz_id: string;
  question: string;
  answer: string;
  options: string[];
  number: string;
}

export interface QuizRequest {
  userPrompt: string;
  files: FileObj[];
}

export interface Quiz {
  status: "success" | "failure";
  id: string;
  title: string;
  channelId: string;
  questions: QuizQuestion[];
}

export interface AIAnswerDiscord {
  question: string;
  status: "success" | "failure";
  answer: string;
  error: string;
}
export interface QuizEntry {
  id: string
  title: string
  channel_id: string
}

export interface QuizUserAnswer {
  user_id: string;
  username: string;
  quiz_id: string;
  question_number: string;
  answer: string;
  type: string;
}

export interface Score {
    user_id: string;
    username: string;
    quiz_id: string;
    value: number;
}

export interface Answer {
  number: string;
  answer: string;
}

export enum QuizStatus {
  Active = 'active',
  Done = 'done'
}
