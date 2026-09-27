// server.js - turns the server ON.
// Render (and Docker) tell the app which port to use through the PORT
// environment variable; on a laptop we fall back to 3000.
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`EventEase running on port ${PORT}`);
});
