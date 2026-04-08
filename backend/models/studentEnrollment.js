const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentEnrollment = sequelize.define(
  "StudentEnrollment",
  {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    academic_year_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year_level: {
      type: DataTypes.STRING,
    },
    section: {
      type: DataTypes.STRING,
    },
    date_enrolled: {
      type: DataTypes.DATEONLY,
    },
    isEnrolled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "student_enrollment",
  },
);

module.exports = StudentEnrollment;
