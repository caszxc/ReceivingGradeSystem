const sequelize = require("../config/database");
const Student = require("./student");
const Account = require("./account");
const StudentImage = require("./studentProfile");
const Course = require("./course");
const AcademicYear = require("./academicYear");
const StudentEnrollment = require("./studentEnrollment");
const ActiveSemester = require("./activeSemester");

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

// Student ←→ StudentEnrollment
Student.hasMany(StudentEnrollment, {
  foreignKey: "student_id",
});
StudentEnrollment.belongsTo(Student, {
  foreignKey: "student_id",
});

// StudentEnrollment ←→ AcademicYear
StudentEnrollment.belongsTo(AcademicYear, {
  foreignKey: "academic_year_id",
});
AcademicYear.hasMany(StudentEnrollment, {
  foreignKey: "academic_year_id",
});

StudentEnrollment.belongsTo(Course, {
  foreignKey: "course_id",
});
Course.hasMany(StudentEnrollment, {
  foreignKey: "course_id",
});

const db = {
  sequelize,
  Sequelize: require("sequelize"),
  Student,
  Account,
  StudentImage,
  Course,
  AcademicYear,
  StudentEnrollment,
  ActiveSemester,
};

module.exports = db;
