import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Session } from '@supabase/supabase-js'

const yearWindow = 21
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function YearView({ session, refreshKey, selectedDate, onNavigateToDate, onNavigateUp }: { session: Session, refreshKey: number, selectedDate: Date, onNavigateToDate: (view: 'today' | 'weekly' | 'monthly' | 'yearly', date: Date) => void, onNavigateUp: () => void }) {
  const currentYear = new Date().getFullYear()
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear() || currentYear)

  useEffect(() => {
    setDisplayYear(selectedDate.getFullYear() || currentYear)
  }, [selectedDate, currentYear])

  const yearOptions = useMemo(() => {
    return Array.from({ length: yearWindow }, (_, index) => currentYear - Math.floor(yearWindow / 2) + index)
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
            Select a year from the dropdown, then scroll the months vertically.
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
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
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

      <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {monthNames.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSelectMonth(index)}
              className="btn-secondary"
              style={{
                padding: '18px 16px',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>{format(new Date(displayYear, index, 1), 'MMMM')}</div>
              </div>
              <span style={{ fontSize: '0.95rem', color: 'var(--primary-color)' }}>{displayYear}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
