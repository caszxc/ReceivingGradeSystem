// Maps short form -> { course, major }
const shortToCourseMap = {
  "BSBA-FM": {
    course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
    major: "FINANCIAL MANAGEMENT",
  },
  "BSBA-HRM": {
    course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
    major: "HUMAN RESOURCE MANAGEMENT",
  },
  "BSBA-MM": {
    course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION",
    major: "MARKETING MANAGEMENT",
  },
  "BSED-MATHEMATICS": {
    course: "BACHELOR OF SECONDARY EDUCATION",
    major: "MATHEMATICS",
  },
  "BSED-ENGLISH": {
    course: "BACHELOR OF SECONDARY EDUCATION",
    major: "ENGLISH",
  },
  "BSED-SCIENCE": {
    course: "BACHELOR OF SECONDARY EDUCATION",
    major: "SCIENCE",
  },
  "BSED-FILIPINO": {
    course: "BACHELOR OF SECONDARY EDUCATION",
    major: "FILIPINO",
  },
  "BSED-SOCIAL STUDIES": {
    course: "BACHELOR OF SECONDARY EDUCATION",
    major: "SOCIAL STUDIES",
  },
};

// Reverse mapping
const courseToShortMap = {};
Object.entries(shortToCourseMap).forEach(([shortForm, { course, major }]) => {
  const key = `${course}||${major}`;
  courseToShortMap[key] = shortForm;
});

// Convert short form -> {course, major}
function expandShortCourse(shortCourseName) {
  return shortToCourseMap[shortCourseName] || null;
}

// Convert {course, major} -> short form
function collapseToShortCourse(courseName, majorName) {
  if (shortToCourseMap[courseName]) return courseName;
  const key = `${courseName}||${majorName}`;
  return courseToShortMap[key] || null;
}

// Convert student data from short form (frontend) to long form (DB)
function convertStudentDataForDB(data) {
  if (data.course_id) {
    return data;
  }

  if (data.course) {
    const expanded = expandShortCourse(data.course);
    if (expanded) {
      return {
        ...data,
        course: expanded.course,
        major: expanded.major,
      };
    }
  }

  return data;
}

// Convert student data from long form (DB) to short form (frontend display)
// Keep full name for non-mapped courses.
function convertStudentDataForFrontend(student) {
  if (student.course && student.major) {
    const shortForm = collapseToShortCourse(student.course, student.major);
    return {
      ...student,
      displayCourse: shortForm || student.course,
    };
  }

  return {
    ...student,
    displayCourse: student.course,
  };
}

module.exports = {
  expandShortCourse,
  collapseToShortCourse,
  convertStudentDataForDB,
  convertStudentDataForFrontend,
  shortToCourseMap,
};