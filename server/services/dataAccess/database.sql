-- quiz table
CREATE TABLE quiz (
    quiz_id uuid PRIMARY KEY,
    quiz_title text,
    channel_id VARCHAR(20)
);

-- question table 
CREATE TABLE question (
    id SERIAL PRIMARY KEY,
    number INTEGER,
    quiz_id uuid REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    question text,
    options text[],
    answer INTEGER,
    CONSTRAINT unique_question UNIQUE (number, quiz_id)
);

-- user answer table
CREATE TABLE user_answer (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20),
    username VARCHAR(50),
    quiz_id uuid REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    question_number INTEGER,
    answer INTEGER,
    CONSTRAINT unique_user_answer UNIQUE (user_id, quiz_id, question_number)
);

-- scores table 
CREATE TABLE score (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20),
    username VARCHAR(50),
    quiz_id uuid REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    score INTEGER
);
