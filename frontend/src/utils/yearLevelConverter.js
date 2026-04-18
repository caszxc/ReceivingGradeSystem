/**
 * Convert Roman numeral year levels to numerical for display only
 * Keeps other values like "ALUMNI", "CTP", "11" unchanged
 */
export const convertYearLevelForDisplay = (yearLevel) => {
  if (!yearLevel) return yearLevel;

  const romanToNumber = {
    I: "1",
    II: "2",
    III: "3",
    IV: "4",
    V: "5",
  };

  return romanToNumber[yearLevel] || yearLevel;
};
