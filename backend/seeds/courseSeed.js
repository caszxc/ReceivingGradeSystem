const { Course } = require("../models/association");

const seedCourses = async () => {
  try {
    const coursesToInsert = [
      "BACHELOR OF ARTS IN COMMUNICATION",
      "BACHELOR OF EARLY CHILDHOOD EDUCATION",
      "BACHELOR OF SCIENCE IN ACCOUNTANCY",
      "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
      "BACHELOR OF SCIENCE IN CIVIL ENGINEERING",
      "BACHELOR OF SCIENCE IN ELECTRICAL ENGINEERING",
      "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY",
      "BACHELOR OF SCIENCE IN PSYCHOLOGY",
      "BACHELOR OF SCIENCE IN PUBLIC ADMINISTRATION",
      "BACHELOR OF SCIENCE IN SOCIAL WORK",
      "BACHELOR OF SECONDARY EDUCATION",
      "CERTIFICATE IN TEACHING PROGRAM",
      "MASTER IN PUBLIC ADMINISTRATION",
      "MASTER OF ARTS IN EDUCATION",
    ];

    for (const courseName of coursesToInsert) {
      await Course.findOrCreate({
        where: { name: courseName },
        defaults: { name: courseName, isActive: true },
      });
    }
    console.log("✅ Courses seeded successfully");
  } catch (error) {
    console.error("❌ Seed error:", error);
  }
};

module.exports = seedCourses;