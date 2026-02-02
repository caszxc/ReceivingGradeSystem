const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "enrollment_db", // database name
  "root",          // username in Laragon
  "",              // password (default empty in Laragon)
  {
    host: "localhost",
    dialect: "mysql",
    logging: false
  }
);

module.exports = sequelize;
