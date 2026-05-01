require("dotenv").config();

const { Sequelize } = require("sequelize");

// Load environment variables from .env file
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: console.log,
  },
);

//old connection code for laragon

// const sequelize = new Sequelize(
//   "enrollment_db", // database name
//   "root", // username in Laragon
//   "", // password (default empty in Laragon)
//   {
//     host: "localhost",
//     dialect: "mysql",
//     logging: console.log,
//   },
// );

module.exports = sequelize;
