const { getHolidayForDate, getNextUpcomingHoliday, ALL_HOLIDAYS, matchesUsHoliday } = require('./src/lib/holidayUtils.ts')
// We can test pure logic or inspect via a standalone script
console.log('Total holidays:', ALL_HOLIDAYS.length)

