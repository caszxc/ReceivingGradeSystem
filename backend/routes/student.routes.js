const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const {
  Student,
  StudentImage,
  Course,
  StudentEnrollment,
  AcademicYear,
} = require("../models/association");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const majorsByCourseName = require("../config/majors");
const multer = require("multer");
const xlsx = require("xlsx");
const csv = require("csv-parser");
const fs = require("fs");
const {
  convertStudentDataForDB,
  convertStudentDataForFrontend,
} = require("../utils/courseConverter");
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

function buildWhereClause(query, filters, isFromEnrollment = false) {
  let whereClause = {};
  const andConditions = [];

  // Handle search query
  if (query && query.trim() !== "") {
    const searchQuery = query.trim().toUpperCase().replace(/\s+/g, " ");
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
        sequelize.where(
          sequelize.fn(
            "UPPER",
            sequelize.fn(
              "CONCAT_WS",
              " ",
              sequelize.col("first_name"),
              sequelize.col("middle_name"),
              sequelize.col("last_name"),
            ),
          ),
          { [Op.like]: `%${searchQuery}%` },
        ),
        sequelize.where(
          sequelize.fn(
            "UPPER",
            sequelize.fn(
              "CONCAT_WS",
              " ",
              sequelize.col("last_name"),
              sequelize.col("first_name"),
              sequelize.col("middle_name"),
            ),
          ),
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
    const courseId = parseInt(filters.course);
    if (!isNaN(courseId)) {
      andConditions.push({ course_id: courseId });
    }
  }

  if (filters.section) {
    andConditions.push({ section: filters.section });
  }

  if (filters.dateYearFrom || filters.dateYearTo) {
    if (filters.dateYearFrom && filters.dateYearTo) {
      andConditions.push({
        date_enrolled: {
          [Op.between]: [
            new Date(`${filters.dateYearFrom}-01-01`),
            new Date(`${filters.dateYearTo}-12-31`),
          ],
        },
      });
    } else if (filters.dateYearFrom) {
      andConditions.push({
        date_enrolled: {
          [Op.gte]: new Date(`${filters.dateYearFrom}-01-01`),
        },
      });
    } else if (filters.dateYearTo) {
      andConditions.push({
        date_enrolled: {
          [Op.lte]: new Date(`${filters.dateYearTo}-12-31`),
        },
      });
    }
  }

  if (andConditions.length > 0) {
    whereClause =
      andConditions.length === 1
        ? andConditions[0]
        : { [Op.and]: andConditions };
  }

  return whereClause;
}

// Helper function to merge StudentEnrollment data with Student data
function mergeEnrollmentData(students, hasAcademicYear) {
  if (!hasAcademicYear) return students;

  const expandedStudents = [];

  students.forEach((student) => {
    const studentData = student.toJSON ? student.toJSON() : student;

    // Create a row for EACH enrollment instead of just the first
    if (
      studentData.StudentEnrollments &&
      studentData.StudentEnrollments.length > 0
    ) {
      studentData.StudentEnrollments.forEach((enrollment) => {
        expandedStudents.push({
          ...studentData,
          semester: enrollment.semester,
          year_level: enrollment.year_level,
          section: enrollment.section,
          date_enrolled: enrollment.date_enrolled,
          course_id: enrollment.course_id,
          course: enrollment.Course?.name,
          StudentEnrollments: undefined,
        });
      });
    } else {
      expandedStudents.push(studentData);
    }
  });

  return expandedStudents;
}

// Get paginated student list
router.get("/getStudent", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { sortBy = "last_name", sortOrder = "asc" } = req.query;

  // Extract filter parameters
  const filters = {
    academicYear: req.query.academicYear,
    yearLevel: req.query.yearLevel,
    semester: req.query.semester,
    course: req.query.course,
    section: req.query.section,
    dateYearFrom: req.query.dateYearFrom,
    dateYearTo: req.query.dateYearTo,
  };

  try {
    // When academic year is selected, don't filter Student table by semester/yearLevel/section/course
    // Those filters should apply to StudentEnrollment instead
    const filtersForStudent = { ...filters };
    if (filters.academicYear) {
      filtersForStudent.yearLevel = null;
      filtersForStudent.semester = null;
      filtersForStudent.course = null;
      filtersForStudent.section = null;
    }

    const whereClause = buildWhereClause(
      "",
      filtersForStudent,
      !!filters.academicYear,
    );

    let findOptions = {
      where: whereClause,
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    };

    // If academic year is selected, join with StudentEnrollment table
    if (filters.academicYear) {
      // Build where clause for StudentEnrollment
      const enrollmentWhere = {};
      enrollmentWhere.academic_year_id = parseInt(filters.academicYear);

      if (filters.yearLevel) {
        enrollmentWhere.year_level = filters.yearLevel;
      }
      if (filters.semester) {
        enrollmentWhere.semester = filters.semester;
      }
      if (filters.course) {
        const courseId = parseInt(filters.course);
        if (!isNaN(courseId)) {
          enrollmentWhere.course_id = courseId;
        }
      }
      if (filters.section) {
        enrollmentWhere.section = filters.section;
      }

      findOptions.include.push({
        model: StudentEnrollment,
        attributes: [
          "id",
          "semester",
          "year_level",
          "section",
          "date_enrolled",
          "major",
          "course_id",
        ],
        where: enrollmentWhere,
        required: true,
        include: [
          {
            model: AcademicYear,
            attributes: ["id", "academic_year"],
          },
          {
            model: Course,
            attributes: ["id", "name"],
          },
        ],
      });
    }

    const result = await Student.findAndCountAll(findOptions);

    // Merge enrollment data with student data when academic year is selected
    const transformedRows = mergeEnrollmentData(
      result.rows,
      !!filters.academicYear,
    );

    const convertedRows = transformedRows.map((s) => {
      const student = s.toJSON ? s.toJSON() : s;
      return convertStudentDataForFrontend(student);
    });
    res.json({ ...result, rows: convertedRows });
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
    academicYear: req.query.academicYear,
    yearLevel: req.query.yearLevel,
    semester: req.query.semester,
    course: req.query.course,
    section: req.query.section,
    dateYearFrom: req.query.dateYearFrom,
    dateYearTo: req.query.dateYearTo,
  };

  try {
    // When academic year is selected, don't filter Student table by semester/yearLevel/section/course
    // Those filters should apply to StudentEnrollment instead
    const filtersForStudent = { ...filters };
    if (filters.academicYear) {
      filtersForStudent.yearLevel = null;
      filtersForStudent.semester = null;
      filtersForStudent.course = null;
      filtersForStudent.section = null;
    }

    const whereClause = buildWhereClause(
      query,
      filtersForStudent,
      !!filters.academicYear,
    );

    let findOptions = {
      where: whereClause,
      limit,
      offset,
      order: getSortOrder(sortBy, sortOrder),
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    };

    // If academic year is selected, join with StudentEnrollment table
    if (filters.academicYear) {
      // Build where clause for StudentEnrollment
      const enrollmentWhere = {};
      enrollmentWhere.academic_year_id = parseInt(filters.academicYear);

      if (filters.yearLevel) {
        enrollmentWhere.year_level = filters.yearLevel;
      }
      if (filters.semester) {
        enrollmentWhere.semester = filters.semester;
      }
      if (filters.course) {
        const courseId = parseInt(filters.course);
        if (!isNaN(courseId)) {
          enrollmentWhere.course_id = courseId;
        }
      }
      if (filters.section) {
        enrollmentWhere.section = filters.section;
      }

      findOptions.include.push({
        model: StudentEnrollment,
        attributes: [
          "id",
          "semester",
          "year_level",
          "section",
          "date_enrolled",
          "major",
          "course_id",
        ],
        where: enrollmentWhere,
        required: true,
        include: [
          {
            model: AcademicYear,
            attributes: ["id", "academic_year"],
          },
        ],
      });
    }

    const result = await Student.findAndCountAll(findOptions);

    // Merge enrollment data with student data when academic year is selected
    const transformedRows = mergeEnrollmentData(
      result.rows,
      !!filters.academicYear,
    );

    const convertedRows = transformedRows.map((s) => {
      const student = s.toJSON ? s.toJSON() : s;
      return convertStudentDataForFrontend(student);
    });
    res.json({ ...result, rows: convertedRows });
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
      "ALUMNI",
    ];
    const semesters = ["1ST SEMESTER", "2ND SEMESTER", "SUMMER"];

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

    // Get all academic years and find the active one
    const academicYears = await AcademicYear.findAll({
      order: [["academic_year", "DESC"]],
      raw: true,
    });

    const activeAcademicYear = await AcademicYear.findOne({
      where: { isActive: true },
      raw: true,
    });

    const coursesWithMajors = courses.map((course) => ({
      id: course.id,
      name: course.name, // Just the short form: "BSED-MATHEMATICS", "BSBA-FM", etc.
    }));

    res.json({
      yearLevels: yearLevels,
      semesters: semesters,
      courses: courses,
      coursesWithMajors: coursesWithMajors,
      sections: sections.map((item) => item.section).filter(Boolean),
      dateYears: dateYears.map((item) => item.date_year).filter(Boolean),
      academicYears: academicYears,
      activeAcademicYear: activeAcademicYear,
    });
  } catch (err) {
    console.error("Filter options error:", err);
    res.status(500).json({ error: err.message });
  }
});

const courseMapping = {
  // Old course name → New course names (short forms)
  "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION": [
    "BSBA-FM",
    "BSBA-HRM",
    "BSBA-MM",
  ],
  "BACHELOR OF SECONDARY EDUCATION": [
    "BSED-MATHEMATICS",
    "BSED-ENGLISH",
    "BSED-SCIENCE",
    "BSED-FILIPINO",
    "BSED-SOCIAL STUDIES",
  ],
};

const sectionPrefixMapping = {
  "BSED-MATHEMATICS": "MATH",
  "BSED-ENGLISH": "ENGLISH",
  "BSED-SCIENCE": "SCIENCE",
  "BSED-FILIPINO": "FILIPINO",
  "BSED-SOCIAL STUDIES": "SOCSTUD",
  "BSBA-FM": "FM",
  "BSBA-MM": "MM",
  "BSBA-HRM": "HRM",
};

// Get distinct sections for a specific course (including legacy courses and prefix filtering)
router.get("/getSectionsByCourse", async (req, res) => {
  try {
    const { course } = req.query;
    if (!course) {
      return res.status(400).json({ error: "Course parameter required" });
    }

    const courseId = parseInt(course);

    // Get the course name to check if it's a new short-form course
    const courseRecord = await Course.findByPk(courseId);
    if (!courseRecord) {
      return res.status(404).json({ error: "Course not found" });
    }

    const courseIdArray = [courseId];

    // If it's a new short-form course, also fetch sections from old courses
    const newCourseNames = Object.keys(courseMapping);
    for (const [oldCourseName, newCourses] of Object.entries(courseMapping)) {
      if (newCourses.includes(courseRecord.name)) {
        // Find the old course and add its ID
        const oldCourse = await Course.findOne({
          where: { name: oldCourseName },
        });
        if (oldCourse) {
          courseIdArray.push(oldCourse.id);
        }
        break;
      }
    }

    // Fetch sections from both old and new course IDs
    let sections = await Student.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("section")), "section"],
      ],
      where: {
        course_id: { [Op.in]: courseIdArray },
        section: { [Op.not]: null },
      },
      order: [["section", "ASC"]],
      raw: true,
    });

    // Filter sections by prefix if the course has one
    const prefix = sectionPrefixMapping[courseRecord.name];
    if (prefix) {
      sections = sections.filter((s) =>
        s.section.toUpperCase().startsWith(prefix.toUpperCase()),
      );
    }

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
    // Already an array
  }

  // Extract filter parameters (same as getStudent / searchStudent)
  const filters = {
    academicYear: req.query.academicYear,
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
      whereClause = buildWhereClause(
        query || "",
        filters,
        !!filters.academicYear,
      );
    }

    let findOptions = {
      where: whereClause,
      order: orderClause,
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
      ],
    };

    // If academic year is selected, join with StudentEnrollment table
    if (filters.academicYear && scope !== "selected") {
      findOptions.include.push({
        model: StudentEnrollment,
        attributes: [
          "id",
          "semester",
          "year_level",
          "section",
          "date_enrolled",
        ],
        where: { academic_year_id: parseInt(filters.academicYear) },
        required: true, // INNER JOIN to only get enrolled students
      });
    }

    // For "page" scope, apply pagination
    if (scope === "page") {
      const limit = parseInt(req.query.limit) || 50;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      findOptions.limit = limit;
      findOptions.offset = offset;
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
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.csv"`,
      );
      res.send(csv);
    } else {
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`,
      );
      xlsx.write(workbook, { type: "stream", stream: res });
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
    const bodyData = convertStudentDataForDB(req.body);

    const { id } = req.params;
    const {
      studentNumber,
      cardSerialNumber,
      semester,
      course,
      course_id,
      section,
      year_level,
      major,
      forceUpdate = false,
    } = bodyData;

    let student;

    // If ID is provided and not 0, use it directly
    if (id !== "0") {
      student = await Student.findByPk(id);
    } else {
      // Otherwise search by studentNumber or cardSerialNumber
      if (studentNumber) {
        student = await Student.findOne({
          where: { student_number: studentNumber.toUpperCase() },
        });
      } else if (cardSerialNumber) {
        student = await Student.findOne({
          where: { card_serial_number: cardSerialNumber },
        });
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get active academic year
    const activeAcademicYear = await AcademicYear.findOne({
      where: { isActive: true },
    });

    if (!activeAcademicYear) {
      return res.status(400).json({
        success: false,
        message:
          "No active academic year found. Please set an active academic year first.",
      });
    }

    // Resolve course_id: if we have a course name (from conversion), look it up
    let resolvedCourseId = course_id;

    if (!resolvedCourseId && course) {
      const courseRecord = await Course.findOne({
        where: { name: course },
      });

      if (courseRecord) {
        resolvedCourseId = courseRecord.id;
      }
    }

    // Map short-form courses to their parent courses
    // if (resolvedCourseId) {
    //   const courseRecord = await Course.findByPk(resolvedCourseId);
    //   if (courseRecord) {
    //     const courseName = courseRecord.name;

    //     // Define mapping from short-form to parent course ID
    //     // const shortFormToParentId = {
    //     //   "BSBA-FM": 4,
    //     //   "BSBA-HRM": 4,
    //     //   "BSBA-MM": 4,
    //     //   "BSED-MATHEMATICS": 11,
    //     //   "BSED-ENGLISH": 11,
    //     //   "BSED-SCIENCE": 11,
    //     //   "BSED-FILIPINO": 11,
    //     //   "BSED-SOCIAL STUDIES": 11,
    //     // };

    //     // If it's a short form, use parent course ID
    //     if (shortFormToParentId[courseName]) {
    //       resolvedCourseId = shortFormToParentId[courseName];
    //     }
    //   }
    // }

    // Check if student is already enrolled in this academic year and semester
    const existingEnrollment = await StudentEnrollment.findOne({
      where: {
        student_id: student.id,
        academic_year_id: activeAcademicYear.id,
        semester: semester,
      },
    });

    // If enrollment already exists and forceUpdate is not true, return conflict status
    if (existingEnrollment && !forceUpdate) {
      return res.status(409).json({
        success: false,
        code: "ALREADY_ENROLLED",
        message: `Student is already enrolled in ${activeAcademicYear.academic_year} - ${semester}`,
        existingEnrollment: {
          id: existingEnrollment.id,
          semester: existingEnrollment.semester,
          year_level: existingEnrollment.year_level,
          section: existingEnrollment.section,
          course_id: existingEnrollment.course_id,
          major: existingEnrollment.major,
          date_enrolled: existingEnrollment.date_enrolled,
          isEnrolled: existingEnrollment.isEnrolled,
        },
      });
    }

    // Create or update StudentEnrollment record
    let enrollment;
    if (existingEnrollment) {
      // Force update existing enrollment
      await existingEnrollment.update({
        year_level: year_level || existingEnrollment.year_level,
        section: section || existingEnrollment.section,
        course_id: resolvedCourseId || existingEnrollment.course_id,
        major: major || existingEnrollment.major,
        date_enrolled: new Date(),
        isEnrolled: true,
      });
      enrollment = existingEnrollment;
    } else {
      // Create new enrollment
      enrollment = await StudentEnrollment.create({
        student_id: student.id,
        academic_year_id: activeAcademicYear.id,
        semester: semester,
        year_level: year_level || null,
        section: section || null,
        course_id: resolvedCourseId || null,
        major: major || null,
        date_enrolled: new Date(),
        isEnrolled: true,
      });
    }

    res.json({
      success: true,
      message: forceUpdate
        ? "Student enrollment updated successfully"
        : "Student enrolled successfully",
      enrollment,
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
    const bodyData = convertStudentDataForDB(req.body);
    const {
      card_serial_number,
      student_number,
      first_name,
      middle_name,
      last_name,
      course_id,
      year_level,
      section,
    } = bodyData;

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
    const { academicYearId } = req.query;

    const student = await Student.findByPk(req.params.id, {
      attributes: [
        "id",
        "first_name",
        "middle_name",
        "last_name",
        "student_number",
        "card_serial_number",
        "card_id_control_number",
        "card_type",
        "card_status",
        "date_issued",
        "course_id",
        "section",
        "year_level",
        "semester",
        "major",
        "isEnrolled",
        "date_enrolled",
      ],
      include: [
        { model: Course, attributes: ["id", "name"], as: "courseData" },
        {
          model: StudentEnrollment,
          attributes: [
            "id",
            "academic_year_id",
            "semester",
            "year_level",
            "section",
            "major",
            "course_id",
            "date_enrolled",
            "isEnrolled",
          ],
          include: [
            {
              model: AcademicYear,
              attributes: ["id", "academic_year"],
            },
            {
              model: Course,
              attributes: ["id", "name"],
            },
          ],
          separate: true,
          order: [["academic_year_id", "DESC"]],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentData = convertStudentDataForFrontend(student.toJSON());

    // If a specific academicYearId is requested, set it as the active enrollment
    if (academicYearId && studentData.StudentEnrollments) {
      const selectedEnrollment = studentData.StudentEnrollments.find(
        (e) => e.academic_year_id === parseInt(academicYearId),
      );
      if (selectedEnrollment) {
        studentData.selectedEnrollment = selectedEnrollment;
      }
    } else if (
      studentData.StudentEnrollments &&
      studentData.StudentEnrollments.length > 0
    ) {
      // Default to the latest enrollment
      studentData.selectedEnrollment = studentData.StudentEnrollments[0];
    }

    res.json(studentData);
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

    const bodyData = convertStudentDataForDB(req.body);
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
    } = bodyData;

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

router.get("/getLatestEnrollment/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByPk(studentId, {
      attributes: ["id", "course_id", "semester", "year_level", "section"],
      include: [
        {
          model: Course,
          attributes: ["id", "name"],
          as: "courseData",
        },
      ],
    });

    const enrollment = await StudentEnrollment.findOne({
      where: { student_id: studentId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Course,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!enrollment && !student) {
      return res.json({
        success: false,
        message: "Student not found",
        enrollment: null,
      });
    }

    // Get the course from enrollment or student
    let courseId = enrollment?.course_id || student?.course_id;
    let courseName = enrollment?.Course?.name || student?.courseData?.name;

    // Map old inactive courses to new active short-form courses
    const courseMapping = {
      "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION": "BSBA-FM",
      "BACHELOR OF SECONDARY EDUCATION": "BSED-MATHEMATICS",
    };

    if (courseName && courseMapping[courseName]) {
      const newCourseName = courseMapping[courseName];
      const newCourse = await Course.findOne({
        where: { name: newCourseName },
      });
      if (newCourse) {
        courseId = newCourse.id;
      }
    }

    res.json({
      success: true,
      enrollment: {
        semester: enrollment?.semester || student?.semester || "",
        year_level: enrollment?.year_level || student?.year_level || "",
        section: enrollment?.section || student?.section || "",
        course_id: courseId || null,
        major: enrollment?.major || null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Create or get section
router.post("/createSection", async (req, res) => {
  try {
    const { section, course_id } = req.body;

    if (!section || !course_id) {
      return res
        .status(400)
        .json({ error: "Section and course_id are required" });
    }

    // Check if section already exists for this course
    const existing = await Student.findOne({
      where: { section, course_id },
      attributes: ["section"],
    });

    if (existing) {
      return res.json({ success: true, section });
    }

    // Section will be automatically created when student is saved with it
    res.json({
      success: true,
      section,
      message: "Section ready to be created",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
