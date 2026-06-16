import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Session } from '@supabase/supabase-js'

const yearWindow = 17
const yearBuffer = Math.floor(yearWindow / 2)
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function YearView({ session, refreshKey, selectedDate, onNavigateToDate, onNavigateUp }: { session: Session, refreshKey: number, selectedDate: Date, onNavigateToDate: (view: 'today' | 'weekly' | 'monthly' | 'yearly', date: Date) => void, onNavigateUp: () => void }) {
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear())

  useEffect(() => {
    setDisplayYear(selectedDate.getFullYear())
  }, [selectedDate])

  const years = useMemo(() => {
    const currentYear = selectedDate.getFullYear()
    return Array.from({ length: yearWindow }, (_, index) => currentYear - yearBuffer + index)
  }, [selectedDate])

  const handleSelectYear = (year: number) => {
    onNavigateToDate('yearly', new Date(year, 0, 1))
  }

  const handleSelectMonth = (monthIndex: number) => {
    onNavigateToDate('monthly', new Date(displayYear, monthIndex, 1))
  }

  return (
    <div className="scrollable-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <button
            type="button"
            onClick={onNavigateUp}
            className="btn-secondary"
            style={{ marginBottom: '12px', padding: '8px 12px' }}
          >
            ◀ MONTH
          </button>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{displayYear}</h1>
          <p style={{ color: 'var(--text-main)', marginTop: '8px' }}>
            Scroll to see adjacent years and pick one.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
        {years.map(year => (
          <button
            key={year}
            type="button"
            onClick={() => handleSelectYear(year)}
            className="btn-secondary"
            style={{
              textAlign: 'left',
              padding: '18px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: year === displayYear ? 'rgba(102, 252, 241, 0.12)' : 'transparent',
              borderColor: year === displayYear ? 'var(--primary-color)' : 'var(--glass-border)',
            }}
          >
            <span style={{ fontSize: '1rem', color: 'var(--text-heading)', fontWeight: 600 }}>{year}</span>
            {year === displayYear ? <span style={{ color: 'var(--primary-color)' }}>Selected</span> : null}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {monthNames.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => handleSelectMonth(index)}
            className="btn-secondary"
            style={{ padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{label}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>{format(new Date(displayYear, index, 1), 'MMMM')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
