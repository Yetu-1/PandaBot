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
  question: string;
  answer: string;
  options: string[];
}

export interface QuizRequest {
  userPrompt: string;
  files: FileObj[];
}

export interface Quiz {
  status: "success" | "failure";
  id: string;
  questions: QuizQuestion[];
}

export interface AIAnswerDiscord {
  question: string;
  status: "success" | "failure";
  answer: string;
  error: string;
}
