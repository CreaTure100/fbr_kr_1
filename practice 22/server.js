const express = require("express");
const app = express();

const PORT = process.argv[2] || process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Response from Express backend server",
    port: PORT
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});