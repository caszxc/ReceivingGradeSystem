const shortToCourseMap = {
  "BSBA-FM": { course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION", major: "FINANCIAL MANAGEMENT" },
  "BSBA-HRM": { course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION", major: "HUMAN RESOURCE MANAGEMENT" },
  "BSBA-MM": { course: "BACHELOR OF SCIENCE IN BUSINESS ADMINISTRATION", major: "MARKETING MANAGEMENT" },
  "BSED-MATHEMATICS": { course: "BACHELOR OF SECONDARY EDUCATION", major: "MATHEMATICS" },
  "BSED-ENGLISH": { course: "BACHELOR OF SECONDARY EDUCATION", major: "ENGLISH" },
  "BSED-SCIENCE": { course: "BACHELOR OF SECONDARY EDUCATION", major: "SCIENCE" },
  "BSED-FILIPINO": { course: "BACHELOR OF SECONDARY EDUCATION", major: "FILIPINO" },
  "BSED-SOCIAL STUDIES": { course: "BACHELOR OF SECONDARY EDUCATION", major: "SOCIAL STUDIES" }
};

export function expandShortCourse(shortCourseName) {
  return shortToCourseMap[shortCourseName] || null;
}

export function collapseToShortCourse(courseName, majorName) {
  if (shortToCourseMap[courseName]) return courseName;
  const key = Object.entries(shortToCourseMap).find(
    ([_, { course, major }]) => course === courseName && major === majorName
  );
  return key ? key[0] : null;
}