import Tesseract from "tesseract.js";
import { extname } from "path";
import axios from "axios";
import mammoth from "mammoth";
import PdfDataParser from "pdf-data-parser";

const SUPPORTED_TESSERACT_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".tiff",
];

const SUPPORTED_OFFICE_EXTENSIONS = [".docx", ".doc", ".odt"];

async function fetchDocument(uri: string): Promise<Buffer> {
  try {
    const response = await axios.get(uri, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    throw new Error(`Failed to fetch document: ${error}`);
  }
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  console.log("Extracting text from image");
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "eng");

  return text;
}

async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString();
}

async function extractTextFromOfficeDocs(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw error;
  }
}

async function extractTextFromPdf(url: string): Promise<string> {
  const parser = new PdfDataParser.PdfDataParser({ url: url });
  const rows = await parser.parse();
  let extractedText = "";
  if (rows) {
    for (const row of rows) {
      extractedText += row.toString();
    }
  }

  return extractedText.trim();
}

async function extractTextFromHTML(buffer: Buffer): Promise<string> {
  const rawString = buffer.toString();

  var span = document.createElement("span");
  span.innerHTML = rawString;
  var children = span.querySelectorAll("*");
  for (var i = 0; i < children.length; i++) {
    if (children[i].textContent) children[i].textContent += " ";
    else children[i].textContent += " ";
  }
  return [span.textContent || span.innerText].toString().replace(/ +/g, " ");
}

// TODO :: Add support for zip, epub and others

async function extractTextFromDocs(
  uri: string,
  filename: string
): Promise<string> {
  const buffer = await fetchDocument(uri);

  console.log("Extracting text from:", filename);

  const extension = extname(filename).toLowerCase();
  if (SUPPORTED_TESSERACT_EXTENSIONS.includes(extension)) {
    return await extractTextFromImage(buffer);
  } else if (SUPPORTED_OFFICE_EXTENSIONS.includes(extension)) {
    return await extractTextFromOfficeDocs(buffer);
  } else if (extension === ".pdf") {
    return await extractTextFromPdf(uri);
  } else if (extension === ".html") {
    return await extractTextFromHTML(buffer);
  } else {
    return await extractTextFromTxt(buffer);
  }
}

export default extractTextFromDocs;
