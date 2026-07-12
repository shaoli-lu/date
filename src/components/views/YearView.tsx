import { useEffect, useMemo, useState } from 'react'
import { format, startOfYear, endOfYear, getMonth, parseISO } from 'date-fns'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getZodiacInfo, getBilingualLunarDate, getSanfuPeriodsForYear, getSanjiuPeriodsForYear } from '@/lib/lunarUtils'
import zodiacData from '@/lib/zodiacData.json'


const earliestYear = 1800
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parseDescForBadges = (desc: string | null | undefined) => {
  if (!desc) return { isRecurring: false, isCd: false }
  const hasMetadata = desc.includes('--- METADATA ---')
  if (!hasMetadata) return { isRecurring: false, isCd: false }
  return {
    isRecurring: desc.includes('"recurring"'),
    isCd: desc.includes('"cdRenewal"'),
  }
}

export default function YearView({ session, refreshKey, selectedDate, onNavigateToDate, onNavigateUp }: { session: Session, refreshKey: number, selectedDate: Date, onNavigateToDate: (view: 'today' | 'weekly' | 'monthly' | 'yearly', date: Date) => void, onNavigateUp: () => void }) {
  const currentYear = new Date().getFullYear()
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear() || currentYear)
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    setDisplayYear(selectedDate.getFullYear() || currentYear)
  }, [selectedDate, currentYear])

  // Fetch all events for the displayed year
  useEffect(() => {
    const fetchYearEvents = async () => {
      const yearStart = startOfYear(new Date(displayYear, 0, 1)).toISOString()
      const yearEnd = endOfYear(new Date(displayYear, 0, 1)).toISOString()
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('start_time', yearStart)
        .lte('start_time', yearEnd)
        .order('start_time', { ascending: true })
      if (data) setEvents(data)
    }
    fetchYearEvents()
  }, [displayYear, refreshKey, session.user.id])

  // Group events by month index (0-11)
  const eventsByMonth = useMemo(() => {
    const map: Record<number, any[]> = {}
    for (let i = 0; i < 12; i++) map[i] = []
    events.forEach(e => {
      const m = getMonth(parseISO(e.start_time))
      map[m].push(e)
    })
    return map
  }, [events])

  const yearOptions = useMemo(() => {
    return Array.from({ length: currentYear + 15 - earliestYear + 1 }, (_, index) => earliestYear + index)
  }, [currentYear])

  const zodiacPrev = useMemo(() => getZodiacInfo(displayYear - 1), [displayYear])
  const zodiacCurrent = useMemo(() => getZodiacInfo(displayYear), [displayYear])
  const zodiacNext = useMemo(() => getZodiacInfo(displayYear + 1), [displayYear])
  const sanfuPeriods = useMemo(() => getSanfuPeriodsForYear(displayYear), [displayYear])
  // Sanjiu is anchored at the Winter Solstice of displayYear (most periods fall in Jan-Mar of displayYear+1)
  const sanjiuPeriods = useMemo(() => getSanjiuPeriodsForYear(displayYear), [displayYear])

  const handleSelectYear = (year: number) => {
    setDisplayYear(year)
    onNavigateToDate('yearly', new Date(year, 0, 1))
  }

  const handleSelectMonth = (monthIndex: number) => {
    onNavigateToDate('monthly', new Date(displayYear, monthIndex, 1))
  }

  return (
    <div className="scrollable-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <button
            type="button"
            onClick={onNavigateUp}
            className="btn-secondary"
            style={{
              marginBottom: '12px',
              padding: '12px 18px',
              borderRadius: '14px',
              border: '1px solid rgba(102, 252, 241, 0.45)',
              backgroundColor: 'rgba(102, 252, 241, 0.08)',
              backgroundImage: 'linear-gradient(135deg, #66fcf1 0%, #f5c242 55%, #ff6f61 100%)',
              color: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
              fontWeight: 900,
              fontSize: '1rem',
              letterSpacing: '0.08em',
              boxShadow: '0 14px 28px rgba(0, 0, 0, 0.22)',
              cursor: 'pointer',
              minWidth: '130px',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ◀ MONTH
          </button>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{displayYear}</h1>
          <p style={{ color: 'var(--text-main)', marginTop: '8px' }}>
            Select a year from the dropdown, then tap a month to open it.
          </p>
        </div>

        <div style={{ minWidth: '220px' }}>
          <label htmlFor="year-select" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>
            Year
          </label>
          <select
            id="year-select"
            value={displayYear}
            onChange={event => handleSelectYear(Number(event.target.value))}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(31, 40, 51, 0.92)',
              border: '1px solid rgba(102, 252, 241, 0.35)',
              color: 'var(--text-heading)',
              fontSize: '1rem',
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year === currentYear ? `${year} (current)` : year > currentYear ? `${year} (future)` : year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chinese Zodiac Panel */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <span>🏮</span> Chinese Zodiac Cycles · 农历生肖与干支
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: '12px' }}>
          {/* Previous Year */}
          {zodiacPrev && (
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              opacity: 0.75
            }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Previous Year ({zodiacPrev.year})</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {zodiacPrev.englishZodiac} · {zodiacPrev.bilingualText}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: 'block', marginTop: '4px' }}>
                📅 {format(zodiacPrev.startDate, 'MMM d, yyyy')} - {format(zodiacPrev.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Current Selected Year */}
          {zodiacCurrent && (
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(102, 252, 241, 0.08)',
              border: '1px solid rgba(102, 252, 241, 0.3)',
              boxShadow: '0 0 15px rgba(102, 252, 241, 0.1)',
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 700 }}>Selected Year ({zodiacCurrent.year})</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '2px' }}>
                {zodiacCurrent.englishZodiac} · {zodiacCurrent.bilingualText}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#fff', display: 'block', marginTop: '4px', fontWeight: 500 }}>
                📅 {format(zodiacCurrent.startDate, 'MMM d, yyyy')} - {format(zodiacCurrent.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Next Year */}
          {zodiacNext && (
            <div style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              opacity: 0.75
            }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Next Year ({zodiacNext.year})</span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {zodiacNext.englishZodiac} · {zodiacNext.bilingualText}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: 'block', marginTop: '4px' }}>
                📅 {format(zodiacNext.startDate, 'MMM d, yyyy')} - {format(zodiacNext.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>

        {/* Selected Zodiac Characteristics Detail Section */}
        {zodiacCurrent && zodiacData[zodiacCurrent.englishZodiac as keyof typeof zodiacData] && (() => {
          const info = zodiacData[zodiacCurrent.englishZodiac as keyof typeof zodiacData];
          return (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(102, 252, 241, 0.03)',
              border: '1px solid rgba(102, 252, 241, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span> {zodiacCurrent.englishZodiac} ({info.chinese} · {info.pinyin}) Traits & Characteristics
                </h4>
                <div style={{
                  fontSize: '0.8rem',
                  background: 'rgba(102, 252, 241, 0.12)',
                  color: 'var(--primary-color)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(102, 252, 241, 0.25)',
                  fontWeight: 600
                }}>
                  Fixed Element: {info.element}
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--text-main)', margin: 0 }}>
                {info.personality}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '4px' }}>
                {/* Strengths */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#66fcf1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    🟢 Key Strengths
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {info.strengths.map((str: string) => (
                      <span key={str} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(102, 252, 241, 0.08)',
                        color: 'var(--primary-color)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(102, 252, 241, 0.15)'
                      }}>{str}</span>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#ff7675', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    🔴 Weaknesses
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {info.weaknesses.map((weak: string) => (
                      <span key={weak} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 118, 117, 0.08)',
                        color: '#ff7675',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 118, 117, 0.15)'
                      }}>{weak}</span>
                    ))}
                  </div>
                </div>

                {/* Compatibility */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#ffeaa7', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    🤝 Best Matches
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {info.compatibility.map((comp: string) => (
                      <span key={comp} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 234, 167, 0.08)',
                        color: '#ffeaa7',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 234, 167, 0.15)'
                      }}>{comp}</span>
                    ))}
                  </div>
                </div>

                {/* Traditional Hours */}
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#a29bfe', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    ⏰ Zodiac Hour (时辰)
                  </span>
                  <span style={{
                    fontSize: '0.8rem',
                    color: '#a29bfe',
                    background: 'rgba(162, 155, 254, 0.08)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(162, 155, 254, 0.15)',
                    display: 'inline-block'
                  }}>
                    {info.hours}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sanfu (三伏天) Panel */}
      {sanfuPeriods.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#f5a623', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <span>🌡️</span> 三伏天 (Sānfú Tiān) · {displayYear}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            The hottest period of summer, calculated from the heavenly stem-branch system.
            Chu Fu starts on the 3rd gēng (庚) day after Summer Solstice;
            Mo Fu starts on the 1st gēng day after Beginning of Autumn.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {sanfuPeriods.map((period) => (
              <div key={period.name} style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 160, 50, 0.07)',
                border: '1px solid rgba(255, 160, 50, 0.3)',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#f5a623', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  {period.name}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                  {period.nameEng}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  📅 {format(period.start, 'MMM d')} – {format(period.end, 'MMM d, yyyy')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,160,50,0.7)', marginTop: '2px' }}>
                  {period.days} days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shujiu / Sanjiu (数九 / 三九) Panel */}
      {sanjiuPeriods.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1rem', color: '#7ec8ff', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <span>❄️</span> 数九 (Shǔjiǔ) · Winter {displayYear}–{displayYear + 1}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            Nine 9-day blocks counted from Winter Solstice of {displayYear}.
            三九 (Sānjiǔ, the 3rd block, days 19–27) is traditionally the coldest period of the year.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '8px' }}>
            {sanjiuPeriods.map((period) => (
              <div key={period.name} style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: period.isSanjiu ? 'rgba(100, 180, 255, 0.12)' : 'rgba(100, 180, 255, 0.04)',
                border: period.isSanjiu ? '1px solid rgba(100, 180, 255, 0.5)' : '1px solid rgba(100, 180, 255, 0.15)',
                boxShadow: period.isSanjiu ? '0 0 16px rgba(100, 180, 255, 0.1)' : 'none',
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: period.isSanjiu ? '#7ec8ff' : 'rgba(126,200,255,0.5)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {period.isSanjiu && <span>❄️</span>}
                  {period.name}
                  {period.isSanjiu && <span style={{ fontSize: '0.6rem', background: 'rgba(100,180,255,0.2)', borderRadius: '4px', padding: '1px 4px' }}>COLDEST</span>}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: period.isSanjiu ? 700 : 500, color: period.isSanjiu ? '#fff' : 'rgba(255,255,255,0.65)', marginBottom: '2px' }}>
                  {period.nameEng}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  📅 {format(period.start, 'MMM d')} – {format(period.end, 'MMM d')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ paddingRight: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {monthNames.map((label, index) => {
            const monthEvents = eventsByMonth[index] ?? []
            const visibleEvents = monthEvents.slice(0, 3)
            const overflow = monthEvents.length - visibleEvents.length

            return (
              <button
                key={label}
                type="button"
                onClick={() => handleSelectMonth(index)}
                className="btn-secondary"
                style={{
                  padding: '16px',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                {/* Left: month label */}
                <div style={{ minWidth: '80px', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                    {format(new Date(displayYear, index, 1), 'MMMM')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '2px' }}>{displayYear}</div>
                </div>

                {/* Middle: event pills */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                  {visibleEvents.map(e => {
                    const { isRecurring, isCd } = parseDescForBadges(e.description)
                    return (
                      <div
                        key={e.id}
                        style={{
                          fontSize: '0.72rem',
                          background: 'var(--primary-color)',
                          color: '#0b0c10',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 600,
                        }}
                      >
                        {isCd && '💰 '}{isRecurring && '🔁 '}
                        {e.is_all_day ? '' : format(parseISO(e.start_time), 'MMM d · h:mma ').toLowerCase()}
                        {e.title}
                      </div>
                    )
                  })}
                  {overflow > 0 && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-main)',
                      paddingLeft: '2px',
                    }}>
                      +{overflow} more
                    </div>
                  )}
                </div>

                {/* Right: event count badge */}
                {monthEvents.length > 0 && (
                  <div style={{
                    flexShrink: 0,
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(102, 252, 241, 0.12)',
                    border: '1px solid rgba(102, 252, 241, 0.3)',
                    color: 'var(--primary-color)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {monthEvents.length}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
