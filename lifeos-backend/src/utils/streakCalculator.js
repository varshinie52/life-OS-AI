/**
 * Calculates current streak, best streak, and completion rate from a sorted list of completed dates
 * @param {Array<Date>} logDates - Array of dates when the habit was completed (sorted ascending or descending, but we will sort it anyway)
 * @param {Date} createdAt - When the habit was created
 * @returns {Object} { currentStreak, bestStreak, completionRate }
 */
const calculateHabitStats = (logDates, createdAt) => {
  if (!logDates || logDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, completionRate: 0 };
  }

  // Normalize dates to YYYY-MM-DD string to ignore time
  const toDateString = (date) => new Date(date).toISOString().split('T')[0];
  
  // Get unique dates sorted descending
  const uniqueDates = [...new Set(logDates.map(toDateString))].sort((a, b) => new Date(b) - new Date(a));

  const todayStr = toDateString(new Date());
  const yesterdayStr = toDateString(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let expectedNext = null;

  for (let i = 0; i < uniqueDates.length; i++) {
    const dStr = uniqueDates[i];
    
    // Check if the sequence is continuous
    if (!expectedNext || dStr === expectedNext) {
      tempStreak++;
    } else {
      // Sequence broken
      tempStreak = 1; // start new streak backwards
    }

    // Set expected next (previous day)
    const d = new Date(dStr);
    expectedNext = toDateString(new Date(d.getTime() - 86400000));

    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }

    // Current streak logic: must start today or yesterday
    if (i === 0) {
      if (dStr === todayStr || dStr === yesterdayStr) {
        currentStreak = 1;
      } else {
        // First date is older than yesterday -> current streak is 0
        currentStreak = 0;
      }
    } else if (currentStreak > 0 && dStr === toDateString(new Date(new Date(uniqueDates[i - 1]).getTime() - 86400000))) {
      currentStreak++;
    }
  }

  // Completion rate
  const createdDateStr = toDateString(createdAt);
  const msDiff = new Date(todayStr) - new Date(createdDateStr);
  const daysSinceCreation = Math.max(1, Math.floor(msDiff / 86400000) + 1);
  
  // Can't exceed 100% if they checked in multiple times a day somehow
  const completionRate = Math.min(100, Math.round((uniqueDates.length / daysSinceCreation) * 100));

  return { currentStreak, bestStreak, completionRate };
};

module.exports = { calculateHabitStats };
