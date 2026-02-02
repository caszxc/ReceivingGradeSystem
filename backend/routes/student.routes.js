const express = require("express");
const router = express.Router();
const { Student } = require("../models/association");

// Get paginated student list (must come BEFORE the RFID route)
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  try {
    const result = await Student.findAndCountAll({
      limit,
      offset,
      order: [["last_name", "ASC"]]
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student by RFID UID (more specific route comes AFTER general route)
router.get("/rfid/:uid", async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { rfid_uid: req.params.uid }
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new student
router.post("/", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;