console.log(process.env.PGUSER);

const express = require("express");
const { resolve } = require("path");
const { login } = require("./db.js");

const port = process.env.PORT || process.argv[3] || 3010;
const app = express();

app.use(express.json());
app.use(express.static("pages"));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
	console.log(`Received ${req.method} request for ${req.url}`);
	next();
});

let user = null;

app.get("/login", async (req, res) => {
  /*
  lurleen.yearne@aphella.com
  9593313256
  */
  if (user) {
    res.sendFile(resolve(__dirname, "pages/" + user.type + "/dashboard.html"));
  } else {
    res.sendFile(resolve(__dirname, "pages/everyone/login.html"));
  }
});

app.get("/", (req, res) => {
  if (user) {
    res.sendFile(resolve(__dirname, "pages/" + user.type + "/dashboard.html"));
  } else {
    res.sendFile(resolve(__dirname, "pages/everyone/index.html"));
  }
});

app.get("/dashboard", async (req, res) => {
  if (user) {
    res.sendFile(resolve(__dirname, "pages/" + user.type + "/dashboard.html"));
  } else {
    res.sendFile(resolve(__dirname, "pages/everyone/login.html"));
  }
});

app.get("/appointments", async (req, res) => {
  if (user) {
    if (["admin", "staff"].includes(user.type)) {
      res.sendFile(resolve(__dirname, "pages/" + user.type + "/appointments.html"));
    } else {
      // If the user came from another page on our site, send them back
      if (req.headers.referer && req.headers.referer.includes(req.headers.host)) {
        res.redirect(req.headers.referer);
      } else {
        // If the user didn't come from another page on our site, send them to the dashboard
        res.redirect('/dashboard');
      }
    }
  } else {
    res.sendFile(resolve(__dirname, "pages/everyone/login.html"));
  }
});

app.get("/payments", async (req, res) => {
  if (user) {
    res.sendFile(resolve(__dirname, "pages/" + user.type + "/appointments.html"));
  } else {
    res.sendFile(resolve(__dirname, "pages/everyone/login.html"));
  }
});

app.get("*", (req, res) => {
	res.sendFile(resolve(__dirname, "pages/everyone/404.html"));
});

app.listen(port, () => {
	console.log(`Listening on port :${port}`);
});

app.post("/identify-user", async (req, res) => {
  try {
    loginCredentials = req.body;
    ({ user, userInDatabase } = await login(loginCredentials.email, loginCredentials.password));

    if (userInDatabase) {
      // Redirect to dashboard if user exists
      res.status(200).json({ body: { user } });
    } else {
      // Handle case when user doesn't exist (e.g., show an error page)
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/dashboard-content", async (req, res) => {
  res.status(200).json({ body: { user } });
});