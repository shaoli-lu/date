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
