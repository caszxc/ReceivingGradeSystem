const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./models/association");
const seedCourses = require("./seeds/courseSeed");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Student routes
app.use("/students", require("./routes/student.routes"));
app.use("/auth", require("./routes/authentication.route"));
app.use("/accounts", require("./routes/accountManagement.route"));
app.use("/settings", require("./routes/settings.route"));

// Sync DB and seed on startup
db.sequelize.sync({ alter: true }).then(async () => {
  console.log("Database synced");
  await seedCourses();
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

// app.listen(PORT, "0.0.0.0", () => {
//   console.log("Backend running");
// });

module.exports = app;
