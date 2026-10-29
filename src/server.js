const app = require("./index");

if (require.main === module) {
  app.listen(3000, () => console.log("Server started on port 3000"));
}

module.exports = app;
