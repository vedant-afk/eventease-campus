// app.js - the "brain" of EventEase: all routes live here.
const express = require('express');
const { createSeedEvents } = require('./data/events');
const views = require('./views');

// Short commit ID shown in the footer.
// Render sets RENDER_GIT_COMMIT automatically; the Docker build in the
// pipeline passes GIT_SHA; on a laptop neither exists, so we show "local".
function getCommitId() {
  const commit =
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_SHA ||
    'local';

  return commit.slice(0, 7);
}

// Simple email check: something@something.something (no spaces).
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// createApp() builds a fresh app with its own copy of the event data.
// server.js calls it once; the tests call it for every test so that
// one test's registrations never affect another test.
function createApp() {
  const app = express();
  const events = createSeedEvents();

  // Read form submissions (name=...&email=...) and JSON bodies.
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  function findEvent(id) {
    return events.find((event) => event.id === Number(id));
  }

  function sendMessage(res, status, title, message) {
    res.status(status).send(
      views.messagePage({ title, message, commit: getCommitId() })
    );
  }

  // Home page: list every event with its live registration count.
  app.get('/', (req, res) => {
    res.send(views.homePage({ events, commit: getCommitId() }));
  });

  // Registration form for one event, e.g. /register/1
  app.get('/register/:id', (req, res) => {
    const event = findEvent(req.params.id);

    if (!event) {
      return sendMessage(res, 404, 'Event not found', 'There is no event with that ID.');
    }

    if (event.participants.length >= event.capacity) {
      return sendMessage(res, 400, 'Registration is full', `All ${event.capacity} seats for ${event.title} are taken.`);
    }

    res.send(views.registerPage({ event, commit: getCommitId() }));
  });

  // The registration form posts here. This route CHANGES data:
  // it validates the input and then saves the participant.
  app.post('/events/:id/register', (req, res) => {
    const event = findEvent(req.params.id);

    if (!event) {
      return sendMessage(res, 404, 'Event not found', 'There is no event with that ID.');
    }

    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    // Send the form back with an error message and HTTP 400 (Bad Request).
    function rejectWith(error) {
      res.status(400).send(
        views.registerPage({ event, commit: getCommitId(), error, values: { name, email } })
      );
    }

    if (!name || name.length > 60) {
      return rejectWith('Please enter your name (up to 60 characters).');
    }

    if (!isValidEmail(email)) {
      return rejectWith('Please enter a valid email address, e.g. student@college.edu');
    }

    if (event.participants.length >= event.capacity) {
      return sendMessage(res, 400, 'Registration is full', `All ${event.capacity} seats for ${event.title} are taken.`);
    }

    const alreadyRegistered = event.participants.some(
      (participant) => participant.email === email
    );

    if (alreadyRegistered) {
      return rejectWith('This email is already registered for this event.');
    }

    event.participants.push({
      name,
      email,
      registeredAt: new Date().toISOString()
    });

    // Post/Redirect/Get: send the browser back to the home page.
    res.redirect('/');
  });

  return app;
}

module.exports = { createApp, getCommitId };
