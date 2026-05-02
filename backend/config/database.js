const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "enrollment_db", // database name
  "root", // username in Laragon
  "", // password (default empty in Laragon)
  {
    host: "localhost",
    dialect: "mysql",
    logging: console.log,
  },
);

module.exports = sequelize;
