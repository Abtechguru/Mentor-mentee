const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const dbPath = process.env.DB_PATH || './database.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err.message);
  console.log(`Connected to the SQLite database at ${dbPath}`);
});

// Initialize DB schema
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    password TEXT,
    role TEXT,
    mentorId INTEGER DEFAULT NULL,
    profilePic TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add new columns to existing users table if they don't exist
  db.run(`ALTER TABLE users ADD COLUMN mentorId INTEGER DEFAULT NULL`, (err) => {});
  db.run(`ALTER TABLE users ADD COLUMN profilePic TEXT DEFAULT ''`, (err) => {});

  db.run(`CREATE TABLE IF NOT EXISTS progress (
    userId INTEGER PRIMARY KEY,
    currentStage INTEGER DEFAULT 0,
    completedStages TEXT DEFAULT '[]',
    answers TEXT DEFAULT '{}',
    attempts TEXT DEFAULT '{}',
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER,
    receiverId INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentorId INTEGER,
    studentId INTEGER,
    topic TEXT,
    date TEXT,
    link TEXT,
    attendance TEXT DEFAULT 'pending' -- pending, present, absent
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mentorId INTEGER,
    studentId INTEGER,
    title TEXT,
    description TEXT,
    dueDate TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignmentId INTEGER,
    studentId INTEGER,
    fileData TEXT, -- base64 string
    fileName TEXT,
    grade TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin if not exists
  db.get("SELECT * FROM users WHERE name = 'Mentor'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (name, password, role) VALUES ('Mentor', 'admin123', 'admin')");
    }
  });
});

const stages = [
  // Module 1: HTML Foundations
  {
    id: 0,
    module: "1. HTML Foundations",
    title: "1.1 The DOCTYPE and HTML Tags",
    question: "Start your HTML document by declaring the document type and adding the root <html> tags.",
    hint: "Use <!DOCTYPE html> followed by <html> and </html>.",
    requiredElements: ["<!DOCTYPE html>", "<html>", "</html>"],
    sampleSolution: "<!DOCTYPE html>\n<html>\n</html>"
  },
  {
    id: 1,
    module: "1. HTML Foundations",
    title: "1.2 The Head and Title",
    question: "Add a <head> section containing a <title> that says 'My First Page'.",
    hint: "The <head> goes inside <html>, and <title> goes inside <head>.",
    requiredElements: ["<head>", "<title>", "My First Page", "</title>", "</head>"],
    sampleSolution: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n</html>"
  },
  {
    id: 2,
    module: "1. HTML Foundations",
    title: "1.3 The Body Tag",
    question: "Add a <body> tag after the <head>. Inside it, write 'Hello World'.",
    hint: "The <body> contains the visible content of your page.",
    requiredElements: ["<body>", "Hello World", "</body>"],
    sampleSolution: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My First Page</title>\n</head>\n<body>\n  Hello World\n</body>\n</html>"
  },
  // Module 2: Text Formatting
  {
    id: 3,
    module: "2. Text Formatting",
    title: "2.1 Headings",
    question: "Create a main heading (h1) saying 'Welcome' and a sub-heading (h2) saying 'About Me'.",
    hint: "Use <h1> and <h2> tags.",
    requiredElements: ["<h1>", "Welcome", "</h1>", "<h2>", "About Me", "</h2>"],
    sampleSolution: "<h1>Welcome</h1>\n<h2>About Me</h2>"
  },
  {
    id: 4,
    module: "2. Text Formatting",
    title: "2.2 Paragraphs",
    question: "Create two paragraphs. One saying 'This is paragraph one.' and the other 'This is paragraph two.'",
    hint: "Use the <p> tag for each.",
    requiredElements: ["<p>", "This is paragraph one.", "</p>", "This is paragraph two."],
    sampleSolution: "<p>This is paragraph one.</p>\n<p>This is paragraph two.</p>"
  },
  {
    id: 5,
    module: "2. Text Formatting",
    title: "2.3 Bold and Italic",
    question: "Create a paragraph. Make the word 'Bold' bold using <strong>, and 'Italic' italicized using <em>.",
    hint: "Use <strong> for bold and <em> for italic.",
    requiredElements: ["<strong>", "Bold", "</strong>", "<em>", "Italic", "</em>"],
    sampleSolution: "<p>This is <strong>Bold</strong> and this is <em>Italic</em>.</p>"
  },
  // Module 3: Links and Images
  {
    id: 6,
    module: "3. Links and Images",
    title: "3.1 Anchor Tags (Links)",
    question: "Create a link to 'https://google.com' with the text 'Go to Google'.",
    hint: "Use the <a> tag with the 'href' attribute.",
    requiredElements: ["<a", "href=", "https://google.com", "Go to Google", "</a>"],
    sampleSolution: "<a href='https://google.com'>Go to Google</a>"
  },
  {
    id: 7,
    module: "3. Links and Images",
    title: "3.2 Images",
    question: "Add an image with the source 'logo.png' and an alt text of 'Company Logo'.",
    hint: "Use the <img> tag with 'src' and 'alt' attributes.",
    requiredElements: ["<img", "src=", "logo.png", "alt=", "Company Logo"],
    sampleSolution: "<img src='logo.png' alt='Company Logo'>"
  },
  {
    id: 8,
    module: "3. Links and Images",
    title: "3.3 Image Links",
    question: "Wrap an image (src='button.png', alt='Click Me') inside a link that goes to 'https://example.com'.",
    hint: "Place an <img> tag inside an <a> tag.",
    requiredElements: ["<a", "href=", "https://example.com", "<img", "src=", "button.png"],
    sampleSolution: "<a href='https://example.com'>\n  <img src='button.png' alt='Click Me'>\n</a>"
  },
  // Module 4: Lists
  {
    id: 9,
    module: "4. Lists",
    title: "4.1 Unordered Lists",
    question: "Create an unordered list with two items: 'Milk' and 'Bread'.",
    hint: "Use <ul> for the list and <li> for the items.",
    requiredElements: ["<ul>", "<li>", "Milk", "</li>", "Bread"],
    sampleSolution: "<ul>\n  <li>Milk</li>\n  <li>Bread</li>\n</ul>"
  },
  {
    id: 10,
    module: "4. Lists",
    title: "4.2 Ordered Lists",
    question: "Create an ordered list with two steps: 'Step 1' and 'Step 2'.",
    hint: "Use <ol> for the ordered list and <li> for the items.",
    requiredElements: ["<ol>", "<li>", "Step 1", "</li>", "Step 2"],
    sampleSolution: "<ol>\n  <li>Step 1</li>\n  <li>Step 2</li>\n</ol>"
  },
  // Module 5: Tables
  {
    id: 11,
    module: "5. Tables",
    title: "5.1 Basic Table Structure",
    question: "Create a <table> with one row (<tr>) and two data cells (<td>): 'Cell 1' and 'Cell 2'.",
    hint: "Nesting: table > tr > td.",
    requiredElements: ["<table>", "<tr>", "<td>", "Cell 1", "Cell 2"],
    sampleSolution: "<table>\n  <tr>\n    <td>Cell 1</td>\n    <td>Cell 2</td>\n  </tr>\n</table>"
  },
  {
    id: 12,
    module: "5. Tables",
    title: "5.2 Table Headers",
    question: "Add a row with table headers (<th>): 'Name' and 'Age', above a row with data: 'John' and '30'.",
    hint: "Use <th> for header cells.",
    requiredElements: ["<table>", "<tr>", "<th>", "Name", "Age", "<td>", "John", "30"],
    sampleSolution: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Age</th>\n  </tr>\n  <tr>\n    <td>John</td>\n    <td>30</td>\n  </tr>\n</table>"
  },
  // Module 6: Forms
  {
    id: 13,
    module: "6. Forms",
    title: "6.1 Text Inputs and Labels",
    question: "Create a <form> containing a <label> 'Username:' and a text <input>.",
    hint: "Use <form>, <label>, and <input type='text'>.",
    requiredElements: ["<form>", "<label>", "Username:", "<input", "type=", "text"],
    sampleSolution: "<form>\n  <label>Username:</label>\n  <input type='text' name='username'>\n</form>"
  },
  {
    id: 14,
    module: "6. Forms",
    title: "6.2 Form Submit Button",
    question: "Add a submit button to a form. The button should say 'Send'.",
    hint: "Use <input type='submit' value='Send'> or <button type='submit'>Send</button>.",
    requiredElements: ["<form>", "submit", "Send"],
    sampleSolution: "<form>\n  <input type='submit' value='Send'>\n</form>"
  },
  {
    id: 15,
    module: "6. Forms",
    title: "6.3 Checkboxes and Radios",
    question: "Create a form with a checkbox 'Subscribe' and two radio buttons for 'Yes' and 'No'.",
    hint: "Use <input type='checkbox'> and <input type='radio'>.",
    requiredElements: ["type=", "checkbox", "Subscribe", "radio", "Yes", "No"],
    sampleSolution: "<form>\n  <input type='checkbox' name='sub'> Subscribe<br>\n  <input type='radio' name='choice' value='yes'> Yes\n  <input type='radio' name='choice' value='no'> No\n</form>"
  },
  {
    id: 16,
    module: "6. Forms",
    title: "6.4 Dropdowns (Select)",
    question: "Create a drop-down menu with <select> containing two <option>s: 'Apple' and 'Orange'.",
    hint: "Use <select> and inside it place your <option> tags.",
    requiredElements: ["<select>", "<option>", "Apple", "</option>", "Orange"],
    sampleSolution: "<select name='fruits'>\n  <option value='apple'>Apple</option>\n  <option value='orange'>Orange</option>\n</select>"
  },
  // Module 7: Semantic HTML
  {
    id: 17,
    module: "7. Semantic HTML",
    title: "7.1 Header and Nav",
    question: "Create a <header> containing an h1 'Site Title', and a <nav> containing a link 'Home'.",
    hint: "Use <header>, <h1>, <nav>, and <a> tags.",
    requiredElements: ["<header>", "<h1>", "Site Title", "<nav>", "<a", "Home"],
    sampleSolution: "<header>\n  <h1>Site Title</h1>\n  <nav>\n    <a href='/'>Home</a>\n  </nav>\n</header>"
  },
  {
    id: 18,
    module: "7. Semantic HTML",
    title: "7.2 Main, Section, and Footer",
    question: "Create a <main> area containing a <section> with some text, and a <footer> with 'Copyright'.",
    hint: "Use <main>, <section>, and <footer> tags.",
    requiredElements: ["<main>", "<section>", "<footer>", "Copyright"],
    sampleSolution: "<main>\n  <section>\n    <p>Some interesting content here.</p>\n  </section>\n</main>\n<footer>Copyright 2026</footer>"
  }
];

// Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.post('/api/register', (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password) return res.status(400).json({ error: 'Missing fields' });
  
  db.run("INSERT INTO users (name, password, role) VALUES (?, ?, ?)", [name, password, role || 'student'], function(err) {
    if (err) return res.status(400).json({ error: 'User already exists' });
    
    const userId = this.lastID;
    if (role === 'student' || !role) {
      db.run("INSERT INTO progress (userId) VALUES (?)", [userId]);
    }
    res.json({ success: true, message: 'Registration successful' });
  });
});

app.post('/api/login', (req, res) => {
  const { name, password, role } = req.body;
  db.get("SELECT * FROM users WHERE name = ? AND password = ?", [name, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role !== role) return res.status(401).json({ error: 'Role mismatch' });
    
    res.json({ success: true, user });
  });
});

app.get('/api/admin/students', (req, res) => {
  db.all("SELECT u.id, u.name, p.currentStage, p.completedStages, p.attempts, p.answers FROM users u LEFT JOIN progress p ON u.id = p.userId WHERE u.role = 'student'", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ 
      students: rows.map(r => ({
        ...r,
        completedStages: JSON.parse(r.completedStages || '[]'),
        attempts: JSON.parse(r.attempts || '{}'),
        answers: JSON.parse(r.answers || '{}')
      })),
      totalStages: stages.length,
      stages: stages.map(s => ({ id: s.id, title: s.title, module: s.module }))
    });
  });
});

app.get('/api/progress/:userId', (req, res) => {
  db.get("SELECT * FROM progress WHERE userId = ?", [req.params.userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Progress not found' });
    
    const completedStages = JSON.parse(row.completedStages || '[]');
    const answers = JSON.parse(row.answers || '{}');
    const attempts = JSON.parse(row.attempts || '{}');
    const currentStageIdx = row.currentStage;
    
    const stageDetails = stages.map(s => ({ id: s.id, title: s.title, module: s.module }));
    
    const currentStageData = stages[currentStageIdx];
    const attemptCount = attempts[currentStageIdx] || 0;
    
    res.json({
      progress: {
        currentStage: currentStageIdx,
        completedStages,
        answers,
        attempts
      },
      stages: stageDetails,
      currentStageData: {
        id: currentStageData.id,
        title: currentStageData.title,
        question: currentStageData.question,
        hint: currentStageData.hint,
        // Only provide solution if attempts >= 3
        sampleSolution: attemptCount >= 3 ? currentStageData.sampleSolution : null,
        attemptCount
      }
    });
  });
});

app.post('/api/attempt', (req, res) => {
  const { userId, code } = req.body;
  db.get("SELECT * FROM progress WHERE userId = ?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Progress not found' });
    
    const currentStageIdx = row.currentStage;
    const stage = stages[currentStageIdx];
    const attempts = JSON.parse(row.attempts || '{}');
    const answers = JSON.parse(row.answers || '{}');
    const completedStages = JSON.parse(row.completedStages || '[]');
    
    let attemptCount = attempts[currentStageIdx] || 0;
    attemptCount += 1;
    attempts[currentStageIdx] = attemptCount;
    answers[currentStageIdx] = code;
    
    let allPresent = true;
    const missing = [];
    for (let required of stage.requiredElements) {
      if (!code.toLowerCase().includes(required.toLowerCase())) {
        allPresent = false;
        missing.push(required);
      }
    }
    
    if (allPresent) {
      if (!completedStages.includes(currentStageIdx)) {
        completedStages.push(currentStageIdx);
      }
      
      db.run("UPDATE progress SET completedStages = ?, answers = ?, attempts = ? WHERE userId = ?",
        [JSON.stringify(completedStages), JSON.stringify(answers), JSON.stringify(attempts), userId],
        (err) => {
          res.json({
            success: true,
            message: '✅ Great job! Your code is correct. You can move to the next stage!',
            completedStages
          });
        }
      );
    } else {
      db.run("UPDATE progress SET answers = ?, attempts = ? WHERE userId = ?",
        [JSON.stringify(answers), JSON.stringify(attempts), userId],
        (err) => {
          let solution = null;
          if (attemptCount >= 3) {
            solution = stage.sampleSolution;
          }
          res.json({
            success: false,
            message: `❌ Not quite right! Missing: ${missing.join(', ')}. Keep trying!`,
            attemptCount,
            solution
          });
        }
      );
    }
  });
});

app.post('/api/next', (req, res) => {
  const { userId } = req.body;
  db.get("SELECT * FROM progress WHERE userId = ?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Progress not found' });
    const currentStageIdx = row.currentStage;
    const completedStages = JSON.parse(row.completedStages || '[]');
    
    if (!completedStages.includes(currentStageIdx)) {
      return res.status(400).json({ error: 'Please complete the current stage first!' });
    }
    
    if (currentStageIdx < stages.length - 1) {
      db.run("UPDATE progress SET currentStage = ? WHERE userId = ?", [currentStageIdx + 1, userId], (err) => {
        res.json({ success: true, currentStage: currentStageIdx + 1 });
      });
    } else {
      res.json({ success: true, finished: true });
    }
  });
});

app.post('/api/setstage', (req, res) => {
  const { userId, stageId } = req.body;
  db.get("SELECT * FROM progress WHERE userId = ?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Progress not found' });
    const completedStages = JSON.parse(row.completedStages || '[]');
    
    if (stageId <= row.currentStage || completedStages.includes(stageId - 1)) {
      db.run("UPDATE progress SET currentStage = ? WHERE userId = ?", [stageId, userId], (err) => {
        res.json({ success: true, currentStage: stageId });
      });
    } else {
      res.status(400).json({ error: 'Stage locked' });
    }
  });
});

// --- NEW LMS ENDPOINTS ---

// Profile Update (Mentor assignment & Pic)
app.post('/api/users/profile', (req, res) => {
  const { userId, mentorId, profilePic } = req.body;
  db.run("UPDATE users SET mentorId = ?, profilePic = ? WHERE id = ?", [mentorId, profilePic, userId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update profile' });
    res.json({ success: true });
  });
});

// Get Mentors
app.get('/api/mentors', (req, res) => {
  db.all("SELECT id, name, profilePic FROM users WHERE role = 'admin'", (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json({ mentors: rows });
  });
});

// Messages
app.get('/api/messages/:userId', (req, res) => {
  db.all("SELECT m.*, u.name as senderName FROM messages m JOIN users u ON m.senderId = u.id WHERE m.senderId = ? OR m.receiverId = ? ORDER BY timestamp ASC", [req.params.userId, req.params.userId], (err, rows) => {
    res.json({ messages: rows });
  });
});
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, content } = req.body;
  db.run("INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)", [senderId, receiverId, content], (err) => {
    res.json({ success: true });
  });
});

// Schedules
app.get('/api/schedules/:userId/:role', (req, res) => {
  const { userId, role } = req.params;
  const col = role === 'admin' ? 'mentorId' : 'studentId';
  db.all(`SELECT s.*, u.name as studentName FROM schedules s JOIN users u ON s.studentId = u.id WHERE s.${col} = ?`, [userId], (err, rows) => {
    res.json({ schedules: rows });
  });
});
app.post('/api/schedules', (req, res) => {
  const { mentorId, studentId, topic, date, link } = req.body;
  db.run("INSERT INTO schedules (mentorId, studentId, topic, date, link) VALUES (?, ?, ?, ?, ?)", [mentorId, studentId, topic, date, link], (err) => {
    res.json({ success: true });
  });
});
app.put('/api/schedules/:id/attendance', (req, res) => {
  const { attendance } = req.body;
  db.run("UPDATE schedules SET attendance = ? WHERE id = ?", [attendance, req.params.id], (err) => {
    res.json({ success: true });
  });
});

// Assignments
app.get('/api/assignments/:userId/:role', (req, res) => {
  const { userId, role } = req.params;
  const col = role === 'admin' ? 'mentorId' : 'studentId';
  db.all(`SELECT a.* FROM assignments a WHERE a.${col} = ?`, [userId], (err, assignments) => {
    db.all(`SELECT s.* FROM submissions s JOIN assignments a ON s.assignmentId = a.id WHERE a.${col} = ?`, [userId], (err, submissions) => {
      res.json({ assignments, submissions });
    });
  });
});
app.post('/api/assignments', (req, res) => {
  const { mentorId, studentId, title, description, dueDate } = req.body;
  db.run("INSERT INTO assignments (mentorId, studentId, title, description, dueDate) VALUES (?, ?, ?, ?, ?)", [mentorId, studentId, title, description, dueDate], (err) => {
    res.json({ success: true });
  });
});

// Submissions
app.post('/api/submissions', (req, res) => {
  const { assignmentId, studentId, fileData, fileName } = req.body;
  db.run("INSERT INTO submissions (assignmentId, studentId, fileData, fileName) VALUES (?, ?, ?, ?)", [assignmentId, studentId, fileData, fileName], (err) => {
    res.json({ success: true });
  });
});
app.put('/api/submissions/:id/grade', (req, res) => {
  const { grade, comment } = req.body;
  db.run("UPDATE submissions SET grade = ?, comment = ? WHERE id = ?", [grade, comment, req.params.id], (err) => {
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
