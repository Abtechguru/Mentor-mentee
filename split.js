const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'public/app.html'), 'utf8');

const headEnd = html.indexOf('<div id="authSection"');
const authEnd = html.indexOf('<div id="mainApp"');
const adminStart = html.indexOf('<div id="adminPanel"');
const studentStart = html.indexOf('<div id="studentContent"');
const scriptStart = html.indexOf('<script>');

const head = html.slice(0, headEnd);
const auth = html.slice(headEnd, authEnd);
const header = html.slice(authEnd, adminStart); // Note: this contains <div id="mainApp"> and <div class="header">
const admin = html.slice(adminStart, studentStart);
const student = html.slice(studentStart, scriptStart - 10); // leave some space for closing </div> of mainApp
const scriptsAndTail = html.slice(scriptStart);

// Clean up student to ensure it doesn't grab the closing </div> of mainApp
// We know studentContent ends just before <script>, but there's a </div> for mainApp right before it.
const studentMatch = html.match(/<div id="studentContent"[\s\S]*?<\/div>\s*<\/div>/);
// Actually, let's just use string replacement on the whole file instead of fragile slicing.

const appEjs = `
<%- include('partials/head') %>

<%- include('components/auth') %>

<div id="mainApp" class="main-container">
  <div class="header glass-panel fade-in">
    <div class="logo">🏫 ABTECH TUTOR - HTML Mastery</div>
    <div class="user-info">
      <span id="streakDisplay" style="display:none; color:#fbbf24; font-weight:bold; margin-right: 15px; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);"></span>
      <span id="userNameDisplay"></span>
      <span id="userRoleDisplay"></span>
      <button class="logout-btn" onclick="logout()">Logout</button>
    </div>
  </div>

  <%- include('components/admin') %>
  <%- include('components/student') %>
</div>

<%- include('components/scripts') %>
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, 'views/partials'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'views/components'), { recursive: true });

fs.writeFileSync(path.join(__dirname, 'views/app.ejs'), appEjs);
fs.writeFileSync(path.join(__dirname, 'views/partials/head.ejs'), head);
fs.writeFileSync(path.join(__dirname, 'views/components/auth.ejs'), auth);

// Extract Admin accurately
const adminContent = html.slice(adminStart, studentStart).trim();
fs.writeFileSync(path.join(__dirname, 'views/components/admin.ejs'), adminContent);

// Extract Student accurately
const studentEndMatch = html.indexOf('</div>\n\n<script>'); // Before the script tag there is the closing mainApp div
const studentEndActual = html.lastIndexOf('</div>', scriptStart);
const studentContent = html.slice(studentStart, studentEndActual).trim();
fs.writeFileSync(path.join(__dirname, 'views/components/student.ejs'), studentContent);

// Extract Scripts
const scriptsContent = html.slice(scriptStart, html.indexOf('</body>')).trim();
fs.writeFileSync(path.join(__dirname, 'views/components/scripts.ejs'), scriptsContent);

console.log("Successfully extracted EJS components!");
