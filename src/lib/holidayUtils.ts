import holidaysJson from '@/data/holidays.json'
import { Solar, Lunar } from 'lunar-javascript'
import { addDays, differenceInCalendarDays } from 'date-fns'

export interface HolidayData {
  id: string
  name: string
  namePinyin: string
  nameEn: string
  type: 'lunar' | 'solarTerm' | 'solar'
  lunarMonth?: number
  lunarDay?: number
  solarTermName?: string
  solarMonth?: number
  solarDay?: number
  lunarDateStr: string
  lunarDateEng: string
  icon: string
  accentColor: string
  aliases: string[]
  significance: string
  significanceZh: string
  customs: string[]
  customsZh: string[]
  foods: string[]
  foodsZh: string[]
  funFacts: string[]
  funFactsZh: string[]
}

export const ALL_HOLIDAYS: HolidayData[] = holidaysJson.holidays as HolidayData[]

/**
 * Checks if a specific Date matches any traditional Chinese holiday or solar term.
 */
export function getHolidayForDate(date: Date): HolidayData | null {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const lunarMonth = Math.abs(lunar.getMonth())
    const lunarDay = lunar.getDay()
    const solarTerm = lunar.getJieQi() || ''
    const festivals: string[] = [
      ...(lunar.getFestivals() || []),
      ...(lunar.getOtherFestivals?.() || []),
      ...(solar.getFestivals() || []),
    ]

    for (const h of ALL_HOLIDAYS) {
      // 1. Direct festival name match
      if (festivals.includes(h.name) || h.aliases.some(alias => festivals.includes(alias))) {
        return h
      }

      // 2. Solar Term match
      if (h.type === 'solarTerm' && h.solarTermName && solarTerm === h.solarTermName) {
        return h
      }

      // 3. Lunar Month & Day match
      if (h.type === 'lunar' && h.lunarMonth === lunarMonth) {
        // Special case: Chuxi (除夕) can be day 29 or 30
        if (h.id === 'chuxi') {
          if (lunarDay === 30 || festivals.includes('除夕')) {
            return h
          }
          // If lunar month 12 and tomorrow is lunar month 1 day 1
          const nextDayLunar = Solar.fromDate(addDays(date, 1)).getLunar()
          if (nextDayLunar.getMonth() === 1 && nextDayLunar.getDay() === 1) {
            return h
          }
        } else if (h.id === 'xiaonian') {
          // Xiaonian is celebrated on 23rd in the North and 24th in the South
          if (lunarDay === 23 || lunarDay === 24) {
            return h
          }
        } else if (h.lunarDay === lunarDay) {
          return h
        }
      }
    }

    return null
  } catch (err) {
    console.error('Error finding holiday for date:', err)
    return null
  }
}

export interface UpcomingHoliday {
  holiday: HolidayData
  date: Date
  daysUntil: number
}

/**
 * Finds the nearest upcoming traditional holiday starting from the day after `currentDate`.
 */
export function getNextUpcomingHoliday(currentDate: Date, maxDaysAhead = 120): UpcomingHoliday | null {
  try {
    for (let i = 1; i <= maxDaysAhead; i++) {
      const targetDate = addDays(currentDate, i)
      const holiday = getHolidayForDate(targetDate)
      if (holiday) {
        return {
          holiday,
          date: targetDate,
          daysUntil: i,
        }
      }
    }
    return null
  } catch (err) {
    console.error('Error finding upcoming holiday:', err)
    return null
  }
}

/**
 * Chinese Weekday map
 */
export const WEEKDAY_CH: Record<string, string> = {
  'Sunday': '星期日',
  'Monday': '星期一',
  'Tuesday': '星期二',
  'Wednesday': '星期三',
  'Thursday': '星期四',
  'Friday': '星期五',
  'Saturday': '星期六',
}
