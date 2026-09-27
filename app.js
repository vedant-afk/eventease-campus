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

// createApp() builds a fresh app with its own copy of the event data.
// server.js calls it once; the tests call it for every test so that
// one test's registrations never affect another test.
function createApp() {
  const app = express();
  const events = createSeedEvents();

  // Read form submissions (name=...&email=...) and JSON bodies.
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Home page: list every event with its live registration count.
  app.get('/', (req, res) => {
    res.send(views.homePage({ events, commit: getCommitId() }));
  });

  return app;
}

module.exports = { createApp, getCommitId };
