const postgres = require('postgres');

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: 'require',
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

async function getPgVersion() {
  const result = await sql`select version()`;
  console.log(result);
}
getPgVersion();
console.log("test");

/*
const express = require('express');
const { resolve } = require('path');

let user = null;
const port = process.env.PORT || 3010;
const app = express();

app.use(express.json());
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.get('/login', async (req, res) => {
    res.sendFile(resolve(__dirname, 'pages/login.html'));
});

app.post('/submit-login', async (req, res) => {
  try {
      const user = req.body;
      console.log(user);

      const userExistsInDatabase = true; // Temporary - PSQL Connection
      if (userExistsInDatabase) {
          // Redirect to dashboard if user exists
          res.status(200).json({ body: { user } });
      } else {
          // Handle case when user doesn't exist (e.g., show an error page)
          res.status(404).json({ error: 'User not found' });
      }
  } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send({ error: 'Internal server error' });
  }
});


app.get('/dashboard', async (req, res) => {
    res.sendFile(resolve(__dirname, 'pages/dashboard.html'));
});

app.get('*', (req, res) => {
    res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.listen(port, () => {
    console.log(`Listening on port :${port}`);
});
*/