require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/app', (req, res) => {
  res.render('app');
});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase');

const stages = [
  { id: 0, module: "1. HTML Foundations", title: "1.1 The DOCTYPE and HTML Tags", question: "Start your HTML document by declaring the document type and adding the root <html> tags.", hint: "Use <!DOCTYPE html> followed by <html> and </html>.", requiredElements: ["<!DOCTYPE html>", "<html>", "</html>"], sampleSolution: "<!DOCTYPE html>\n<html>\n</html>" },
  { id: 1, module: "1. HTML Foundations", title: "1.2 The Head and Title", question: "Add a <head> section containing a <title> that says 'My First Page'.", hint: "The <head> goes inside <html>, and <title> goes inside <head>.", requiredElements: ["<head>", "<title>", "My First Page", "</title>", "</head>"], sampleSolution: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n</html>" },
  { id: 2, module: "1. HTML Foundations", title: "1.3 The Body Tag", question: "Add a <body> tag after the <head>. Inside it, write 'Hello World'.", hint: "The <body> tag comes after </head>. Text goes inside it.", requiredElements: ["<body>", "Hello World", "</body>"], sampleSolution: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  Hello World\n</body>\n</html>" },
  { id: 3, module: "2. Text Formatting", title: "2.1 Headings", question: "Inside the <body>, create an <h1> heading with the text 'Welcome'.", hint: "Use the <h1> tag for the main heading.", requiredElements: ["<h1>", "Welcome", "</h1>"], sampleSolution: "<body>\n  <h1>Welcome</h1>\n</body>" },
  { id: 4, module: "2. Text Formatting", title: "2.2 Paragraphs", question: "Add a <p> (paragraph) tag below the heading with the text 'This is my website'.", hint: "Use the <p> tag for paragraphs.", requiredElements: ["<p>", "This is my website", "</p>"], sampleSolution: "<body>\n  <h1>Welcome</h1>\n  <p>This is my website</p>\n</body>" },
  { id: 5, module: "2. Text Formatting", title: "2.3 Bold and Italic", question: "Make the word 'Bold' bold using <strong> and 'Italic' italic using <em>.", hint: "Wrap 'Bold' in <strong> and 'Italic' in <em>.", requiredElements: ["<strong>", "Bold", "</strong>", "<em>", "Italic", "</em>"], sampleSolution: "<body>\n  <p>This is <strong>Bold</strong> and this is <em>Italic</em>.</p>\n</body>" },
  { id: 6, module: "3. Links and Images", title: "3.1 Creating Links", question: "Create a link to 'https://google.com' with the text 'Go to Google'.", hint: "Use the <a> tag with an href attribute.", requiredElements: ["<a", "href=", "https://google.com", "Go to Google", "</a>"], sampleSolution: "<body>\n  <a href=\"https://google.com\">Go to Google</a>\n</body>" },
  { id: 7, module: "3. Links and Images", title: "3.2 Adding Images", question: "Add an image with the src 'logo.png' and alt text 'My Logo'.", hint: "Use the <img> tag. It doesn't need a closing tag.", requiredElements: ["<img", "src=", "logo.png", "alt=", "My Logo"], sampleSolution: "<body>\n  <img src=\"logo.png\" alt=\"My Logo\">\n</body>" },
  { id: 8, module: "4. Lists", title: "4.1 Unordered Lists", question: "Create a bulleted list (<ul>) with two list items (<li>): 'Apple' and 'Banana'.", hint: "Wrap your <li> tags inside a <ul> tag.", requiredElements: ["<ul>", "<li>", "Apple", "</li>", "Banana", "</ul>"], sampleSolution: "<body>\n  <ul>\n    <li>Apple</li>\n    <li>Banana</li>\n  </ul>\n</body>" },
  { id: 9, module: "4. Lists", title: "4.2 Ordered Lists", question: "Create a numbered list (<ol>) with two items: 'First' and 'Second'.", hint: "Use <ol> instead of <ul> for numbered lists.", requiredElements: ["<ol>", "<li>", "First", "</li>", "Second", "</ol>"], sampleSolution: "<body>\n  <ol>\n    <li>First</li>\n    <li>Second</li>\n  </ol>\n</body>" },
  { id: 10, module: "5. Tables", title: "5.1 Basic Table", question: "Create a <table> with one row (<tr>) containing two data cells (<td>): 'Left' and 'Right'.", hint: "The structure is <table><tr><td>...</td></tr></table>", requiredElements: ["<table>", "<tr>", "<td>", "Left", "</td>", "Right", "</tr>", "</table>"], sampleSolution: "<table>\n  <tr>\n    <td>Left</td>\n    <td>Right</td>\n  </tr>\n</table>" },
  { id: 11, module: "5. Tables", title: "5.2 Table Headers", question: "Add a row at the top of your table with <th> header cells: 'Col 1' and 'Col 2'.", hint: "Use <th> instead of <td> for headers.", requiredElements: ["<th>", "Col 1", "</th>", "Col 2"], sampleSolution: "<table>\n  <tr>\n    <th>Col 1</th>\n    <th>Col 2</th>\n  </tr>\n  <tr>\n    <td>Left</td>\n    <td>Right</td>\n  </tr>\n</table>" },
  { id: 12, module: "6. Forms", title: "6.1 Basic Form", question: "Create a <form> containing an <input> of type 'text'.", hint: "Use <form> and <input type=\"text\">.", requiredElements: ["<form>", "<input", "type=", "text", "</form>"], sampleSolution: "<form>\n  <input type=\"text\">\n</form>" },
  { id: 13, module: "6. Forms", title: "6.2 Placeholders", question: "Add a placeholder 'Enter name' to your text input.", hint: "Add the placeholder attribute to the <input> tag.", requiredElements: ["placeholder=", "Enter name"], sampleSolution: "<form>\n  <input type=\"text\" placeholder=\"Enter name\">\n</form>" },
  { id: 14, module: "6. Forms", title: "6.3 Submit Button", question: "Add a submit button inside the form using <button type='submit'>Submit</button>.", hint: "Place the <button> inside the <form>.", requiredElements: ["<button", "type=", "submit", "Submit", "</button>"], sampleSolution: "<form>\n  <input type=\"text\" placeholder=\"Enter name\">\n  <button type=\"submit\">Submit</button>\n</form>" },
  { id: 15, module: "6. Forms", title: "6.4 Checkboxes", question: "Add an <input> of type 'checkbox'.", hint: "Use type='checkbox'.", requiredElements: ["<input", "type=", "checkbox"], sampleSolution: "<form>\n  <input type=\"checkbox\">\n</form>" },
  { id: 16, module: "6. Forms", title: "6.5 Radio Buttons", question: "Add an <input> of type 'radio' with name='gender'.", hint: "Radio buttons with the same name group together.", requiredElements: ["<input", "type=", "radio", "name=", "gender"], sampleSolution: "<form>\n  <input type=\"radio\" name=\"gender\">\n</form>" },
  { id: 17, module: "7. Semantic HTML", title: "7.1 Header and Nav", question: "Create a <header> containing an h1 'Site Title', and a <nav> containing a link 'Home'.", hint: "Use <header>, <h1>, <nav>, and <a> tags.", requiredElements: ["<header>", "<h1>", "Site Title", "<nav>", "<a", "Home"], sampleSolution: "<header>\n  <h1>Site Title</h1>\n  <nav>\n    <a href='/'>Home</a>\n  </nav>\n</header>" },
  { id: 18, module: "7. Semantic HTML", title: "7.2 Main, Section, and Footer", question: "Create a <main> area containing a <section> with some text, and a <footer> with 'Copyright'.", hint: "Use <main>, <section>, and <footer> tags.", requiredElements: ["<main>", "<section>", "<footer>", "Copyright"], sampleSolution: "<main>\n  <section>\n    <p>Some interesting content here.</p>\n  </section>\n</main>\n<footer>Copyright 2026</footer>" }
];

app.post('/api/register', async (req, res) => {
  const { name, password, role, family_name, family_email } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Missing fields' });
  
  const insertData = { name, password, role: role || 'student' };
  if (family_name) insertData.family_name = family_name;
  if (family_email) insertData.family_email = family_email;

  const { data: user, error } = await supabase.from('users').insert([insertData]).select().single();
  if (error) return res.status(400).json({ error: 'User already exists' });
  
  if (user.role === 'student') {
    await supabase.from('progress').insert([{ userId: user.id }]);
  }
  res.json({ success: true, message: 'Registration successful' });
});

app.post('/api/login', async (req, res) => {
  const { name, password, role } = req.body;
  const { data: user, error } = await supabase.from('users').select('*').eq('name', name).eq('password', password).single();
  
  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.role !== role) return res.status(401).json({ error: 'Role mismatch' });
  
  if (role === 'student') {
    const today = new Date().toISOString().split('T')[0];
    const { data: row } = await supabase.from('progress').select('lastActiveDate, streakCount').eq('userId', user.id).single();
    if (row) {
      let newStreak = row.streakCount || 0;
      let lastDate = row.lastActiveDate;
      if (lastDate !== today) {
        if (lastDate) {
          const diffDays = Math.round((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
          newStreak = diffDays === 1 ? newStreak + 1 : 1;
        } else {
          newStreak = 1;
        }
        await supabase.from('progress').update({ lastActiveDate: today, streakCount: newStreak }).eq('userId', user.id);
      }
      user.streakCount = newStreak;
    }
  }
  res.json({ success: true, user });
});

app.get('/api/seed', async (req, res) => {
  // Seed default course
  const { data: course } = await supabase.from('courses').insert([{ title: 'HTML Mastery', description: 'Learn the foundations of HTML' }]).select().single();
  if(!course) return res.json({ error: 'Course exists or error' });

  for(let stage of stages) {
    await supabase.from('stages').insert([{
      courseId: course.id,
      module: stage.module,
      title: stage.title,
      question: stage.question,
      hint: stage.hint,
      requiredElements: JSON.stringify(stage.requiredElements),
      sampleSolution: stage.sampleSolution,
      orderIndex: stage.id
    }]);
  }
  res.json({ success: true, message: 'Database seeded with courses and stages!' });
});

// Admin fetching courses and stages
app.get('/api/courses', async (req, res) => {
  const { data: courses } = await supabase.from('courses').select('*, stages(*)');
  res.json({ courses });
});

// Admin adding a course
app.post('/api/courses', async (req, res) => {
  const { title, description } = req.body;
  const { data, error } = await supabase.from('courses').insert([{ title, description }]).select();
  res.json({ success: !error, data, error });
});

// Admin adding a stage
app.post('/api/stages', async (req, res) => {
  const { courseId, module, title, question, hint, requiredElements, sampleSolution, orderIndex } = req.body;
  const { data, error } = await supabase.from('stages').insert([{
    courseId, module, title, question, hint,
    requiredElements: JSON.stringify(requiredElements),
    sampleSolution, orderIndex
  }]).select();
  res.json({ success: !error, data, error });
});

app.get('/api/admin/students', async (req, res) => {
  const { data: users, error } = await supabase.from('users').select('*, progress(*)').eq('role', 'student');
  if (error) return res.status(500).json({ error: 'Database error' });
  
  const { data: dbStages } = await supabase.from('stages').select('*').order('orderIndex', { ascending: true });
  
  const students = users.map(u => {
    const p = (u.progress && u.progress[0]) || {};
    return {
      ...u,
      currentStage: p.currentStage || 0,
      completedStages: JSON.parse(p.completedStages || '[]'),
      attempts: JSON.parse(p.attempts || '{}'),
      answers: JSON.parse(p.answers || '{}')
    };
  });
  
  res.json({ students, totalStages: dbStages ? dbStages.length : 0, stages: dbStages || [] });
});

app.get('/api/progress/:userId', async (req, res) => {
  let { data: row, error } = await supabase.from('progress').select('*').eq('userId', req.params.userId).single();
  
  // If progress not found, create it lazily
  if (!row) {
    const { data: newRow, error: insertErr } = await supabase.from('progress').insert([{ userId: req.params.userId }]).select().single();
    if (insertErr || !newRow) return res.status(500).json({ error: 'Failed to initialize progress' });
    row = newRow;
  }

  const { data: dbStages } = await supabase.from('stages').select('*').order('orderIndex', { ascending: true });
  if (!dbStages || dbStages.length === 0) return res.json({ error: 'No stages found in database. Run /api/seed' });

  const completedStages = JSON.parse(row.completedStages || '[]');
  const answers = JSON.parse(row.answers || '{}');
  const attempts = JSON.parse(row.attempts || '{}');
  const currentStageIdx = row.currentStage || 0;
  
  const currentStageData = dbStages[currentStageIdx];
  if(!currentStageData) return res.status(404).json({ error: 'Stage data missing' });

  res.json({
    progress: { currentStage: currentStageIdx, completedStages, answers, attempts, streakCount: row.streakCount || 0 },
    stages: dbStages,
    currentStageData: {
      ...currentStageData,
      sampleSolution: (attempts[currentStageIdx] || 0) >= 3 ? currentStageData.sampleSolution : null,
      attemptCount: attempts[currentStageIdx] || 0
    }
  });
});

app.post('/api/attempt', async (req, res) => {
  const { userId, code } = req.body;
  const { data: row, error } = await supabase.from('progress').select('*').eq('userId', userId).single();
  if (error || !row) return res.status(404).json({ error: 'Progress not found' });
  
  const { data: dbStages } = await supabase.from('stages').select('*').order('orderIndex', { ascending: true });
  const currentStageIdx = row.currentStage || 0;
  const stage = dbStages[currentStageIdx];
  
  if (!stage) return res.status(400).json({ error: 'Stage not found' });
  
  const attempts = JSON.parse(row.attempts || '{}');
  const answers = JSON.parse(row.answers || '{}');
  const completedStages = JSON.parse(row.completedStages || '[]');
  
  let attemptCount = (attempts[currentStageIdx] || 0) + 1;
  attempts[currentStageIdx] = attemptCount;
  answers[currentStageIdx] = code || '';
  
  let reqElements = [];
  if (stage.requiredElements) {
    try { 
      reqElements = typeof stage.requiredElements === 'string' ? JSON.parse(stage.requiredElements) : stage.requiredElements; 
      if (!Array.isArray(reqElements)) reqElements = stage.requiredElements.split(',');
    } catch(e) { reqElements = stage.requiredElements.split(','); }
  }
  
  let missing = reqElements.filter(req => !(code || '').toLowerCase().includes(req.toLowerCase()));
  
  if (missing.length === 0) {
    if (!completedStages.includes(currentStageIdx)) completedStages.push(currentStageIdx);
    await supabase.from('progress').update({ completedStages: JSON.stringify(completedStages), answers: JSON.stringify(answers), attempts: JSON.stringify(attempts) }).eq('userId', userId);
    res.json({ success: true, message: '✅ Great job! Your code is correct.', completedStages });
  } else {
    await supabase.from('progress').update({ answers: JSON.stringify(answers), attempts: JSON.stringify(attempts) }).eq('userId', userId);
    res.json({ success: false, message: `❌ Missing: ${missing.join(', ')}`, attemptCount, solution: attemptCount >= 3 ? stage.sampleSolution : null });
  }
});

app.post('/api/next', async (req, res) => {
  const { userId } = req.body;
  const { data: row } = await supabase.from('progress').select('*').eq('userId', userId).single();
  if (!row) return res.status(404).json({ error: 'Not found' });
  
  const { data: dbStages } = await supabase.from('stages').select('*');
  
  const completedStages = JSON.parse(row.completedStages || '[]');
  if (!completedStages.includes(row.currentStage)) return res.status(400).json({ error: 'Complete current stage first!' });
  
  if (row.currentStage < dbStages.length - 1) {
    await supabase.from('progress').update({ currentStage: row.currentStage + 1 }).eq('userId', userId);
    res.json({ success: true, currentStage: row.currentStage + 1 });
  } else {
    res.json({ success: true, finished: true });
  }
});

app.post('/api/setstage', async (req, res) => {
  const { userId, stageId } = req.body;
  const { data: row } = await supabase.from('progress').select('*').eq('userId', userId).single();
  const completedStages = JSON.parse(row.completedStages || '[]');
  
  if (stageId <= row.currentStage || completedStages.includes(stageId - 1)) {
    await supabase.from('progress').update({ currentStage: stageId }).eq('userId', userId);
    res.json({ success: true, currentStage: stageId });
  } else {
    res.status(400).json({ error: 'Stage locked' });
  }
});

app.post('/api/users/profile', async (req, res) => {
  const { userId, mentorId, profilePic, bio, expertise } = req.body;
  const updateData = {};
  if (mentorId !== undefined) updateData.mentorId = mentorId;
  if (profilePic !== undefined) updateData.profilePic = profilePic;
  if (bio !== undefined) updateData.bio = bio;
  if (expertise !== undefined) updateData.expertise = expertise;
  
  await supabase.from('users').update(updateData).eq('id', userId);
  res.json({ success: true });
});

app.get('/api/users/me', async (req, res) => {
  const { userId } = req.query;
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  res.json({ user });
});

app.get('/api/mentors', async (req, res) => {
  const { data: mentors } = await supabase.from('users').select('id, name, profilePic, bio, expertise').eq('role', 'admin');
  res.json({ mentors });
});

app.get('/api/messages/:userId', async (req, res) => {
  const { data: messages } = await supabase.from('messages').select('*, users!messages_senderId_fkey(name)').or(`senderId.eq.${req.params.userId},receiverId.eq.${req.params.userId}`).order('timestamp', { ascending: true });
  res.json({ messages: (messages || []).map(m => ({ ...m, senderName: m.users?.name })) });
});

app.post('/api/messages', async (req, res) => {
  await supabase.from('messages').insert([req.body]);
  res.json({ success: true });
});

app.get('/api/schedules/:userId/:role', async (req, res) => {
  const col = req.params.role === 'admin' ? 'mentorId' : 'studentId';
  const { data: schedules } = await supabase.from('schedules').select('*, users!schedules_studentId_fkey(name)').eq(col, req.params.userId);
  res.json({ schedules: (schedules || []).map(s => ({ ...s, studentName: s.users?.name })) });
});

app.post('/api/schedules', async (req, res) => {
  await supabase.from('schedules').insert([req.body]);
  res.json({ success: true });
});
app.delete('/api/schedules/:id', async (req, res) => {
  await supabase.from('schedules').delete().eq('id', req.params.id);
  res.json({ success: true });
});
app.put('/api/schedules/:id/attendance', async (req, res) => {
  await supabase.from('schedules').update({ attendance: req.body.attendance }).eq('id', req.params.id);
  res.json({ success: true });
});

app.get('/api/assignments/:userId/:role', async (req, res) => {
  const col = req.params.role === 'admin' ? 'mentorId' : 'studentId';
  const { data: assignments } = await supabase.from('assignments').select('*').eq(col, req.params.userId);
  const { data: submissions } = await supabase.from('submissions').select('*, assignments!inner(*)').eq(`assignments.${col}`, req.params.userId);
  res.json({ assignments: assignments || [], submissions: submissions || [] });
});

app.post('/api/assignments', async (req, res) => {
  await supabase.from('assignments').insert([req.body]);
  res.json({ success: true });
});
app.post('/api/submissions', async (req, res) => {
  await supabase.from('submissions').insert([req.body]);
  res.json({ success: true });
});
app.put('/api/submissions/:id/grade', async (req, res) => {
  await supabase.from('submissions').update({ grade: req.body.grade, comment: req.body.comment }).eq('id', req.params.id);
  res.json({ success: true });
});

// AI Chat Integration
app.post('/api/ask-ai', async (req, res) => {
  try {
    const { message, userRole, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env' });

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert AI coding mentor embedded in a structured learning dashboard. 
Your role shifts based on who is active:

WHEN ACTING AS MENTOR (Talking to a Student/Mentee):
- Explain concepts clearly, using analogies before code examples
- Never give full solutions immediately — scaffold with hints first
- Always include: the concept name, a minimal working example, and one common mistake to avoid
- After each explanation, ask one follow-up question to check understanding
- Format code with inline comments explaining each key line
- Label your responses: start with [MENTOR]

WHEN ACTING AS MENTEE (student simulation for demo/testing, talking to an Admin/Mentor):
- Ask one focused question at a time, as a beginner would
- Show partial, slightly broken code and ask for guidance — do not write perfect code
- Express confusion naturally ("I think I understand but...") to prompt deeper explanation
- Label your responses: start with [MENTEE]

DASHBOARD RULES (apply to all responses):
- Always specify the programming language at the top of every code block
- Keep explanations under 150 words before showing code
- After code, always add a "Try This" line: one small modification the student can attempt
- Track concepts introduced in the session and reference them when they reappear
- If the student is stuck after 2 attempts, reveal the answer with a full explanation
- Tone: encouraging, direct, zero jargon unless the jargon is being taught

Current active user role is: ${userRole === 'admin' ? 'Admin/Mentor (You should act as MENTEE)' : 'Student/Mentee (You should act as MENTOR)'}.`;

    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Start a chat session
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    // If there is history, we'd normally seed it, but for simplicity with @google/genai we can just send the whole history as an array if supported,
    // or just append the recent message. With the new SDK, chat instances maintain their own state or can be seeded.
    // To handle history explicitly:
    let responseText = '';
    if (formattedHistory.length > 0) {
      // Just manually construct the prompt string for simplicity if chat history seeding is complex
      const fullContext = history.map(h => `${h.role === 'user' ? 'User' : 'You'}: ${h.text}`).join('\\n') + `\\nUser: ${message}\\nYou:`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: fullContext }] }],
        config: { systemInstruction, temperature: 0.7 }
      });
      responseText = response.text;
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: { systemInstruction, temperature: 0.7 }
      });
      responseText = response.text;
    }

    res.json({ success: true, answer: responseText });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ error: 'Failed to communicate with AI' });
  }
});

// AI Lecture Notes Generator
app.post('/api/generate-notes', async (req, res) => {
  try {
    const { topic } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set in .env' });

    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `You are an expert curriculum developer. 
Create structured, engaging lecture notes for the topic provided by the user.
Format the output in clear Markdown with the following sections:
1. **Title**: The topic name
2. **Learning Objectives**: 3 bullet points
3. **Core Concepts**: Clear explanations of the main ideas
4. **Code/Real-World Examples**: Provide concrete examples
5. **Common Mistakes**: Pitfalls to avoid
6. **Key Takeaways**: A quick summary

Keep it concise, professional, and ready to be used by a mentor to teach a student.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Topic: ${topic}` }] }],
      config: { systemInstruction, temperature: 0.7 }
    });

    res.json({ success: true, notes: response.text });
  } catch (error) {
    console.error('AI Notes Error:', error);
    res.status(500).json({ error: 'Failed to generate notes' });
  }
});

// AI Weekly Family Summary Generator
app.post('/api/admin/generate-summaries', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });

    const ai = new GoogleGenAI({ apiKey });

    // Fetch all students and their progress
    const { data: students } = await supabase.from('users').select('id, name, mentorId, family_name, family_email').eq('role', 'student');
    const { data: progress } = await supabase.from('progress').select('*');
    
    const logs = [];

    for (const student of students) {
      if (!student.family_email) continue;

      const studentProgress = progress.find(p => p.userId === student.id);
      const completedStagesCount = studentProgress ? (JSON.parse(studentProgress.completedStages || '[]')).length : 0;
      
      const prompt = `You are the lead mentor for a coding platform. Write a short, encouraging weekly progress email (2-3 sentences) to the family of a student.
Student Name: ${student.name}
Family Name: ${student.family_name || 'Family'}
Stages Completed: ${completedStagesCount}
Tone: Professional, warm, and encouraging.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.7 }
      });

      logs.push({
        studentName: student.name,
        family_name: student.family_name,
        family_email: student.family_email,
        summary: response.text
      });
    }

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Summary Error:', error);
    res.status(500).json({ error: 'Failed to generate summaries' });
  }
});

// Zoom Web SDK Signature
app.post('/api/zoom/signature', (req, res) => {
  const { meetingNumber, role } = req.body;
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;
  
  if (!sdkKey || !sdkSecret) {
    return res.status(500).json({ error: 'Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET in .env' });
  }

  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2;
  const oHeader = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sdkKey: sdkKey,
    appKey: sdkKey,
    mn: meetingNumber,
    role: role || 0,
    iat: iat,
    exp: exp,
    tokenExp: exp
  };

  const signature = jwt.sign(payload, sdkSecret, { header: oHeader });
  res.json({ signature });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
