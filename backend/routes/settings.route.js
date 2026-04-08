const express = require("express");
const router = express.Router();
const { AcademicYear } = require("../models/association");

// Get all academic years
router.get("/getAcademicYears", async (req, res) => {
  try {
    const years = await AcademicYear.findAll({
      order: [["academic_year", "DESC"]],
    });
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new academic year
router.post("/createAcademicYear", async (req, res) => {
  try {
    const { academic_year } = req.body;

    // Validate format (e.g., "2024-2025")
    if (!academic_year || !/^\d{4}-\d{4}$/.test(academic_year)) {
      return res.status(400).json({
        error: "Invalid format. Use format: YYYY-YYYY (e.g., 2024-2025)",
      });
    }

    // Check if already exists
    const existing = await AcademicYear.findOne({
      where: { academic_year },
    });

    if (existing) {
      return res.status(400).json({
        error: "Academic year already exists",
      });
    }

    // Create new year with isActive = false by default
    const newYear = await AcademicYear.create({
      academic_year,
      isActive: false,
    });

    res.json({
      success: true,
      message: "Academic year created successfully",
      year: newYear,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set academic year as active
router.patch("/setActiveAcademicYear/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Deactivate all other years
    await AcademicYear.update({ isActive: false }, { where: {} });

    // Activate the selected year
    const year = await AcademicYear.findByPk(id);
    if (!year) {
      return res.status(404).json({ error: "Academic year not found" });
    }

    await year.update({ isActive: true });

    res.json({
      success: true,
      message: `Academic year ${year.academic_year} is now active`,
      year,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete academic year (optional, only if no enrollments)
router.delete("/deleteAcademicYear/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const year = await AcademicYear.findByPk(id);

    if (!year) {
      return res.status(404).json({ error: "Academic year not found" });
    }

    // Check if it has enrollments
    const { StudentEnrollment } = require("../models/association");
    const enrollmentCount = await StudentEnrollment.count({
      where: { academic_year_id: id },
    });

    if (enrollmentCount > 0) {
      return res.status(400).json({
        error: `Cannot delete. This academic year has ${enrollmentCount} enrollments.`,
      });
    }

    await year.destroy();

    res.json({
      success: true,
      message: "Academic year deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
