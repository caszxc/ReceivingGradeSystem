const express = require("express");
const router = express.Router();
const { DefaultFilter } = require("../models/association");

router.get("/default-filters", async (req, res) => {
  try {
    const defaultFilters = await DefaultFilter.findOne();
    res.json({
      yearLevel: defaultFilters ? defaultFilters.default_year_level : null,
      semester: defaultFilters ? defaultFilters.default_semester : null,
      course: defaultFilters ? defaultFilters.default_course : null,
      section: defaultFilters ? defaultFilters.default_section : null,
      academicYear: defaultFilters
        ? defaultFilters.default_academic_year
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/save-default-filters", async (req, res) => {
  try {
    const { yearLevel, semester, course, section, academicYear } = req.body;
    let defaultFilters = await DefaultFilter.findOne();

    if (!defaultFilters) {
      await DefaultFilter.create({
        default_year_level: yearLevel || null,
        default_semester: semester || null,
        default_course: course || null,
        default_section: section || null,
        default_academic_year: academicYear || null,
      });
      return res.json({ success: true, message: "Defaults saved." });
    } else if (
      !defaultFilters.default_year_level &&
      !defaultFilters.default_semester &&
      !defaultFilters.default_course &&
      !defaultFilters.default_section &&
      !defaultFilters.default_academic_year
    ) {
      await defaultFilters.update({
        default_year_level: yearLevel || null,
        default_semester: semester || null,
        default_course: course || null,
        default_section: section || null,
        default_academic_year: academicYear || null,
      });
      return res.json({ success: true, message: "Defaults saved." });
    } else {
      return res
        .status(400)
        .json({ error: "Defaults already exist. Use update instead." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update-default-filters", async (req, res) => {
  try {
    const { yearLevel, semester, course, section, academicYear } = req.body;
    const defaultFilters = await DefaultFilter.findOne();

    if (!defaultFilters) {
      return res.status(404).json({ error: "Defaults not found." });
    }

    await defaultFilters.update({
      default_year_level: yearLevel || null,
      default_semester: semester || null,
      default_course: course || null,
      default_section: section || null,
      default_academic_year: academicYear || null,
    });

    res.json({ success: true, message: "Defaults updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
