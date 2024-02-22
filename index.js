const express = require('express');
const { resolve } = require('path');
const { Pool } = require('pg');

const postgres = new Pool({
  connectionString:
    'postgres://ehnkalbh:fEH4i_6aiiDNIurKPcZP0OGhqlDv1RT5@surus.db.elephantsql.com/ehnkalbh',
});

const app = express();
const port = 3010;

app.use(express.static('static'));

app.get('/', async (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/login.html'));
});

app.listen(port, () => {
  console.log(`Listening on port :${port}`);
});
