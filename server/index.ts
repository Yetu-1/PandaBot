import express from "express"
import env from "dotenv"
env.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile("index.html");
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
})
