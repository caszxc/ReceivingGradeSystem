const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const { Student, StudentImage, Course } = require("../models/association");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const multer = require("multer");
const xlsx = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Allowed sort columns whitelist (prevent SQL injection)
const ALLOWED_SORT_COLUMNS = {
  last_name: "last_name",
  student_number: "student_number",
  // course: "course",
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

function buildWhereClause(query, filters) {
  let whereClause = {};
  const andConditions = [];

  // Handle search query
  if (query && query.trim() !== "") {
    const searchQuery = query.trim().toUpperCase();
    andConditions.push({
      [Op.or]: [
        sequelize.where(
          sequelize.fn("UPPER", sequelize.col("student_number")),
          { [Op.like]: `%${searchQuery}%` },
        ),
        sequelize.where(sequelize.fn("UPPER", sequelize.col("first_name")), {
          [Op.like]: `%${searchQuery}%`,
        }),
        sequelize.where(sequelize.fn("UPPER", sequelize.col("middle_name")), {
          [Op.like]: `%${searchQuery}%`,
        }),
        sequelize.where(sequelize.fn("UPPER", sequelize.col("last_name")), {
          [Op.like]: `%${searchQuery}%`,
        }),
        // sequelize.where(sequelize.fn("UPPER", sequelize.col("course")), {
        //   [Op.like]: `%${searchQuery}%`,
        // }),
        sequelize.where(sequelize.fn("UPPER", sequelize.col("card_type")), {
          [Op.like]: `%${searchQuery}%`,
        }),
        sequelize.where(sequelize.fn("UPPER", sequelize.col("card_status")), {
          [Op.like]: `%${searchQuery}%`,
        }),
        sequelize.where(
          sequelize.fn("UPPER", sequelize.col("card_serial_number")),
          { [Op.like]: `%${searchQuery}%` },
        ),
      ],
    });
  }

  if (filters.yearLevel) {
    andConditions.push({ year_level: filters.yearLevel });
  }

  if (filters.semester) {
    andConditions.push({ semester: filters.semester });
  }

  if (filters.course) {
    // Filter by course_id (numeric), not course name
    const courseId = parseInt(filters.course);
    if (!isNaN(courseId)) {
      andConditions.push({ course_id: courseId }); // ✅ Match the ID
    }
  }

  if (filters.section) {
    andConditions.push({ section: filters.section });
  }

  if (filters.dateYearFrom || filters.dateYearTo) {
    if (filters.dateYearFrom && filters.dateYearTo) {
      andConditions.push(
        sequelize.where(sequelize.fn("YEAR", sequelize.col("date_enrolled")), {
          [Op.between]: [
            parseInt(filters.dateYearFrom),
            parseInt(filters.dateYearTo),
          ],
        }),
      );
    } else if (filters.dateYearFrom) {
      andConditions.push(
        sequelize.where(sequelize.fn("YEAR", sequelize.col("date_enrolled")), {
          [Op.gte]: parseInt(filters.dateYearFrom),
        }),
      );
    } else {
      andConditions.push(
        sequelize.where(sequelize.fn("YEAR", sequelize.col("date_enrolled")), {
          [Op.lte]: parseInt(filters.dateYearTo),
        }),
      );
    }
  }

  // Combine all conditions with AND logic
  if (andConditions.length > 0) {
    whereClause =
      andConditions.length === 1
        ? andConditions[0]
        : { [Op.and]: andConditions };
  }

  return whereClause;
}

// Get paginated student list
router.get("/getStudent", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { sortBy = "last_name", sortOrder = "asc" } = req.query;

  // Extract filter parameters
  const filters = {
    yearLevel: req.query.yearLevel,
    semester: req.query.semester,
    course: req.query.course,
    section: req.query.section,
    dateYearFrom: req.query.dateYearFrom,
    dateYearTo: req.query.dateYearTo,
  };

  try {
    const whereClause = buildWhereClause("", filters);

    const result = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
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

  // Extract filter parameters
  const filters = {
    yearLevel: req.query.yearLevel,
    semester: req.query.semester,
    course: req.query.course,
    section: req.query.section,
    dateYearFrom: req.query.dateYearFrom,
    dateYearTo: req.query.dateYearTo,
  };

  try {
    const whereClause = buildWhereClause(query, filters);

    const result = await Student.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getFilterOptions", async (req, res) => {
  try {
    const yearLevels = [
      "11",
      "CTP",
      "I",
      "II",
      "III",
      "IV",
      "MAED",
      "MPA",
      "V",
    ];
    const semesters = ["1ST SEMESTER", "2ND SEMESTER"];

    // Get distinct year levels
    // const yearLevels = await Student.findAll({
    //   attributes: [
    //     [sequelize.fn("DISTINCT", sequelize.col("year_level")), "year_level"],
    //   ],
    //   where: {
    //     year_level: { [Op.not]: null },
    //   },
    //   order: [["year_level", "ASC"]],
    //   raw: true,
    // });

    // // Get distinct semesters
    // const semesters = await Student.findAll({
    //   attributes: [
    //     [sequelize.fn("DISTINCT", sequelize.col("semester")), "semester"],
    //   ],
    //   where: {
    //     semester: { [Op.not]: null },
    //   },
    //   order: [["semester", "ASC"]],
    //   raw: true,
    // });

    // Get distinct courses
    const courses = await Course.findAll({
      where: { isActive: true },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });
    // Get distinct sections
    const sections = await Student.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("section")), "section"],
      ],
      where: {
        section: { [Op.not]: null },
      },
      order: [["section", "ASC"]],
      raw: true,
    });

    const dateYears = await Student.findAll({
      attributes: [
        [
          sequelize.fn(
            "DISTINCT",
            sequelize.fn("YEAR", sequelize.col("date_enrolled")),
          ),
          "date_year",
        ],
      ],
      where: {
        date_enrolled: { [Op.not]: null },
      },
      order: [[sequelize.fn("YEAR", sequelize.col("date_enrolled")), "DESC"]],
      raw: true,
    });

    res.json({
      // yearLevels: yearLevels.map((item) => item.year_level).filter(Boolean),
      // semesters: semesters.map((item) => item.semester).filter(Boolean),
      yearLevels: yearLevels,
      semesters: semesters,
      // courses: courses.map((item) => item.course).filter(Boolean),
      courses: courses,
      sections: sections.map((item) => item.section).filter(Boolean),
      dateYears: dateYears.map((item) => item.date_year).filter(Boolean),
    });
  } catch (err) {
    console.error("Filter options error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get distinct sections for a specific course
router.get("/getSectionsByCourse", async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.json({ sections: [] });
    }

    const sections = await Student.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("section")), "section"],
      ],
      where: {
        course_id: parseInt(course),
        section: { [Op.not]: null },
      },
      order: [["section", "ASC"]],
      raw: true,
    });

    res.json({
      sections: sections.map((item) => item.section).filter(Boolean),
    });
  } catch (err) {
    console.error("Sections by course error:", err);
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

  // Extract filter parameters (same as getStudent / searchStudent)
  const filters = {
    yearLevel: req.query.yearLevel,
    semester: req.query.semester,
    course: req.query.course,
    section: req.query.section,
    dateYearFrom: req.query.dateYearFrom,
    dateYearTo: req.query.dateYearTo,
  };

  try {
    let whereClause = {};
    const orderClause = getSortOrder(sortBy, sortOrder);

    // Build where clause
    if (scope === "selected" && ids && ids.length > 0) {
      whereClause = { id: { [Op.in]: ids } };
    } else {
      // Apply search query + all active filters
      whereClause = buildWhereClause(query || "", filters);
    }

    let findOptions = {
      where: whereClause,
      order: orderClause,
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    };

    // For "page" scope, apply pagination
    if (scope === "page") {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const students = await Student.findAll(findOptions);

    // Map to plain export-friendly objects
    const exportData = students.map((s, i) => ({
      "No.": i + 1,
      Name: [s.last_name, s.first_name, s.middle_name]
        .filter(Boolean)
        .join(", "),
      "Student No.": s.student_number || "",
      Course: s.courseData?.name || "",
      "Year Level": s.year_level || "",
      Section: s.section || "",
      Enrolled: s.isEnrolled ? "Enrolled" : "Not Enrolled",
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

    // Define required and optional columns
    const requiredFields = ["student_number"];
    const optionalFields = [
      "first_name",
      "last_name",
      "middle_name",
      // "course",
      "major",
      "section",
      "semester",
      "year_level",
    ];

    // Validate data
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;
      const rowErrors = [];

      // Check required fields
      for (const field of requiredFields) {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`Missing required field: ${field}`);
        }
      }

      // Check for duplicate student numbers in the file
      const duplicateInFile = validatedData.find(
        (existingRow) =>
          existingRow.student_number === row.student_number?.toString().trim(),
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
        // Clean and format the data - only include required and optional columns
        const cleanedRow = {
          student_number: row.student_number.toString().trim(),

          isEnrolled: false, // Default value
        };

        // Add optional fields if they exist
        if (row.first_name && row.first_name.toString().trim() !== "") {
          cleanedRow.first_name = row.first_name.toString().trim();
        }
        if (row.last_name && row.last_name.toString().trim() !== "") {
          cleanedRow.last_name = row.last_name.toString().trim();
        }
        if (row.middle_name && row.middle_name.toString().trim() !== "") {
          cleanedRow.middle_name = row.middle_name.toString().trim();
        }
        if (row.course && row.course.toString().trim() !== "") {
          const courseExists = await Course.findOne({
            where: { name: row.course.toString().trim().toUpperCase() },
          });
          if (!courseExists) {
            rowErrors.push(`Course not found: ${row.course}`);
          } else {
            cleanedRow.course = row.course.toString().trim();
          }
        }
        if (row.major && row.major.toString().trim() !== "") {
          cleanedRow.major = row.major.toString().trim();
        }
        if (row.section && row.section.toString().trim() !== "") {
          cleanedRow.section = row.section.toString().trim();
        }
        if (row.semester && row.semester.toString().trim() !== "") {
          cleanedRow.semester = row.semester.toString().trim();
        }
        if (row.year_level && row.year_level.toString().trim() !== "") {
          cleanedRow.year_level = row.year_level.toString().trim();
        }

        validatedData.push(cleanedRow);
      }
    }

    // Check for existing records in database - only check student_number
    const existingRecords = [];
    if (validatedData.length > 0) {
      const studentNumbers = validatedData.map((row) => row.student_number);

      const existing = await Student.findAll({
        where: {
          student_number: { [Op.in]: studentNumbers },
        },
      });

      existing.forEach((student) => {
        existingRecords.push({
          student_number: student.student_number,
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

    // Auto-assign course_id based on course name
    for (const student of validatedData) {
      if (student.course) {
        const courseRecord = await Course.findOne({
          where: { name: student.course.toUpperCase() },
        });
        if (courseRecord) {
          student.course_id = courseRecord.id;
        }
        delete student.course; // ← Remove course field before saving
      }
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

// Enroll student by ID or by student_number/card_serial_number
router.patch("/enrollStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { studentNumber, cardSerialNumber } = req.body;

    // Check if both are empty
    if (!studentNumber && !cardSerialNumber) {
      return res.status(400).json({
        success: false,
        message: "Either student number or card serial number must be provided",
      });
    }

    let student;

    // If studentNumber provided, use it
    if (studentNumber) {
      student = await Student.findOne({
        where: { student_number: studentNumber.toUpperCase() },
      });
    } else if (cardSerialNumber) {
      // Otherwise use cardSerialNumber
      student = await Student.findOne({
        where: { card_serial_number: cardSerialNumber },
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.isEnrolled) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled",
      });
    }

    student.isEnrolled = true;
    student.date_enrolled = new Date();
    await student.save();

    res.json({
      success: true,
      message: "Student enrolled successfully",
      student,
    });
  } catch (err) {
    console.error("Enroll error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Add Student
router.post("/addStudent", async (req, res) => {
  try {
    const {
      card_serial_number,
      student_number,
      first_name,
      middle_name,
      last_name,
      course_id,
      year_level,
      section,
    } = req.body;

    // Check if serial number already exists
    const existingStudent = await Student.findOne({
      where: { student_number: student_number.toUpperCase() },
    });

    if (existingStudent) {
      return res.status(400).json({ error: "Student number already exists" });
    }

    // Create new student with separate name fields
    const newStudent = await Student.create({
      card_serial_number: card_serial_number || null,
      student_number: student_number.toUpperCase(),
      first_name: first_name || null,
      middle_name: middle_name || null,
      last_name: last_name || null,
      course_id: course_id ? parseInt(course_id) : null, //  Parse only course_id
      year_level: year_level || null, // Keep as STRING
      section: section || null,
    });

    res.json({
      success: true,
      message: "Student added successfully",
      student: newStudent,
    });
  } catch (err) {
    console.error("Add student error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/viewStudent/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      attributes: [
        "id",
        "first_name",
        "middle_name",
        "last_name",
        "student_number",
        "card_serial_number",
        // "course",
        "course_id",
        "section",
        "year_level",
        "semester",
        "isEnrolled",
      ],
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/updateStudent/:id", async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const {
      card_serial_number,
      first_name,
      middle_name,
      last_name,
      student_number,
      course_id,
      section,
      year_level,
      semester,
    } = req.body;

    // Only semester should be parsed to integer (1 or 2)
    // year_level and section are STRINGS - keep as is!
    await student.update({
      card_serial_number: card_serial_number ?? student.card_serial_number,
      first_name: first_name ?? student.first_name,
      middle_name: middle_name ?? student.middle_name,
      last_name: last_name ?? student.last_name,
      student_number: student_number ?? student.student_number,
      // course: course ?? student.course,
      course_id: course_id ?? student.course_id, // ← UPDATE COURSE ID, not name
      section: section ?? student.section, // ← KEEP AS STRING (no parseInt)
      year_level: year_level ?? student.year_level, // ← KEEP AS STRING
      semester: semester || student.semester,
    });

    console.log("Update successful");
    res.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/uploadImage/:id", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const studentId = parseInt(req.params.id);
    const student = await Student.findByPk(studentId);
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Student not found" });
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json({ error: "Only JPEG, PNG, and WebP images are allowed" });
    }

    // Read and compress with sharp
    const compressedBuffer = await sharp(req.file.path)
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    // Upsert — update if exists, create if not
    const [image, created] = await StudentImage.findOrCreate({
      where: { student_id: studentId },
      defaults: {
        image_data: compressedBuffer,
        mime_type: "image/jpeg",
        original_name: req.file.originalname,
        file_size: compressedBuffer.length,
      },
    });

    if (!created) {
      await image.update({
        image_data: compressedBuffer,
        mime_type: "image/jpeg",
        original_name: req.file.originalname,
        file_size: compressedBuffer.length,
      });
    }

    res.json({ success: true, message: "Image uploaded successfully" });
  } catch (err) {
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    console.error("Image upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/getImage/:id", async (req, res) => {
  try {
    const image = await StudentImage.findOne({
      where: { student_id: parseInt(req.params.id) },
    });

    if (!image) {
      return res.status(404).json({ error: "No image found" });
    }

    res.set("Content-Type", image.mime_type);
    res.set("Cache-Control", "public, max-age=3600");
    res.send(image.image_data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.post("/migrateCourseIds", async (req, res) => {
//   try {
//     console.log("Starting course migration...");
//     const { Course } = require("../models/association");

//     const coursesToInsert = [
//       "BACHELOR OF ARTS IN COMMUNICATION",
//       "BACHELOR OF EARLY CHILDHOOD EDUCATION",
//       "BACHELOR OF SCIENCE IN ACCOUNTANCY",
//       "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
//       "BACHELOR OF SCIENCE IN CIVIL ENGINEERING",
//       "BACHELOR OF SCIENCE IN ELECTRICAL ENGINEERING",
//       "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY",
//       "BACHELOR OF SCIENCE IN PSYCHOLOGY",
//       "BACHELOR OF SCIENCE IN PUBLIC ADMINISTRATION",
//       "BACHELOR OF SCIENCE IN SOCIAL WORK",
//       "BACHELOR OF SECONDARY EDUCATION",
//       "CERTIFICATE IN TEACHING PROGRAM",
//       "MASTER IN PUBLIC ADMINISTRATION",
//       "MASTER OF ARTS IN EDUCATION",
//     ];

//     // Insert courses
//     for (const courseName of coursesToInsert) {
//       await Course.findOrCreate({
//         where: { name: courseName },
//         defaults: { name: courseName, isActive: true },
//       });
//     }
//     console.log(`Inserted ${coursesToInsert.length} courses`);

//     // Update all students
//     let updated = 0;
//     const students = await Student.findAll();
//     for (const student of students) {
//       if (student.course) {
//         const courseRecord = await Course.findOne({
//           where: { name: student.course.toUpperCase() },
//         });
//         if (courseRecord) {
//           await student.update({ course_id: courseRecord.id });
//           updated++;
//         }
//       }
//     }

//     console.log(`Updated ${updated} student records`);
//     res.json({
//       success: true,
//       message: "Migration complete!",
//       coursesInserted: coursesToInsert.length,
//       studentsUpdated: updated,
//     });
//   } catch (err) {
//     console.error("Migration error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;
