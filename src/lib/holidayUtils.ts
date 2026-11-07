import holidaysJson from '@/data/holidays.json'
import usHolidaysJson from '@/data/usHolidays.json'
import { Solar, Lunar } from 'lunar-javascript'
import { addDays, differenceInCalendarDays } from 'date-fns'

export interface HolidayData {
  id: string
  name: string
  namePinyin: string
  nameEn: string
  type: 'lunar' | 'solarTerm' | 'solar' | 'usFederal' | 'usObservance'
  country?: 'CN' | 'US'
  isHoliday?: boolean
  lunarMonth?: number
  lunarDay?: number
  solarTermName?: string
  solarMonth?: number
  solarDay?: number
  rule?: '3rd-monday' | 'last-monday' | '2nd-sunday' | '3rd-sunday' | '1st-monday' | '2nd-monday' | '4th-thursday' | 'easter'
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

export const ALL_HOLIDAYS: HolidayData[] = [
  ...(holidaysJson.holidays as HolidayData[]),
  ...(usHolidaysJson.holidays as HolidayData[]),
]

/**
 * Computes Easter Sunday for a given year using the Anonymous Gregorian algorithm.
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/**
 * Computes the N-th occurrence of a weekday in a month.
 * month: 1-12
 * weekday: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * n: 1, 2, 3, 4, or -1 (for last occurrence)
 */
export function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  if (n === -1) {
    const lastDay = new Date(year, month, 0)
    const lastWeekday = lastDay.getDay()
    const diff = (lastWeekday - weekday + 7) % 7
    return lastDay.getDate() - diff
  }
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = firstDay.getDay()
  const diff = (weekday - firstWeekday + 7) % 7
  return 1 + diff + (n - 1) * 7
}

/**
 * Checks whether a given Date matches a US Holiday (fixed or floating rule).
 */
export function matchesUsHoliday(h: HolidayData, date: Date): boolean {
  if (h.country !== 'US') return false
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  const day = date.getDate()

  // Fixed solar date
  if (h.solarMonth && h.solarDay && !h.rule) {
    return h.solarMonth === month && h.solarDay === day
  }

  // Floating rule
  if (h.rule) {
    if (h.rule === 'easter') {
      const easter = getEasterSunday(year)
      return (
        easter.getFullYear() === year &&
        easter.getMonth() + 1 === month &&
        easter.getDate() === day
      )
    }

    if (h.solarMonth === month) {
      if (h.rule === '3rd-monday') {
        return day === getNthWeekdayOfMonth(year, month, 1, 3)
      }
      if (h.rule === 'last-monday') {
        return day === getNthWeekdayOfMonth(year, month, 1, -1)
      }
      if (h.rule === '1st-monday') {
        return day === getNthWeekdayOfMonth(year, month, 1, 1)
      }
      if (h.rule === '2nd-monday') {
        return day === getNthWeekdayOfMonth(year, month, 1, 2)
      }
      if (h.rule === '4th-thursday') {
        return day === getNthWeekdayOfMonth(year, month, 4, 4)
      }
      if (h.rule === '2nd-sunday') {
        return day === getNthWeekdayOfMonth(year, month, 0, 2)
      }
      if (h.rule === '3rd-sunday') {
        return day === getNthWeekdayOfMonth(year, month, 0, 3)
      }
    }
  }

  return false
}

/**
 * Checks if a specific Date matches any US holiday, traditional Chinese holiday, or solar term.
 */
export function getHolidayForDate(date: Date): HolidayData | null {
  try {
    // 1. Check US holidays
    for (const h of ALL_HOLIDAYS) {
      if (h.country === 'US' && matchesUsHoliday(h, date)) {
        return h
      }
    }

    // 2. Check traditional Chinese festivals and solar terms
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
      if (h.country === 'US') continue

      // Direct festival name match
      if (festivals.includes(h.name) || h.aliases.some(alias => festivals.includes(alias))) {
        return h
      }

      // Solar Term match
      if (h.type === 'solarTerm' && h.solarTermName) {
        if (solarTerm === h.solarTermName) {
          return h
        }
        try {
          const jieQiTable = lunar.getJieQiTable()
          const jq = jieQiTable[h.solarTermName]
          if (jq && jq.getYear() === solar.getYear() && jq.getMonth() === solar.getMonth()) {
            if (jq.getDay() === solar.getDay()) {
              return h
            }
            const jqUtcMillis = Date.UTC(jq.getYear(), jq.getMonth() - 1, jq.getDay(), jq.getHour() - 8, jq.getMinute())
            const localTermDate = new Date(jqUtcMillis)
            if (
              localTermDate.getFullYear() === date.getFullYear() &&
              localTermDate.getMonth() === date.getMonth() &&
              localTermDate.getDate() === date.getDate()
            ) {
              return h
            }
          }
        } catch {
          // ignore error
        }
      }

      // Lunar Month & Day match
      if (h.type === 'lunar' && h.lunarMonth === lunarMonth) {
        if (h.id === 'chuxi') {
          if (lunarDay === 30 || festivals.includes('除夕')) {
            return h
          }
          const nextDayLunar = Solar.fromDate(addDays(date, 1)).getLunar()
          if (nextDayLunar.getMonth() === 1 && nextDayLunar.getDay() === 1) {
            return h
          }
        } else if (h.id === 'xiaonian') {
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

/**
 * Returns all holidays (Chinese and/or US) matching a specific Date.
 */
export function getAllHolidaysForDate(date: Date): HolidayData[] {
  const matches: HolidayData[] = []
  try {
    for (const h of ALL_HOLIDAYS) {
      if (h.country === 'US') {
        if (matchesUsHoliday(h, date)) {
          matches.push(h)
        }
      }
    }

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
      if (h.country === 'US') continue

      if (festivals.includes(h.name) || h.aliases.some(alias => festivals.includes(alias))) {
        if (!matches.some(m => m.id === h.id)) matches.push(h)
        continue
      }

      if (h.type === 'solarTerm' && h.solarTermName && solarTerm === h.solarTermName) {
        if (!matches.some(m => m.id === h.id)) matches.push(h)
        continue
      }

      if (h.type === 'lunar' && h.lunarMonth === lunarMonth) {
        if (h.id === 'chuxi') {
          if (lunarDay === 30 || festivals.includes('除夕')) {
            if (!matches.some(m => m.id === h.id)) matches.push(h)
            continue
          }
        } else if (h.id === 'xiaonian') {
          if (lunarDay === 23 || lunarDay === 24) {
            if (!matches.some(m => m.id === h.id)) matches.push(h)
            continue
          }
        } else if (h.lunarDay === lunarDay) {
          if (!matches.some(m => m.id === h.id)) matches.push(h)
          continue
        }
      }
    }
  } catch (err) {
    console.error('Error finding all holidays for date:', err)
  }
  return matches
}

export interface UpcomingHoliday {
  holiday: HolidayData
  date: Date
  daysUntil: number
}

/**
 * Finds the nearest upcoming holiday (Chinese or US) starting from the day after `currentDate`.
 */
export function getNextUpcomingHoliday(currentDate: Date, maxDaysAhead = 120): UpcomingHoliday | null {
  try {
    const currentHoliday = getHolidayForDate(currentDate)
    for (let i = 1; i <= maxDaysAhead; i++) {
      const targetDate = addDays(currentDate, i)
      const holiday = getHolidayForDate(targetDate)
      if (holiday && (!currentHoliday || holiday.id !== currentHoliday.id)) {
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
