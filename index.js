const express = require('express');
const { resolve } = require('path');

const user = null;
const port = process.env.PORT || 3010;
const app = express();

app.use(express.json());
app.use(express.static('static'));

app.get('/login', async (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/login.html'));
});

app.post('/submit-login', async (req, res) => {
  user = req.body;
  // check if user is in the database, if so, go to dashboard
  // only check the email address and phone number, code and password can be ignored
  res.redirect('/dashboard');
});

app.get('/dashboard', async (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/dashboard.html'));
});

app.listen(port, () => {
  console.log(`Listening on port :${port}`);
});