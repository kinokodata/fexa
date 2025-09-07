-- Add missing check columns to questions table
-- These columns track whether a question has been reviewed/checked

-- Add is_checked column (boolean flag to indicate if question has been checked)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name = 'is_checked') 
    THEN
        ALTER TABLE public.questions 
        ADD COLUMN is_checked boolean DEFAULT false;
    END IF;
END $$;

-- Add checked_at column (timestamp when the question was checked)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name = 'checked_at') 
    THEN
        ALTER TABLE public.questions 
        ADD COLUMN checked_at timestamp with time zone;
    END IF;
END $$;

-- Add checked_by column (who checked the question)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name = 'checked_by') 
    THEN
        ALTER TABLE public.questions 
        ADD COLUMN checked_by character varying;
    END IF;
END $$;