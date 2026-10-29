const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

app.use("/users", require("./routes/users.routes"));
app.use("/posts", require("./routes/posts.routes"));

if (require.main === module) {
	app.listen(3000, () => console.log("Server started on port 3000"));
}

module.exports = app;
