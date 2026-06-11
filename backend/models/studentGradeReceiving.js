const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentGradeReceiving = sequelize.define(
  "StudentGradeReceiving",
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
    major: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        this.setDataValue(
          "major",
          value ? value.toString().toUpperCase() : value,
        );
      },
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_received: {
      type: DataTypes.DATEONLY,
    },
    isReceived: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "student_grade_receiving",
    indexes: [
      {
        unique: true, // UNIQUE index: pipigilan ang duplicate rows
        fields: ["student_id", "academic_year_id", "semester"],
        // ibig sabihin: hindi puwedeng magkaroon ng dalawa o higit pang rows
        // na pareho ang student_id + academic_year_id + semester
      },
    ],
  },
);

module.exports = StudentGradeReceiving;
