# PandaBot
<p align="center">
The Ultimate Quiz Experience for Study Groups.
</p>

PandaBot is a Discord bot designed to make study sessions interactive, fun, and effective by bringing quizzes to your Discord server. Using GPT-4 (via OpenAI API), it generates quizzes from uploaded files and features an "Ask AI Anything" command. PandaBot streams user interactions and messages using Redpanda Connect, storing them in a database for analytics and review. With built-in commands like `/start-quiz` and `/ask-ai-anything`, it's easy to make the most of study sessions.

## Current Commands

### 1. `/start-quiz`
- **Description**: This command starts a quiz session with options for file upload, quiz duration, question count, and an optional second file.
- **How it Works**: Enter `/start-quiz`, upload the file(s), and fill in the options. PandaBot will process the file(s) and generate a quiz based on the content.
- **Example Flow**:
  - **Step 1**: Run `/start-quiz`, select quiz options.
  - **Step 2**: PandaBot generates the quiz and prompts you to participate.
  - **Step 3**: Users receive an interactive quiz with options to join or revise. Clicking "Join" starts the quiz, showing questions like those below.
  - **Step 4**: At quiz end, you receive a score summary and question review.

### 2. `/ask-ai-anything`
- **Description**: This command uses OpenAI’s GPT-4 model to answer any question entered by the user.
- **Example**: `/ask-ai-anything`: “What are complementary colors?” – PandaBot replies with an AI-generated answer.

## At a Glance

| Demo #1                       | Demo #2                       |
| ----------------------------- | ----------------------------- |
| ![](/examples/demo1.png)      | ![](/examples/demo2.png)      |

## Getting Started

To set up PandaBot:

1. **Clone the repository**:
   ```sh
   git clone https://github.com/your-username/PandaBot.git
   cd PandaBot
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Set up environment variables**:  
   Create an `.env` file at the root level of the project and provide the following environment variables:

   ```plaintext
   DISCORD_TOKEN=your_discord_token
   OPENAI_API_KEY=your_openai_api_key
   REDPANDA_BROKER=your_redpanda_broker_url
   DATABASE_URL=your_database_url
   ```

4. **Set up Redpanda**:  
   You can use [Redpanda Cloud](https://redpanda.com/cloud) for managed setup or install Redpanda locally with Docker following the [Docker setup guide](https://docs.redpanda.com/docs/get-started/quick-start-docker/).

5. **Set up the Discord bot**:  
   Register your bot on the [Discord Developer Portal](https://discord.com/developers/applications), retrieve the bot token, and configure it for your server. Refer to the [Discord.js Guide](https://discordjs.guide/) for additional setup instructions.

6. **Set up your database**:
   - Ensure a Postgres database is running locally or on a server.
   - Provide the Postgres credentials in the `.env` file (as shown above under `DATABASE_URL`).

7. **Run PandaBot**:
   ```sh
   npm run serve
   ```

PandaBot is now ready to power up your study sessions on Discord!
