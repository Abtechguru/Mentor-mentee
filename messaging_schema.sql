-- Add Family Details to Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_email TEXT;

-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    "senderId" INTEGER NOT NULL REFERENCES users(id),
    "receiverId" INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
