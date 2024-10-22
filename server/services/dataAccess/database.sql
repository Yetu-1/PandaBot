-- quiz table
CREATE TABLE quiz (
    quiz_id uuid PRIMARY KEY,
    quiz_title text,
    channel_id VARCHAR(20)
    status VARCHAR(7)
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
    number INTEGER,
    answer INTEGER,
    CONSTRAINT unique_user_answer UNIQUE (user_id, quiz_id, number)
);

-- scores table 
CREATE TABLE score (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20),
    username VARCHAR(50),
    quiz_id uuid REFERENCES quiz(quiz_id) ON DELETE CASCADE,
    score INTEGER,
    CONSTRAINT unique_score_entry UNIQUE (user_id, quiz_id)
);

--  -- change question_number column name to number
-- ALTER TABLE user_answer
-- RENAME COLUMN question_number to number;
