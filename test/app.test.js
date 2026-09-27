// Automated tests for EventEase, using Node's built-in test runner (node:test).
// Run them with:  npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

// Start a fresh copy of EventEase (with fresh data) on a random free port.
async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  return {
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test('GET /health returns status ok', async () => {
  const { base, close } = await startServer();

  const response = await fetch(`${base}/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, 'ok');
  assert.equal(data.commit, 'local');

  await close();
});

test('home page lists every event and shows the running commit', async () => {
  const { base, close } = await startServer();

  const response = await fetch(`${base}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Tech Fest/);
  assert.match(html, /Photography Workshop/);
  assert.match(html, /AI &#38; Robotics Meetup/);
  assert.match(html, /Running commit: <code>local<\/code>/);

  await close();
});

test('GET /api/events returns JSON with seats left', async () => {
  const { base, close } = await startServer();

  const response = await fetch(`${base}/api/events`);
  const events = await response.json();

  assert.equal(response.status, 200);
  assert.equal(events.length, 3);
  assert.deepEqual(
    Object.keys(events[0]).sort(),
    ['capacity', 'category', 'date', 'id', 'registered', 'seatsLeft', 'title', 'venue']
  );
  assert.equal(events[0].seatsLeft, events[0].capacity);

  await close();
});

test('unknown event returns 404', async () => {
  const { base, close } = await startServer();

  const page = await fetch(`${base}/register/999`);
  const api = await fetch(`${base}/api/events/999`);

  assert.equal(page.status, 404);
  assert.equal(api.status, 404);

  await close();
});
