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
  console.log('Test!');
  res.sendFile(resolve(__dirname, 'pages/index.html'));

  postgres.connect((err, client, done) => {
    if (err) throw err;
    const start = Date.now();
    client.query('SELECT NOW()', (err, res) => {
      const duration = Date.now() - start;
      console.log('Query executed in:', duration, 'ms');
      done();
      if (err) {
        console.log(err.stack);
      } else {
        console.log(res.rows[0]);
      }
    });
  });

  try {
    console.log('Test2!');
    const result = await postgres.query('SELECT NOW()');
    console.log('Test3!');
    console.log(result.rows);
  } catch (err) {
    console.log('Test4!');
    console.error('Error executing query', err.stack);
    console.log('Test5!');
  } finally {
    console.log('Test6!');
    await postgres.end();
    console.log('Test7!');
  }
});

app.listen(port, () => {
  console.log(`Listening on port :${port}`);
});
