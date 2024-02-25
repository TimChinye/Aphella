const { readFile } = require('fs').promises;
const { join } = require('path');

module.exports = async (req, res) => {
  const content = await readFile(join(__dirname, '..', 'pages', 'login.html'));
  res.setHeader('content-type', 'text/html');
  res.send(content);
};