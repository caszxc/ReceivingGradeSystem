const { Course } = require("../models/association");

const seedCourses = async () => {
  try {
    // ── Deactivate old long-form courses ────────────────────────────────────
    const oldCourses = [
      "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
      "BACHELOR OF SECONDARY EDUCATION",
    ];

    for (const courseName of oldCourses) {
      await Course.update(
        { isActive: false },
        { where: { name: courseName } }
      );
    }
    console.log("Old courses deactivated");

    // ── Insert new short-form courses ──────────────────────────────────────
    const coursesToInsert = [
      "BACHELOR OF ARTS IN COMMUNICATION",
      "BACHELOR OF EARLY CHILDHOOD EDUCATION",
      "BACHELOR OF SCIENCE IN ACCOUNTANCY",
      "BSBA-FM",
      "BSBA-HRDM",
      "BSBA-MM",
      "BACHELOR OF SCIENCE IN CIVIL ENGINEERING",
      "BACHELOR OF SCIENCE IN ELECTRICAL ENGINEERING",
      "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY",
      "BACHELOR OF SCIENCE IN PSYCHOLOGY",
      "BACHELOR OF SCIENCE IN PUBLIC ADMINISTRATION",
      "BACHELOR OF SCIENCE IN SOCIAL WORK",
      "BSED-MATHEMATICS",
      "BSED-ENGLISH",
      "BSED-SCIENCE",
      "BSED-FILIPINO",
      "BSED-SOCIAL STUDIES",
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
    console.log("Courses seeded successfully");
  } catch (error) {
    console.error("Seed error:", error);
  }
};

 

module.exports = seedCourses;