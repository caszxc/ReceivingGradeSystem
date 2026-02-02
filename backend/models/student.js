const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Student = sequelize.define("Student", {
  rfid_uid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  student_no: {
    type: DataTypes.STRING,
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  course: {
    type: DataTypes.STRING
  },
  year_level: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: "students"
});

module.exports = Student;
