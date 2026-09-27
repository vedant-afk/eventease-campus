// HTML page templates for EventEase.
// Every page is built on the server from the current event data
// (server-side rendering), so the page always shows the latest counts.

// Escape user input so HTML/script tags are shown as plain text.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    return `&#${character.charCodeAt(0)};`;
  });
}

const styles = `
  :root {
    --bg: #f4f6fb;
    --card: #ffffff;
    --text: #1f2937;
    --muted: #6b7280;
    --primary: #4f46e5;
    --primary-dark: #4338ca;
    --success-bg: #ecfdf5;
    --success-text: #065f46;
    --error-bg: #fef2f2;
    --error-text: #991b1b;
    --border: #e5e7eb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  a { color: var(--primary); }
  .site-header {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: #fff;
    padding: 28px 16px;
    text-align: center;
  }
  .brand {
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    text-decoration: none;
  }
  .tagline { display: block; margin-top: 6px; opacity: 0.9; }
  .container { max-width: 1040px; margin: 0 auto; padding: 28px 16px; }
  .events {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
    gap: 20px;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }
  .card h2 { margin: 8px 0 10px; font-size: 1.3rem; }
  .card p { margin: 6px 0; }
  .tag {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--primary-dark);
    background: #eef2ff;
    border-radius: 999px;
    padding: 3px 10px;
  }
  .muted { color: var(--muted); }
  .bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
    margin: 12px 0 6px;
  }
  .bar span { display: block; height: 100%; background: var(--primary); }
  .seats { font-weight: 600; }
  .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .button {
    display: inline-block;
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    background: var(--primary);
    color: #fff;
    font-size: 0.95rem;
    text-decoration: none;
    cursor: pointer;
  }
  .button:hover { background: var(--primary-dark); }
  .button.secondary { background: #eef2ff; color: var(--primary-dark); }
  .button.disabled { background: #9ca3af; cursor: not-allowed; }
  .notice { border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; }
  .notice.success { background: var(--success-bg); color: var(--success-text); }
  .notice.error { background: var(--error-bg); color: var(--error-text); }
  .form-card { max-width: 520px; margin: 0 auto; }
  label { display: block; font-weight: 600; margin: 14px 0 6px; }
  input[type="text"], input[type="email"], input[type="search"] {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); }
  .site-footer {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    max-width: 1040px;
    margin: 0 auto;
    padding: 20px 16px 36px;
    color: var(--muted);
    font-size: 0.9rem;
  }
  code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
`;

function layout({ title, body, commit }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/">🎟️ EventEase</a>
    <span class="tagline">Campus Event Management Portal</span>
  </header>
  <main class="container">
    ${body}
  </main>
  <footer class="site-footer">
    <span>Running commit: <code>${escapeHtml(commit)}</code></span>
  </footer>
</body>
</html>`;
}

function eventCard(event) {
  const registered = event.participants.length;
  const seatsLeft = event.capacity - registered;
  const percent = Math.round((registered / event.capacity) * 100);

  return `
    <article class="card">
      <span class="tag">${escapeHtml(event.category)}</span>
      <h2>${escapeHtml(event.title)}</h2>
      <p class="muted">${escapeHtml(event.description)}</p>
      <p>📅 ${escapeHtml(event.date)}</p>
      <p>📍 ${escapeHtml(event.venue)}</p>
      <div class="bar"><span style="width: ${percent}%"></span></div>
      <p>👥 ${registered} / ${event.capacity} registered ·
        <span class="seats">${seatsLeft} seats left</span></p>
      <div class="actions">
        ${seatsLeft > 0
    ? `<a class="button" href="/register/${event.id}">Register</a>`
    : '<span class="button disabled">Registration Full</span>'}
      </div>
    </article>`;
}

function homePage({ events, commit }) {
  const cards = events.map(eventCard).join('');

  const body = `
    <h1>Upcoming Events</h1>
    <section class="events">${cards}</section>`;

  return layout({ title: 'EventEase - Upcoming Events', body, commit });
}

function registerPage({ event, commit, error = '', values = {} }) {
  const errorBox = error
    ? `<div class="notice error">${escapeHtml(error)}</div>`
    : '';

  const body = `
    <section class="card form-card">
      <span class="tag">${escapeHtml(event.category)}</span>
      <h1>Register for ${escapeHtml(event.title)}</h1>
      <p>📅 ${escapeHtml(event.date)} · 📍 ${escapeHtml(event.venue)}</p>
      <p class="muted">${event.capacity - event.participants.length} seats left</p>
      ${errorBox}
      <form method="POST" action="/events/${event.id}/register">
        <label for="name">Full name</label>
        <input type="text" id="name" name="name" maxlength="60" required
          value="${escapeHtml(values.name || '')}">

        <label for="email">College email</label>
        <input type="email" id="email" name="email" maxlength="100" required
          value="${escapeHtml(values.email || '')}">

        <div class="actions">
          <button class="button" type="submit">Register Now</button>
          <a class="button secondary" href="/">Back to events</a>
        </div>
      </form>
    </section>`;

  return layout({ title: `Register - ${event.title}`, body, commit });
}

function messagePage({ title, message, commit }) {
  const body = `
    <section class="card form-card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <div class="actions">
        <a class="button" href="/">Back to events</a>
      </div>
    </section>`;

  return layout({ title: `EventEase - ${title}`, body, commit });
}

module.exports = { escapeHtml, homePage, registerPage, messagePage };
