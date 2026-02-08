const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define(
  "Student",
  {
    card_id_control_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    date_enrolled: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    card_serial_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    card_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    student_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    middle_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    card_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_issued: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "students",
  },
);

module.exports = Student;
