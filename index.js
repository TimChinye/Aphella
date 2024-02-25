const express = require('express');
const { resolve } = require('path');

const port = process.env.PORT || 3010;
const app = express();

app.use(express.static('static'));

app.get('/', async (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/login.html'));
});

app.listen(port, () => {
  console.log(`Listening on port :${port}`);
});