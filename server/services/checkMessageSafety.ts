import {google} from 'googleapis';
import env from 'dotenv'

env.config();

const discovery_url: string = String(process.env.DISCOVERY_URL);


export async function checkMsgSafety(msg: string) {
    try {
        const client: any = await google.discoverAPI(discovery_url);

        const analyzeRequest = {
            comment: {
            text: msg,
            },
            requestedAttributes: {
            TOXICITY: {},
            },
        };
        
        const response = await client.comments.analyze(
            {
                key: process.env.GOOGLE_API_KEY,
                resource: analyzeRequest,
        });
        
        // console.log(JSON.stringify(response.data, null, 2));
        const toxicity: number = response.data.attributeScores.TOXICITY.summaryScore.value;
        return toxicity * 100;
    }catch(err) {
        console.log( "Error: checking message safety", err);
    }

}