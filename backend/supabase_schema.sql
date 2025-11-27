-- Supabase Database Schema for Daily Questions App
-- Run this in Supabase SQL Editor to create all tables and indexes

-- Create enum types
CREATE TYPE question_type AS ENUM ('single_select', 'multi_select', 'with_sub_questions');
CREATE TYPE sub_question_type AS ENUM ('single_select', 'multi_select');

-- 1. Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL,
    text TEXT NOT NULL,
    type question_type NOT NULL,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Question options table
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_value TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sub questions table
CREATE TABLE IF NOT EXISTS sub_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    sub_question_text TEXT NOT NULL,
    type sub_question_type NOT NULL,
    "order" INTEGER NOT NULL,
    triggering_option_value TEXT, -- Links sub-question to specific main option (e.g., "breakfast", "lunch", "family", "friends")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sub question options table
CREATE TABLE IF NOT EXISTS sub_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_question_id UUID NOT NULL REFERENCES sub_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_value TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 6. Response answers table
CREATE TABLE IF NOT EXISTS response_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    sub_question_id UUID REFERENCES sub_questions(id) ON DELETE CASCADE,
    selected_option_id UUID, -- Can reference either question_options or sub_question_options
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions("order");
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_sub_questions_parent_id ON sub_questions(parent_question_id);
CREATE INDEX IF NOT EXISTS idx_sub_question_options_sub_question_id ON sub_question_options(sub_question_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_date ON responses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_responses_user_submitted ON responses(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_response_answers_question_id ON response_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_response_answers_sub_question_id ON response_answers(sub_question_id);

-- Enable Row Level Security (RLS)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions (public read, admin write)
CREATE POLICY "Questions are viewable by everyone" ON questions
    FOR SELECT USING (true);

CREATE POLICY "Question options are viewable by everyone" ON question_options
    FOR SELECT USING (true);

CREATE POLICY "Sub questions are viewable by everyone" ON sub_questions
    FOR SELECT USING (true);

CREATE POLICY "Sub question options are viewable by everyone" ON sub_question_options
    FOR SELECT USING (true);

-- RLS Policies for responses (users can only see their own)
CREATE POLICY "Users can view their own responses" ON responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses" ON responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own response answers" ON response_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM responses 
            WHERE responses.id = response_answers.response_id 
            AND responses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own response answers" ON response_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM responses 
            WHERE responses.id = response_answers.response_id 
            AND responses.user_id = auth.uid()
        )
    );

