const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Account = sequelize.define(
  "Account",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "accounts",
  },
);

module.exports = Account;
