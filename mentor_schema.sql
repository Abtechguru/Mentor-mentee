-- Run this in your Supabase SQL Editor to add Mentor profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expertise TEXT;
