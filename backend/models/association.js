const sequelize = require("../config/database");
const Student = require("./student");
const Account = require("./account");
const StudentImage = require("./studentProfile");
const DefaultFilter = require("./defaultFilter");

// Import future models here when needed:
// const Attendance = require("./attendance");
// const Course = require("./course");

// Define associations when you have multiple models:
// Student.hasMany(Attendance, { foreignKey: 'student_id' });
// Attendance.belongsTo(Student, { foreignKey: 'student_id' });

Student.hasOne(StudentImage, { foreignKey: "student_id", as: "profileImage" });
StudentImage.belongsTo(Student, { foreignKey: "student_id" });

const db = {
  sequelize,
  Sequelize: require("sequelize"),

  Student,
  Account,
  StudentImage,
  DefaultFilter,
};

module.exports = db;
