import OpenAI from "openai";
import env from "dotenv";
import fs, { open } from "fs";
import axios from "axios";
import { Assistant } from "openai/resources/beta/assistants.mjs";
import { ThreadCreateParams } from "openai/resources/beta/index.mjs";
import { Thread } from "openai/src/resources/beta/index.js";
import { Message } from "discord.js";
import { FileObject } from "openai/resources/files.mjs";

env.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI();

interface ThreadObj {
  thread: Thread;
  messageFiles: FileObject[];
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

async function uploadFilesToVectorStore(uri: string[]): Promise<string> {
  const fileStreams = uri.map((path) => fs.createReadStream(path));

  let vectorStore = await openai.beta.vectorStores.create({
    name: "Quiz docs",
    expires_after: {
      anchor: "last_active_at",
      days: 7,
    },
  });

  await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
    files: fileStreams,
  });

  return vectorStore.id;
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

async function createThread(message: Message): Promise<ThreadObj> {
  const messageFiles = await Promise.all(
    message.attachments.map(async ({ name, url }) => {
      const path = await downloadFile(url, name);
      return await openai.files.create({
        file: fs.createReadStream(path),
        purpose: "assistants",
      });
    })
  );

  const attachments = messageFiles.map(
    (file): ThreadCreateParams.Message.Attachment => {
      return { file_id: file.id, tools: [{ type: "file_search" }] };
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
    content: "This is the user message: " + message.content,
    attachments: attachments,
  };

  const threadCreateParams: ThreadCreateParams = {
    messages: [systemMessage, userMessage],
  };

  const thread = await openai.beta.threads.create(threadCreateParams);

  return { thread, messageFiles };
}

async function deleteFiles(fileIds: string[]): Promise<boolean> {
  return Promise.all(fileIds.map((id) => openai.files.del(id))).then(
    (fileDeleted) => {
      console.log("Files deleted", fileDeleted);
      return true;
    }
  );
}

async function generateQuiz(discordMessage: Message): Promise<string> {
  let files: FileObject[] = [];
  try {
    const assistant = await createQuizAssistant();
    const { thread, messageFiles } = await createThread(discordMessage);
    files = messageFiles;

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