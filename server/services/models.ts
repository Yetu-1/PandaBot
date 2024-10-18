import { Thread } from "openai/resources/beta/index.mjs";
import { FileObject } from "openai/resources/files.mjs";

export interface ThreadObj {
  thread: Thread;
  quizFiles: FileObject[];
}

export interface QuizQuestion {
  question: string;
  answer: string;
  options: string[];
}

export interface Quiz {
  status: "success" | "failure";
  id: string;
  title: string;
  channelId: string;
  questions: QuizQuestion[];
}

export interface QuizEntry {
  id: string
  title: string
  channel_id: string
}

export interface QuizUserAnswer {
  user_id: string;
  quiz_id: string;
  question_number: string;
  answer: string;
  type: string;
}
