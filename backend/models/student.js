const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define(
  "Student",
  {
    card_id_control_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isEnrolled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    date_enrolled: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    card_serial_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    card_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    student_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Automatically convert to uppercase
        this.setDataValue(
          "first_name",
          value ? value.toString().toUpperCase() : value,
        );
      },
    },
    middle_name: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Automatically convert to uppercase
        this.setDataValue(
          "middle_name",
          value ? value.toString().toUpperCase() : value,
        );
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Automatically convert to uppercase
        this.setDataValue(
          "last_name",
          value ? value.toString().toUpperCase() : value,
        );
      },
    },
    // course: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    //   set(value) {
    //     // Automatically convert to uppercase
    //     this.setDataValue(
    //       "course",
    //       value ? value.toString().toUpperCase() : value,
    //     );
    //   },
    // },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    major: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Automatically convert to uppercase
        this.setDataValue(
          "major",
          value ? value.toString().toUpperCase() : value,
        );
      },
    },
    year_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: true,
      set(value) {
        // Automatically convert to uppercase
        this.setDataValue(
          "semester",
          value ? value.toString().toUpperCase() : value,
        );
      },
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
