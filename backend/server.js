const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./models/association");
const seedCourses = require("./seeds/courseSeed");

const app = express();

//-unccomment kapag dev mode
// const PORT = 3001;

//-uncomment kapag deploy locally
const PORT = process.env.PORT || 3005;
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Student routes
app.use("/students", require("./routes/student.routes"));
app.use("/auth", require("./routes/authentication.route"));
app.use("/accounts", require("./routes/accountManagement.route"));
app.use("/settings", require("./routes/settings.route"));

// Sync DB and seed on startup
// db.sequelize.sync({ alter: true }).then(async () => {
//   console.log("Database synced");
//   await seedCourses();
// });
db.sequelize.sync().then(async () => {
  console.log("Database synced");
  await seedCourses();
});

//uncomment kapag dev mode
// app.listen(PORT, () => {
//   console.log(`Backend running at http://localhost:${PORT}`);
// });

//uncomment kapag deploy locally
app.listen(PORT, HOST, () => {
  console.log(`Backend running at http://${HOST}:${PORT}]`);
});

// app.listen(PORT, "0.0.0.0", () => {
//   console.log("Backend running");
// });

module.exports = app;
