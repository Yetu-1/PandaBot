import axios from "axios";
import env from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { Assistant } from "openai/resources/beta/assistants.mjs";
import { ThreadCreateParams } from "openai/resources/beta/index.mjs";
import { FileObject } from "openai/resources/files.mjs";
import { Thread } from "openai/src/resources/beta/index.js";
import { FileObj, ThreadObj } from "./models.js";

env.config();
const openai = new OpenAI();

async function downloadFile(uri: string, fileName: string): Promise<string> {
  const response = await axios.get(uri, { responseType: "stream" });
  const dir = "services/tmp";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const path = `${dir}/${fileName}`;
  const writer = fs.createWriteStream(path);

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    let error: Error | null = null;
    writer.on("error", (err) => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on("close", () => {
      if (!error) {
        resolve(path);
      }
    });
  });
}

async function createQuizAssistant(): Promise<Assistant> {
  return await openai.beta.assistants.create({
    name: "Quiz Assistant",
    instructions: `
      You are a helpful assistant That creates multiple choice quizes, 5 questions with 4 
                answer options from attached documents and returns an array of questions in this format: 
                [
                  {
                    question: "",
                    options: [
                      "Orange", "Pink", "Blue", "Green"
                    ]
                  }
                ]
                `,
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
  });
}

async function createThread(files: FileObj[]): Promise<ThreadObj> {
  const quizFiles = await Promise.all(
    files.map(async (file) => {
      if (file) {
        const path = await downloadFile(file.url, file.name);
        return await openai.files.create({
          file: fs.createReadStream(path),
          purpose: "assistants",
        });
      } else {
        return {} as FileObject;
      }
    })
  );

  const attachments = quizFiles.map(
    (file): ThreadCreateParams.Message.Attachment => {
      return { file_id: file?.id, tools: [{ type: "file_search" }] };
    }
  );

  const systemMessage: ThreadCreateParams.Message = {
    role: "assistant",
    content: `
      You are a helpful assistant That creates multiple choice quizes, 5 questions with 4 
                answer options from attached documents and returns an array of questions in this format: 
                {
                status: "success",
                title: "",
                questions: [
                  {
                    question: "what is the color of an orange",
                    options: [
                      "Orange", "Pink", "Blue", "Green"
                    ],
                    answer: 1 (i.e can be option 1 - 4 depending on which option is right)
                  }
                ]}
                  Please only respond in the provided format nothing more nothing less
                  no code blocks please just raw strings
                  if you're unable to genrate questions just output an empty array for questions and status: "failed". add a title based on the content of the quiz
                `,
  };

  const threadCreateParams: ThreadCreateParams = {
    messages: [systemMessage],
  };

  const thread = await openai.beta.threads.create(threadCreateParams);

  return { thread, quizFiles };
}

async function deleteFiles(fileIds: string[]): Promise<boolean> {
  return Promise.all(fileIds.map((id) => openai.files.del(id))).then(
    (fileDeleted) => {
      console.log("Files deleted", fileDeleted);
      return true;
    }
  );
}

async function generateQuiz(files: FileObj[]): Promise<any> {
  let quizFiles: FileObject[] = [];
  try {
    const assistant = await createQuizAssistant();
    let thread: Thread;
    ({ thread, quizFiles } = await createThread(files));

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    const messages = await openai.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    });

    const message = messages.data.pop()!;
    if (message.content[0].type === "text") {
      const { text } = message.content[0];
      console.log(JSON.parse(text.value));
      return JSON.parse(text.value);
    }
    return { status: "failed", Error: "No text content" };
  } catch (err) {
    console.error("GenerateQuizError", err);
    return { status: "failed", Error: "err" };
  } finally {
    if (quizFiles.length > 0) {
      const fileIds = quizFiles.map((file) => file.id);
      await deleteFiles(fileIds);
    }
  }
}

export { generateQuiz };
