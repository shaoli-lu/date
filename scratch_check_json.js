const fs = require('fs');

const usHolidays = JSON.parse(fs.readFileSync('./src/data/usHolidays.json', 'utf8'));
console.log('US Holidays count:', usHolidays.holidays.length);
usHolidays.holidays.forEach(h => {
  console.log(`- ${h.icon} ${h.nameEn} (${h.name}): ${h.lunarDateEng}`);
});

