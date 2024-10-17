import { Thread } from "openai/resources/beta/index.mjs";
import { FileObject } from "openai/resources/files.mjs";

export interface ThreadObj {
  thread: Thread;
  messageFiles: FileObject[];
}

export interface QuizQuestion {
  question: string;
  answer: string;
  options: string[];
}

export interface Quiz {
  status: "success" | "failure";
  id: string;
  questions: QuizQuestion[];
}
