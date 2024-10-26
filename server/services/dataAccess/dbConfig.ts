import pg from "pg"
import env from "dotenv"
env.config();

const isProduction =  process.env.NODE_ENV === 'production';


export const db = new pg.Client({
    connectionString: isProduction? process.env.DATABASE_URL : undefined, 
    user: isProduction? '' : process.env.PG_USER,
    host: isProduction? '' : process.env.PG_HOST,
    database: isProduction? '' : process.env.PG_DATABASE,
    password: isProduction? '' : process.env.PG_PASSWORD,
    port: isProduction? 0 : Number(process.env.PG_PORT) ,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect();