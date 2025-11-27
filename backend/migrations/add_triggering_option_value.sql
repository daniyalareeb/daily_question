-- Migration: Add triggering_option_value column to sub_questions table
-- Run this in Supabase SQL Editor

ALTER TABLE sub_questions 
ADD COLUMN IF NOT EXISTS triggering_option_value TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_questions_triggering_option 
ON sub_questions(parent_question_id, triggering_option_value);




