// Minimal static server for Heroku
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`AngelicVoices static server listening on ${port}`);
});


