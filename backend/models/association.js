const sequelize = require("../config/database");
const Student = require("./student");
const Account = require("./account");
const StudentImage = require("./studentProfile");
const DefaultFilter = require("./defaultFilter");
const Course = require("./course");

// Import future models here when needed:
// const Attendance = require("./attendance");
// const Course = require("./course");

// Define associations when you have multiple models:
// Student.hasMany(Attendance, { foreignKey: 'student_id' });
// Attendance.belongsTo(Student, { foreignKey: 'student_id' });

Student.hasOne(StudentImage, { foreignKey: "student_id", as: "profileImage" });
StudentImage.belongsTo(Student, { foreignKey: "student_id" });

Student.belongsTo(Course, {
  foreignKey: "course_id",
  as: "courseData",
});

Course.hasMany(Student, {
  foreignKey: "course_id",
});

const db = {
  sequelize,
  Sequelize: require("sequelize"),

  Student,
  Account,
  StudentImage,
  DefaultFilter,
  Course,
};

module.exports = db;
