import axios from "axios";
import env from "dotenv";

env.config();

const discovery_url: string = String(process.env.DISCOVERY_URL);

export async function checkMsgSafety(msg: string) {
  try {
    const response = await axios.post(discovery_url, {
      comment: { msg },
      requestedAttributes: { TOXICITY: {} },
    });

    const toxicity = response.data.attributeScores.TOXICITY.summaryScore.value;
    console.log("Toxicity score:", toxicity);
    return toxicity * 100;
  } catch (err) {
    console.log("Error: checking message safety", err);
  }
}