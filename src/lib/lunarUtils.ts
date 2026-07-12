import { Solar, Lunar } from 'lunar-javascript'

const ZODIAC_ENG: Record<string, string> = {
  '鼠': 'Rat',
  '牛': 'Ox',
  '虎': 'Tiger',
  '兔': 'Rabbit',
  '龙': 'Dragon',
  '蛇': 'Snake',
  '马': 'Horse',
  '羊': 'Goat',
  '猴': 'Monkey',
  '鸡': 'Rooster',
  '狗': 'Dog',
  '猪': 'Pig',
}

const STEM_ENG: Record<string, { pinyin: string, element: string }> = {
  '甲': { pinyin: 'Jiǎ', element: 'Yang Wood' },
  '乙': { pinyin: 'Yǐ', element: 'Yin Wood' },
  '丙': { pinyin: 'Bǐng', element: 'Yang Fire' },
  '丁': { pinyin: 'Dīng', element: 'Yin Fire' },
  '戊': { pinyin: 'Wù', element: 'Yang Earth' },
  '己': { pinyin: 'Jǐ', element: 'Yin Earth' },
  '庚': { pinyin: 'Gēng', element: 'Yang Metal' },
  '辛': { pinyin: 'Xīn', element: 'Yin Metal' },
  '壬': { pinyin: 'Rén', element: 'Yang Water' },
  '癸': { pinyin: 'Guǐ', element: 'Yin Water' },
}

const BRANCH_ENG: Record<string, string> = {
  '子': 'zǐ',
  '丑': 'chǒu',
  '寅': 'yín',
  '卯': 'mǎo',
  '辰': 'chén',
  '巳': 'sì',
  '午': 'wǔ',
  '未': 'wèi',
  '申': 'shēn',
  '酉': 'yǒu',
  '戌': 'xū',
  '亥': 'hài',
}

const LUNAR_MONTHS: Record<string, string> = {
  '正月': '1st Month (Zhengyue)',
  '二月': '2nd Month',
  '三月': '3rd Month',
  '四月': '4th Month',
  '五月': '5th Month',
  '六月': '6th Month',
  '七月': '7th Month',
  '八月': '8th Month',
  '九月': '9th Month',
  '十月': '10th Month',
  '十一月': '11th Month',
  '腊月': '12th Month (Layue)',
}

const LUNAR_DAYS: Record<string, string> = {
  '初一': '1st', '初二': '2nd', '初三': '3rd', '初四': '4th', '初五': '5th',
  '初六': '6th', '初七': '7th', '初八': '8th', '初九': '9th', '初十': '10th',
  '十一': '11th', '十二': '12th', '十三': '13th', '十四': '14th', '十五': '15th',
  '十六': '16th', '十七': '17th', '十八': '18th', '十九': '19th', '二十': '20th',
  '廿一': '21st', '廿二': '22nd', '廿三': '23rd', '廿四': '24th', '廿五': '25th',
  '廿六': '26th', '廿七': '27th', '廿八': '28th', '廿九': '29th', '三十': '30th',
}

const JIE_QI_ENG: Record<string, string> = {
  '立春': 'Spring Begins', '雨水': 'Rain Water', '惊蛰': 'Insects Awaken', '春分': 'Spring Equinox',
  '清明': 'Clear & Bright', '谷雨': 'Grain Rain', '立夏': 'Summer Begins', '小满': 'Grain Buds',
  '芒种': 'Grain in Ear', '夏至': 'Summer Solstice', '小暑': 'Minor Heat', '大暑': 'Major Heat',
  '立秋': 'Autumn Begins', '处暑': 'End of Heat', '白露': 'White Dew', '秋分': 'Autumn Equinox',
  '寒露': 'Cold Dew', '霜降': 'Frost Descent', '立冬': 'Winter Begins', '小雪': 'Minor Snow',
  '大雪': 'Major Snow', '冬至': 'Winter Solstice', '小寒': 'Minor Cold', '大寒': 'Major Cold',
}

const FESTIVALS_ENG: Record<string, string> = {
  '春节': 'Lunar New Year',
  '元宵节': 'Lantern Festival',
  '端午节': 'Dragon Boat Festival',
  '七夕节': 'Qixi Festival (Double Seventh)',
  '中秋节': 'Mid-Autumn Festival',
  '重阳节': 'Double Ninth Festival',
  '腊八节': 'Laba Festival',
  '除夕': 'Lunar New Year\'s Eve',
  '清明节': 'Tomb Sweeping Day',
}

export function translateGanZhi(ganZhi: string, shengXiao: string) {
  const zodiac = ZODIAC_ENG[shengXiao] || shengXiao
  if (!ganZhi || ganZhi.length < 2) return `${shengXiao} (${zodiac})`
  
  const stemChar = ganZhi[0]
  const branchChar = ganZhi[1]
  
  const stem = STEM_ENG[stemChar]
  const branchPinyin = BRANCH_ENG[branchChar] || ''
  
  if (stem) {
    return `${ganZhi} - ${stem.pinyin}-${branchPinyin} (${stem.element} ${zodiac})`
  }
  return `${ganZhi} (${zodiac})`
}

export interface BilingualLunarInfo {
  yearCh: string
  shengXiao: string
  monthCh: string
  dayCh: string
  labelCh: string
  labelEng: string
  fullCh: string
  fullEng: string
  solarTerm: string
  festivals: string[]
}

export interface SanfuInfo {
  /** 初伏 | 中伏 | 末伏 */
  name: string
  /** e.g. "初伏第3天" */
  fullName: string
  /** 1-based day within that Fu period */
  dayIndex: number
}

/** Returns Sanfu info for a given date, or null if the date is not in Sanfu. */
export function getSanfuInfo(date: Date): SanfuInfo | null {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    // getFu() returns null outside Sanfu, or a Fu object with toString/toFullString/getIndex
    const fu: any = (lunar as any).getFu()
    if (!fu) return null
    return {
      name: fu.toString() as string,
      fullName: fu.toFullString() as string,
      dayIndex: (fu.getIndex ? fu.getIndex() : 0) as number,
    }
  } catch {
    return null
  }
}

export interface SanfuPeriod {
  name: string     // 初伏 / 中伏 / 末伏
  nameEng: string  // Chu Fu / Zhong Fu / Mo Fu
  start: Date
  end: Date
  days: number
}

const FU_NAME_ENG: Record<string, string> = {
  '初伏': 'Chu Fu (First Fu)',
  '中伏': 'Zhong Fu (Middle Fu)',
  '末伏': 'Mo Fu (Last Fu)',
}

/**
 * Computes the three Sanfu periods (初伏, 中伏, 末伏) for a given Gregorian year.
 * Returns an array of up to 3 SanfuPeriod objects, or empty array on error.
 */
export function getSanfuPeriodsForYear(year: number): SanfuPeriod[] {
  try {
    const periods: SanfuPeriod[] = []
    // Scan July 1 through September 30 to find transitions
    let currentName: string | null = null
    let periodStart: Date | null = null
    let prevDate: Date | null = null

    const scanStart = new Date(year, 6, 1)   // July 1
    const scanEnd   = new Date(year, 8, 30)  // Sep 30

    for (let d = new Date(scanStart); d <= scanEnd; d = new Date(d.getTime() + 86400000)) {
      const info = getSanfuInfo(d)
      const name = info ? info.name : null

      if (name !== currentName) {
        // Close previous period
        if (currentName && periodStart && prevDate) {
          periods.push({
            name: currentName,
            nameEng: FU_NAME_ENG[currentName] ?? currentName,
            start: new Date(periodStart),
            end: new Date(prevDate),
            days: Math.round((prevDate.getTime() - periodStart.getTime()) / 86400000) + 1,
          })
        }
        // Start new period (or null = outside Sanfu)
        currentName = name
        periodStart = name ? new Date(d) : null
      }
      prevDate = new Date(d)
    }
    // Close the last open period (末伏 ends within scan range)
    if (currentName && periodStart && prevDate) {
      periods.push({
        name: currentName,
        nameEng: FU_NAME_ENG[currentName] ?? currentName,
        start: new Date(periodStart),
        end: new Date(prevDate),
        days: Math.round((prevDate.getTime() - periodStart.getTime()) / 86400000) + 1,
      })
    }
    return periods
  } catch {
    return []
  }
}

// ─── Sanjiu / ShuJiu (数九) ─────────────────────────────────────────────────

export interface SanjiuInfo {
  /** e.g. "三九" */
  name: string
  /** e.g. "三九第1天" */
  fullName: string
  /** true only when name === "三九" */
  isSanjiu: boolean
}

/** Returns ShuJiu info for a given date, or null if outside the 数九 counting period. */
export function getSanjiuInfo(date: Date): SanjiuInfo | null {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    const shuJiu: any = (lunar as any).getShuJiu()
    if (!shuJiu) return null
    const name = shuJiu.toString() as string
    return {
      name,
      fullName: shuJiu.toFullString() as string,
      isSanjiu: name === '三九',
    }
  } catch {
    return null
  }
}

export interface SanjiuPeriod {
  name: string      // 一九 … 九九
  nameEng: string   // First Nine … Ninth Nine
  start: Date
  end: Date
  days: number
  isSanjiu: boolean // true only for 三九
}

const JIU_NAME_ENG: Record<string, string> = {
  '一九': 'First Nine (一九)',
  '二九': 'Second Nine (二九)',
  '三九': 'Third Nine (三九) — Coldest',
  '四九': 'Fourth Nine (四九)',
  '五九': 'Fifth Nine (五九)',
  '六九': 'Sixth Nine (六九)',
  '七九': 'Seventh Nine (七九)',
  '八九': 'Eighth Nine (八九)',
  '九九': 'Ninth Nine (九九)',
}

/**
 * Computes all ShuJiu periods (一九–九九) anchored at the Winter Solstice
 * of `year` (which falls in December of `year`; the bulk of the periods run
 * into January–March of `year + 1`).
 * Returns an array of up to 9 SanjiuPeriod objects, or empty array on error.
 */
export function getSanjiuPeriodsForYear(year: number): SanjiuPeriod[] {
  try {
    const periods: SanjiuPeriod[] = []
    let currentName: string | null = null
    let periodStart: Date | null = null
    let prevDate: Date | null = null

    // Winter Solstice is ~Dec 21; 数九 ends ~81 days later (~Mar 12 next year)
    const scanStart = new Date(year, 11, 1)         // Dec 1  of `year`
    const scanEnd   = new Date(year + 1, 3, 15)     // Apr 15 of `year+1`

    for (let d = new Date(scanStart); d <= scanEnd; d = new Date(d.getTime() + 86400000)) {
      const info = getSanjiuInfo(d)
      const name = info ? info.name : null

      if (name !== currentName) {
        if (currentName && periodStart && prevDate) {
          periods.push({
            name: currentName,
            nameEng: JIU_NAME_ENG[currentName] ?? currentName,
            start: new Date(periodStart),
            end: new Date(prevDate),
            days: Math.round((prevDate.getTime() - periodStart.getTime()) / 86400000) + 1,
            isSanjiu: currentName === '三九',
          })
        }
        currentName = name
        periodStart = name ? new Date(d) : null
      }
      prevDate = new Date(d)
    }
    if (currentName && periodStart && prevDate) {
      periods.push({
        name: currentName,
        nameEng: JIU_NAME_ENG[currentName] ?? currentName,
        start: new Date(periodStart),
        end: new Date(prevDate),
        days: Math.round((prevDate.getTime() - periodStart.getTime()) / 86400000) + 1,
        isSanjiu: currentName === '三九',
      })
    }
    return periods
  } catch {
    return []
  }
}

export function getBilingualLunarDate(date: Date): BilingualLunarInfo | null {
  try {
    const solar = Solar.fromDate(date)
    const lunar = solar.getLunar()
    
    const yearCh = lunar.getYearInGanZhi()
    const shengXiao = lunar.getYearShengXiao()
    const monthCh = lunar.getMonthInChinese()
    const dayCh = lunar.getDayInChinese()
    
    const isLeap = monthCh.startsWith('闰')
    const cleanMonthCh = isLeap ? monthCh.substring(1) + '月' : monthCh + '月'
    
    const monthEng = LUNAR_MONTHS[cleanMonthCh] || cleanMonthCh
    const dayEng = LUNAR_DAYS[dayCh] || dayCh
    
    const formattedMonthEng = isLeap ? `Leap ${monthEng}` : monthEng
    
    const festivals = lunar.getFestivals()
    const solarTerm = lunar.getJieQi()
    
    const firstFestival = festivals && festivals.length > 0 ? festivals[0] : null
    
    // Chinese text for day display
    const labelCh = solarTerm || firstFestival || (dayCh === '初一' ? monthCh + '月' : dayCh)
    
    // English text for day display
    const labelEng = (solarTerm && JIE_QI_ENG[solarTerm]) || 
                     (firstFestival && FESTIVALS_ENG[firstFestival]) || 
                     (dayCh === '初一' ? formattedMonthEng : dayEng)
                     
    return {
      yearCh,
      shengXiao,
      monthCh,
      dayCh,
      labelCh,
      labelEng,
      fullCh: `${yearCh}年${monthCh}月${dayCh}`,
      fullEng: `${formattedMonthEng} Day ${dayEng}, Year of the ${ZODIAC_ENG[shengXiao] || shengXiao}`,
      solarTerm,
      festivals: festivals || [],
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export function getZodiacInfo(y: number) {
  try {
    const startSolar = Lunar.fromYmd(y, 1, 1).getSolar()
    const nextSolar = Lunar.fromYmd(y + 1, 1, 1).getSolar()

    const startDate = new Date(startSolar.getYear(), startSolar.getMonth() - 1, startSolar.getDay())
    const nextDate = new Date(nextSolar.getYear(), nextSolar.getMonth() - 1, nextSolar.getDay())
    const endDate = new Date(nextDate.getTime() - 24 * 60 * 60 * 1000)

    const lunar = Lunar.fromYmd(y, 1, 1)
    const shengXiao = lunar.getYearShengXiao()
    const ganZhi = lunar.getYearInGanZhi()

    return {
      year: y,
      startDate,
      endDate,
      shengXiao,
      ganZhi,
      bilingualText: translateGanZhi(ganZhi, shengXiao),
      englishZodiac: ZODIAC_ENG[shengXiao] || shengXiao,
    }
  } catch (error) {
    console.error(error)
    return null
  }
}
