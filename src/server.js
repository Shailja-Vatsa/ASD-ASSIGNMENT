const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
