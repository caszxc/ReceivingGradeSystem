const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./models/association");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Student routes
app.use("/students", require("./routes/student.routes"));
app.use("/auth", require("./routes/authentication.route"));
app.use("/accounts", require("./routes/accountManagement.route"));

// Sync DB and start server
db.sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced");
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

module.exports = app;
