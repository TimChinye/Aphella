/*
List of everything I need to do:

Design and develop:
- Payments page for staff
- Settings page for staff
- Chat page for staff

- Everything for admins and patients (mostly copy and paste... I hope)

- Home page
- About page
- Partners page
- Contact Us page

- 404 page

Inject database, but also offer the option to view the site with placeholder information for demonstration purposes.

CRUD operations, ability to add users, add appointments, etc.

Last Updated: ?
Due: 25/04/2024
*/

/*

To do list:
- Show total number of requests (/ store all data in req.user / req.session)

Then:
- Appointments
- Make an appointment
- Make a request

Then:
- Patient account
- Admin account

Then:
- Home page
- Parnters
- Contact Us

Then:
- Settings
- Communicate / Chat page
- Payments

Last Updated: 27/04/2024
Due: 02/05/2024
*/

/*

To do list:
- Patients page

- Make an appointment
- Make a request

Then:
- Patient account
- Admin account

Then:
- Home page
- Parnters
- Contact Us

Then:
- Settings
- Communicate / Chat page
- Payments

Last Updated: 29/04/2024
Due: 02/05/2024
*/

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { resolve } = require("path");
const { loginUser, getStaff, getPatient, getJob, getAppointmentsByUserId, getPatientsByDoctor, getRequestsReceivedByStaffId, getLastXRequestsReceivedByStaffId } = require("./db.js");

const port = process.env.PORT || process.argv[3] || 3010;
const app = express();

app.use(express.json());
app.use(express.static("client"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'UnicornWhisperer42',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 100 * 365 * 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
	console.log(`Received ${req.method} request for ${req.url}`);
	next();
});

app.listen(port, () => {
	console.log(`Listening on port :${port}`);
});

/* General Route Handlers */

app.get("/grab/user", async (req, res) => {
  if (req.user) res.status(200).json(req.user);
  else res.redirect('/login');
});

app.get("/grab/user/job", async (req, res) => {
  if (req.user) {
    if (req.user.jobid) {
      let job = await getJob(req.user.jobid);
      res.status(200).json(job);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/user/appointments", async (req, res) => {
  if (req.user) {
    let appointments = getAppointmentsByUserId(req.user.type, req.user.patientid ?? req.user.staffid);
		console.log(appointments);
    res.status(200).json(appointments);
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/user/requests-received", async (req, res) => {
  if (req.user) {
    if (req.user.staffid) {
      let requests = await getRequestsReceivedByStaffId(req.user.staffid);
      res.status(200).json(requests);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/user/last-requests-received/:amount", async (req, res) => {
  if (req.user) {
    if (req.user.staffid) {
      let requests = await getLastXRequestsReceivedByStaffId(req.user.staffid, req.params.amount);
      res.status(200).json(requests);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/user/patients", async (req, res) => {
  if (req.user) {
    if (req.user.staffid) {
      let patients = await getPatientsByDoctor(req.user.staffid);
      res.status(200).json(patients);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/staff/:id", async (req, res) => {
  if (req.user) {
    if (req.user.staffid) {
      let staff = await getStaff(req.params.id);
      res.status(200).json(staff);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

app.get("/grab/patients/:id", async (req, res) => {
  if (req.user) {
    if (req.user.staffid) {
      let patients = await getPatient(req.params.id);
      res.status(200).json(patients);
    } else res.status(404).json({ message: 'User is not a staff member.' });
  } else {
    res.redirect('/login');
  }
});

/* Uility Functions */

const serveFile = (res, path) => res.sendFile(resolve(__dirname, 'client/pages/' + path + '/index.html'));

/* Authentication Route Handlers */

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
      let { user, userInDatabase } = await loginUser(email, password);

      user.id = user.patientid ?? user.staffid;

      if (userInDatabase) return done(null, user);
      else return done(null, false, { message: "User not found" });
  } catch (error) {
      return done(error, false, { message: "Internal server error" });
  }
}));

passport.serializeUser(({ emailaddress, id }, done) => {
  done(null, { emailaddress, id }); 
});

passport.deserializeUser(async ({ emailaddress, id}, done) => {
  try {
    let user;

    if (emailaddress.endsWith("@aphella.com")) user = await getStaff(id);
    else user = await getPatient(id);

    if (user) return done(null, user);
    else return done(null, false);
  } catch (error) {
    done(error);
  }
});

app.get("/login", async (req, res) => {
  if (req.user) {
    res.redirect('/dashboard');
  } else {
    serveFile(res, 'everyone/login');
  }
});

app.post('/force-login', async (req, res, next) => {
  const { email } = req.body;
  try {
    let { user } = await loginUser(email);

    if (user) {
      user.id = user.patientid ?? user.staffid;
      
      req.login(user, function(err) {
        if (err) next(err);
        else res.status(200).json({});
      });
    }
    else res.status(400).json({ error: 'User not found' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/verify-user', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) { return res.status(401).json({ message: 'User not found' }); }

    req.session.user = user; // Save the user in the session but don't log them in yet
    res.status(200).json({ firstname: req.session.user.firstname });
  })(req, res, next);
});

app.post("/verify-phone", async (req, res) => {
  let { phone } = req.body;

  let isVerified = phone == req.session.user.phonenumber.trim();
  if (isVerified) req.session.generatedCode = Math.floor(100000 + Math.random() * 900000) + '';

  res.status(isVerified ? 200 : 401).json({ isVerified, code: req.session.generatedCode.trim() });
});

app.post("/verify-code", async (req, res) => {
  let { code } = req.body;

  let isVerified = code == req.session.generatedCode.trim();

  if (isVerified) {
    req.login(req.session.user, (err) => {
      if (err) next(err);
      else res.status(204).json({ isVerified });
    });
  } else res.status(401).json({ isVerified });
});

/* Page Route Handlers */

app.get("/", (req, res) => {
  serveFile(res, 'everyone/homepage');
});

app.get("/dashboard", async (req, res) => {
  if (req.user) {
    serveFile(res, req.user.type + '/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get("/appointments", async (req, res) => {
  if (req.user) {
    serveFile(res, req.user.type + '/appointments');
  } else {
    res.redirect('/login');
  }
});

app.get("/patients", async (req, res) => {
  if (req.user) {
    if (req.user.type != 'patient') {
      serveFile(res, req.user.type + '/patients');
    } else {
      // If the user came from another page on our site, send them back
      if (req.headers.referer && req.headers.referer.includes(req.headers.host)) {
        res.redirect(req.headers.referer);
      } else {
        res.redirect('/dashboard');
      }
    }
  } else {
    res.redirect('/login');
  }
});

app.get("/staff", async (req, res) => {
  if (req.user) {
    if (req.user.type == 'admin') {
      serveFile(res, req.user.type + '/staff');
    } else {
      // If the user came from another page on our site, send them back
      if (req.headers.referer && req.headers.referer.includes(req.headers.host)) {
        res.redirect(req.headers.referer);
      } else {
        res.redirect('/dashboard');
      }
    }
  } else {
    res.redirect('/login');
  }
});

app.get("/logout", async (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

app.get("*", (req, res) => {
  serveFile(res, '/everyone/404');
});