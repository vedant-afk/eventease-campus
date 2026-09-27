// Automated tests for EventEase, using Node's built-in test runner (node:test).
// Run them with:  npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

// Start a fresh copy of EventEase (with fresh data) on a random free port.
// t.after() closes the server when the test ends - even if the test FAILS -
// so a failing test stops the run with an error instead of hanging it.
async function startServer(t) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  t.after(() => new Promise((resolve) => server.close(resolve)));

  return `http://127.0.0.1:${server.address().port}`;
}

test('GET /health returns status ok', async (t) => {
  const base = await startServer(t);

  const response = await fetch(`${base}/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, 'ok');
  assert.equal(data.commit, 'local');
});

test('home page lists every event and shows the running commit', async (t) => {
  const base = await startServer(t);

  const response = await fetch(`${base}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Tech Fest/);
  assert.match(html, /Photography Workshop/);
  assert.match(html, /AI &#38; Robotics Meetup/);
  assert.match(html, /Running commit: <code>local<\/code>/);
});

test('GET /api/events returns JSON with seats left', async (t) => {
  const base = await startServer(t);

  const response = await fetch(`${base}/api/events`);
  const events = await response.json();

  assert.equal(response.status, 200);
  assert.equal(events.length, 3);
  assert.deepEqual(
    Object.keys(events[0]).sort(),
    ['capacity', 'category', 'date', 'id', 'registered', 'seatsLeft', 'title', 'venue']
  );
  assert.equal(events[0].seatsLeft, events[0].capacity);
});

test('unknown event returns 404', async (t) => {
  const base = await startServer(t);

  const page = await fetch(`${base}/register/999`);
  const api = await fetch(`${base}/api/events/999`);

  assert.equal(page.status, 404);
  assert.equal(api.status, 404);
});

// Submit the registration form the same way a browser does.
function register(base, eventId, fields) {
  return fetch(`${base}/events/${eventId}/register`, {
    method: 'POST',
    body: new URLSearchParams(fields),
    redirect: 'manual'
  });
}

async function getEvent(base, eventId) {
  const response = await fetch(`${base}/api/events/${eventId}`);
  return response.json();
}

test('valid registration is saved and increases the count', async (t) => {
  const base = await startServer(t);

  const response = await register(base, 1, {
    name: 'Shreeya Patil',
    email: 'shreeya@example.com'
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/?registered=1');

  const event = await getEvent(base, 1);
  assert.equal(event.registered, 1);
  assert.equal(event.seatsLeft, 99);

  const participants = await (await fetch(`${base}/events/1`)).text();
  assert.match(participants, /Shreeya Patil/);
});

test('invalid name or email is rejected with 400', async (t) => {
  const base = await startServer(t);

  const noName = await register(base, 1, { name: '', email: 'a@example.com' });
  const badEmail = await register(base, 1, { name: 'Test', email: 'wrong-email' });

  assert.equal(noName.status, 400);
  assert.equal(badEmail.status, 400);
  assert.match(await badEmail.text(), /valid email address/);

  const event = await getEvent(base, 1);
  assert.equal(event.registered, 0);
});

test('the same email cannot register twice for one event', async (t) => {
  const base = await startServer(t);

  const first = await register(base, 3, { name: 'Aarav', email: 'aarav@example.com' });
  const again = await register(base, 3, { name: 'Aarav', email: 'AARAV@example.com' });

  assert.equal(first.status, 302);
  assert.equal(again.status, 400);
  assert.match(await again.text(), /already registered/);
  assert.equal((await getEvent(base, 3)).registered, 1);
});

test('a full event accepts no more registrations', async (t) => {
  const base = await startServer(t);
  const { capacity } = await getEvent(base, 2);

  for (let i = 1; i <= capacity; i += 1) {
    const response = await register(base, 2, {
      name: `Student ${i}`,
      email: `student${i}@example.com`
    });
    assert.equal(response.status, 302);
  }

  const extra = await register(base, 2, { name: 'Late', email: 'late@example.com' });
  assert.equal(extra.status, 400);

  const event = await getEvent(base, 2);
  assert.equal(event.registered, capacity);
  assert.equal(event.seatsLeft, 0);

  const home = await (await fetch(`${base}/`)).text();
  assert.match(home, /Registration Full/);
});

test('HTML typed into the form is shown as text, not run', async (t) => {
  const base = await startServer(t);

  await register(base, 1, { name: '<script>alert(1)</script>', email: 'x@example.com' });
  const participants = await (await fetch(`${base}/events/1`)).text();

  assert.doesNotMatch(participants, /<script>alert/);
  assert.match(participants, /&#60;script&#62;/);
});

test('search shows only matching events', async (t) => {
  const base = await startServer(t);

  const html = await (await fetch(`${base}/?q=workshop`)).text();
  assert.match(html, /Photography Workshop/);
  assert.doesNotMatch(html, /<h2>Tech Fest<\/h2>/);

  const api = await (await fetch(`${base}/api/events?q=LAB`)).json();
  assert.deepEqual(api.map((event) => event.id), [2, 3]);

  const none = await (await fetch(`${base}/?q=cricket`)).text();
  assert.match(none, /No events match/);
});
