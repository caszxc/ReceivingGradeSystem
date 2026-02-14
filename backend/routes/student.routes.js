const express = require("express");
const router = express.Router();
const { Student } = require("../models/association");
const { Op } = require("sequelize");

// Get paginated student list
router.get("/getStudent", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    const result = await Student.findAndCountAll({
      limit,
      offset,
      order: [["last_name", "ASC"]],
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search students
router.get("/searchStudent", async (req, res) => {
  const { query } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const result = await Student.findAndCountAll({
      where: {
        [Op.or]: [
          { student_number: { [Op.like]: `%${query}%` } },
          { first_name: { [Op.like]: `%${query}%` } },
          { middle_name: { [Op.like]: `%${query}%` } },
          { last_name: { [Op.like]: `%${query}%` } },
          { course: { [Op.like]: `%${query}%` } },
          { card_type: { [Op.like]: `%${query}%` } },
          { card_status: { [Op.like]: `%${query}%` } },
        ],
      },
      limit,
      offset,
      order: [["last_name", "ASC"]],
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student by RFID UID
router.get("/rfid/:uid", async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { rfid_uid: req.params.uid },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new student
router.post("/addStudent", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
