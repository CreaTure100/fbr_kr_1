const express = require('express');
const app = express();

const SERVER_ID = process.env.SERVER_ID || 'unknown-server';
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({
    server: SERVER_ID,
    message: "Hello from Docker Container!"
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`${SERVER_ID} is running on port ${PORT}`);
});