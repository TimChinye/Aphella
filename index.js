const express = require('express');
const { resolve } = require('path');

let user = null;
const port = process.env.PORT || 3010;
const app = express();

app.use(express.json());
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true }));

// Middleware for logging requests (optional)
app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.get('/login', async (req, res) => {
    res.sendFile(resolve(__dirname, 'pages/login.html'));
});

app.post('/submit-login', async (req, res) => {
  try {
      const user = req.body; // Assuming you have middleware to parse the request body
      console.log(user);

      const userExistsInDatabase = true; // Temporary - PSQL Connection
      if (userExistsInDatabase) {
          // Redirect to dashboard if user exists
          res.status(200).json({ success: true, user }); // Include user data
      } else {
          // Handle case when user doesn't exist (e.g., show an error page)
          res.status(404).send('User not found');
      }
  } catch (error) {
      // Handle exceptions during redirection
      console.error('Error during login:', error);
      res.status(500).send('Internal server error');
  }
});


app.get('/dashboard', async (req, res) => {
    res.sendFile(resolve(__dirname, 'pages/dashboard.html'));
});

app.listen(port, () => {
    console.log(`Listening on port :${port}`);
});
