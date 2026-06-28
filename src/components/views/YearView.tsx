import { useEffect, useMemo, useState } from 'react'
import { format, startOfYear, endOfYear, getMonth, parseISO } from 'date-fns'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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
    return Array.from({ length: currentYear - earliestYear + 1 }, (_, index) => earliestYear + index)
  }, [currentYear])

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
                {year === currentYear ? `${year} (current)` : year}
              </option>
            ))}
          </select>
        </div>
      </div>

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
