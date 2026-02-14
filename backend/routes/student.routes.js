const express = require("express");
const router = express.Router();
const { Student } = require("../models/association");
const { Op } = require("sequelize");
const multer = require("multer");
const xlsx = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

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

// Upload and validate student data
router.post("/uploadStudents", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload endpoint hit:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

    let data = [];

    // Parse file based on extension
    if (fileExtension === "xlsx" || fileExtension === "xls") {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet);
    } else if (fileExtension === "csv") {
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => results.push(row))
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error:
          "Invalid file format. Only Excel (.xlsx, .xls) and CSV files are supported.",
      });
    }

    console.log("Parsed data:", data);

    const validatedData = [];
    const errors = [];

    // Validate data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      const rowErrors = [];

      // Check required fields
      const requiredFields = [
        "card_id_control_number",
        "card_serial_number",
        "card_type",
        "student_number",
        "first_name",
        "last_name",
      ];

      for (const field of requiredFields) {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`Missing required field: ${field}`);
        }
      }

      // Validate data types and formats
      if (
        row.card_id_control_number &&
        isNaN(parseInt(row.card_id_control_number))
      ) {
        rowErrors.push("card_id_control_number must be a number");
      }

      if (row.card_serial_number && isNaN(parseInt(row.card_serial_number))) {
        rowErrors.push("card_serial_number must be a number");
      }

      if (
        row.year_level &&
        (isNaN(parseInt(row.year_level)) ||
          parseInt(row.year_level) < 1 ||
          parseInt(row.year_level) > 4)
      ) {
        rowErrors.push("year_level must be a number between 1 and 4");
      }

      // Validate date formats
      if (row.date_enrolled && !isValidDate(row.date_enrolled)) {
        rowErrors.push(
          "date_enrolled must be a valid date (YYYY-MM-DD format)",
        );
      }

      if (row.date_issued && !isValidDate(row.date_issued)) {
        rowErrors.push(
          "date_issued must be a valid date (YYYY-MM-DD HH:MM:SS format)",
        );
      }

      // Check for duplicate student numbers in the file
      const duplicateInFile = validatedData.find(
        (existingRow) => existingRow.student_number === row.student_number,
      );
      if (duplicateInFile) {
        rowErrors.push(
          `Duplicate student_number in file: ${row.student_number}`,
        );
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
          data: row,
        });
      } else {
        // Clean and format the data
        const cleanedRow = {
          card_id_control_number: parseInt(row.card_id_control_number),
          date_enrolled: row.date_enrolled || null,
          card_serial_number: parseInt(row.card_serial_number),
          card_type: row.card_type.toString().trim(),
          student_number: row.student_number.toString().trim(),
          first_name: row.first_name.toString().trim(),
          middle_name: row.middle_name
            ? row.middle_name.toString().trim()
            : null,
          last_name: row.last_name.toString().trim(),
          course: row.course ? row.course.toString().trim() : null,
          year_level: row.year_level ? parseInt(row.year_level) : null,
          card_status: row.card_status
            ? row.card_status.toString().trim()
            : "Active",
          date_issued: row.date_issued || null,
        };
        validatedData.push(cleanedRow);
      }
    }

    // Check for existing records in database
    const existingRecords = [];
    if (validatedData.length > 0) {
      const studentNumbers = validatedData.map((row) => row.student_number);
      const controlNumbers = validatedData.map(
        (row) => row.card_id_control_number,
      );

      const existing = await Student.findAll({
        where: {
          [Op.or]: [
            { student_number: { [Op.in]: studentNumbers } },
            { card_id_control_number: { [Op.in]: controlNumbers } },
          ],
        },
      });

      existing.forEach((student) => {
        existingRecords.push({
          student_number: student.student_number,
          card_id_control_number: student.card_id_control_number,
        });
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: errors.length === 0 && existingRecords.length === 0,
      validData: validatedData,
      errors: errors,
      existingRecords: existingRecords,
      totalRows: data.length,
      validRows: validatedData.length,
      errorRows: errors.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    res.status(500).json({ error: err.message });
  }
});

// Confirm and save validated student data
router.post("/confirmUpload", async (req, res) => {
  try {
    const { validatedData } = req.body;

    if (
      !validatedData ||
      !Array.isArray(validatedData) ||
      validatedData.length === 0
    ) {
      return res.status(400).json({ error: "No valid data to upload" });
    }

    const createdStudents = await Student.bulkCreate(validatedData, {
      validate: true,
      ignoreDuplicates: false,
    });

    res.json({
      success: true,
      message: `Successfully uploaded ${createdStudents.length} students`,
      uploadedCount: createdStudents.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to validate date
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = router;
