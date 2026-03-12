
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentImage = sequelize.define(
  "StudentImage",
  {
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    image_data: {
      type: DataTypes.BLOB("long"), // LONGBLOB — up to ~4GB
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "student_images",
  },
);

module.exports = StudentImage;