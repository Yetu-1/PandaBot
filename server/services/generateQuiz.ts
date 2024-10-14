import OpenAI from "openai";
import env from "dotenv";
import fs, { open } from "fs";
import axios from "axios";
import { Assistant } from "openai/resources/beta/assistants.mjs";
import { ThreadCreateParams } from "openai/resources/beta/index.mjs";
import { Thread } from "openai/src/resources/beta/index.js";
import { Message, CommandInteractionOption } from "discord.js";
import { FileObject } from "openai/resources/files.mjs";

env.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

interface ThreadObj {
  thread: Thread;
  quizFiles: FileObject[];
}

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

async function createThread(files: CommandInteractionOption[]): Promise<ThreadObj> {
  const quizFiles = await Promise.all(
    files.map(async ( { attachment } ) => {
      if(attachment) { // Make sure attachment exists
        const path = await downloadFile(attachment.url, attachment.name);
        return await openai.files.create({
          file: fs.createReadStream(path),
          purpose: "assistants",
        });
      }else {
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
                questions: [
                  {
                    question: "",
                    options: [
                      "Orange", "Pink", "Blue", "Green"
                    ],
                    answer: "Orange"
                  }
                ]}
                  Please only respond in the provided format nothing more nothing less
                  no code blocks please just raw strings
                  if you're unable to genrate questions just output an empty array for questions and status: "failed"
                `,
  };

  const userMessage: ThreadCreateParams.Message = {
    role: "user",
    content: "This is the user message: ",
    attachments: attachments,
  };

  const threadCreateParams: ThreadCreateParams = {
    messages: [systemMessage, userMessage],
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

async function generateQuiz(attachment: CommandInteractionOption[]): Promise<string> {
  
  let files: FileObject[] = [];
  try {
    const assistant = await createQuizAssistant();
    const { thread, quizFiles } = await createThread(attachment);
    files = quizFiles;

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id,
    });

    const messages = await openai.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    });

    const message = messages.data.pop()!;
    if (message.content[0].type === "text") {
      const { text } = message.content[0];
      console.log(text.value);
      return text.value;
    }
    return "";
  } catch (err) {
    console.error("Error", err);
    return "";
  } finally {
    console.log("finally");
    if (files.length > 0) {
      const fileIds = files.map((file) => file.id);
      console.log("deleting files", fileIds);
      await deleteFiles(fileIds);
    }
  }
}

export { generateQuiz };