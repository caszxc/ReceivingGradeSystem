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

// Allowed sort columns whitelist (prevent SQL injection)
const ALLOWED_SORT_COLUMNS = {
  last_name: "last_name",
  student_number: "student_number",
  course: "course",
  year_level: "year_level",
  card_type: "card_type",
  date_enrolled: "date_enrolled",
  card_status: "card_status",
};

function getSortOrder(sortBy, sortOrder) {
  const col = ALLOWED_SORT_COLUMNS[sortBy] || "last_name";
  const dir = sortOrder === "desc" ? "DESC" : "ASC";
  return [[col, dir]];
}

// Get paginated student list
router.get("/getStudent", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { sortBy = "last_name", sortOrder = "asc" } = req.query;

  try {
    const result = await Student.findAndCountAll({
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
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
  const { sortBy = "last_name", sortOrder = "asc" } = req.query;

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
          { card_serial_number: { [Op.like]: `%${query}%` } },
        ],
      },
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export students to Excel or CSV
// scope: "all" (default) | "page" | "selected"
// "page"     – requires page + limit + optional query/sortBy/sortOrder
// "selected" – requires ids[] (array of student PKs)
// "all"      – exports full DB (or filtered by query) with sort
router.get("/exportStudents", async (req, res) => {
  const {
    query,
    format = "xlsx",
    scope = "all",
    sortBy = "last_name",
    sortOrder = "asc",
  } = req.query;

  // ids may come as ids[]=1&ids[]=2 or ids=1,2
  let ids = req.query["ids[]"] || req.query.ids;
  if (ids && !Array.isArray(ids)) {
    ids = ids
      .split(",")
      .map((x) => parseInt(x.trim()))
      .filter(Boolean);
  } else if (Array.isArray(ids)) {
    ids = ids.map((x) => parseInt(x)).filter(Boolean);
  }

  try {
    let whereClause = {};
    const orderClause = getSortOrder(sortBy, sortOrder);

    // Build where clause
    if (scope === "selected" && ids && ids.length > 0) {
      whereClause = { id: { [Op.in]: ids } };
    } else if (query && query.trim() !== "") {
      whereClause = {
        [Op.or]: [
          { student_number: { [Op.like]: `%${query}%` } },
          { first_name: { [Op.like]: `%${query}%` } },
          { middle_name: { [Op.like]: `%${query}%` } },
          { last_name: { [Op.like]: `%${query}%` } },
          { course: { [Op.like]: `%${query}%` } },
          { card_type: { [Op.like]: `%${query}%` } },
          { card_status: { [Op.like]: `%${query}%` } },
        ],
      };
    }

    let findOptions = { where: whereClause, order: orderClause };

    // For "page" scope, apply pagination
    if (scope === "page") {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const students = await Student.findAll(findOptions);

    // Map to plain export-friendly objects
    const exportData = students.map((s) => ({
      "Student Number": s.student_number,
      "First Name": s.first_name,
      "Middle Name": s.middle_name || "",
      "Last Name": s.last_name,
      Course: s.course || "",
      "Year Level": s.year_level || "",
      "Card Type": s.card_type,
      "Card Status": s.card_status || "",
      "Card ID Control #": s.card_id_control_number,
      "Card Serial #": s.card_serial_number,
      "Date Enrolled": s.date_enrolled || "",
      "Date Issued": s.date_issued || "",
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Students");

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const scopeLabel =
      scope === "page" ? "page" : scope === "selected" ? "selected" : "all";
    const filename = `students_export_${scopeLabel}_${timestamp}`;

    if (format === "csv") {
      const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      res.send(csvOutput);
    } else {
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`,
      );
      res.send(buffer);
    }
  } catch (err) {
    console.error("Export error:", err);
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

// Enroll student
router.patch("/enrollStudent/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.isEnrolled = true;
    student.date_enrolled = new Date();
    await student.save();

    res.json({ message: "Student enrolled successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
