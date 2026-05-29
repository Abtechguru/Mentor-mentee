-- Create Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    "mentorId" INTEGER NOT NULL REFERENCES users(id),
    "studentId" INTEGER REFERENCES users(id), -- If NULL, it's assigned to all mentees of this mentor
    title TEXT NOT NULL,
    video_link TEXT,
    instructions TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    max_grade INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    "assignmentId" INTEGER NOT NULL REFERENCES assignments(id),
    "studentId" INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    grade INTEGER,
    comment TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
