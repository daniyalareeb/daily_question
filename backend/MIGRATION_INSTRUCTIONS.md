# Migration Instructions: Update Questions 2 and 5 Structure

## Problem
Questions 2 and 5 are not showing their main options because they haven't been re-seeded with the new conditional sub-question structure.

## Solution Steps

### 1. Run the Database Migration
Execute the migration SQL in your Supabase SQL Editor to add the `triggering_option_value` column:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE sub_questions 
ADD COLUMN IF NOT EXISTS triggering_option_value TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_questions_triggering_option 
ON sub_questions(parent_question_id, triggering_option_value);
```

### 2. Re-seed the Questions
Run the updated seed script to populate questions with the new structure:

```bash
cd backend
python3 scripts/seed_questions.py
```

When prompted, type `yes` to delete existing questions and reseed.

### 3. Verify the Structure
After re-seeding, verify that:
- Question 2 ("What did you eat today?") has main options: Breakfast, Lunch, Dinner, I didn't eat
- Question 5 ("Did you socialise today?") has main options: Family, Friends, Neighbour, Stranger, I didn't socialize
- Each main option has corresponding conditional sub-questions

### 4. Test the Frontend
Refresh your frontend and navigate to Question 2. You should now see:
- Main options displayed as checkboxes
- Sub-questions appearing when you select Breakfast, Lunch, or Dinner
- No sub-questions when "I didn't eat" is selected

## What Changed

**Question 2 (What did you eat today?):**
- **Before:** Only had sub-questions (Breakfast, Lunch, Dinner)
- **After:** Has main options (Breakfast, Lunch, Dinner, I didn't eat) with conditional sub-questions

**Question 5 (Did you socialise today?):**
- **Before:** Only had sub-questions (Family, Friends, Neighbour, Stranger)
- **After:** Has main options (Family, Friends, Neighbour, Stranger, I didn't socialize) with conditional sub-questions

The sub-questions now only appear when their corresponding main option is selected.



