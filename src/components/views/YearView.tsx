import { format } from 'date-fns'
import { Session } from '@supabase/supabase-js'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function YearView({ session, refreshKey, selectedDate, onNavigateToDate, onNavigateUp }: { session: Session, refreshKey: number, selectedDate: Date, onNavigateToDate: (view: 'today' | 'weekly' | 'monthly' | 'yearly', date: Date) => void, onNavigateUp: () => void }) {
  const year = selectedDate.getFullYear()

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
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{year}</h1>
          <p style={{ color: 'var(--text-main)', marginTop: '8px' }}>Jump to a month</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {monthNames.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => onNavigateToDate('monthly', new Date(year, index, 1))}
            className="btn-secondary"
            style={{ padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-heading)' }}>{format(new Date(year, index, 1), 'MMMM')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
