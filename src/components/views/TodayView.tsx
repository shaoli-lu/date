import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'

export default function TodayView({ session, refreshKey, selectedDate, onDateChange }: { session: Session, refreshKey: number, selectedDate: Date, onDateChange: (date: Date) => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTodayEvents = async () => {
      setLoading(true)
      const todayStart = startOfDay(selectedDate).toISOString()
      const todayEnd = endOfDay(selectedDate).toISOString()

      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', todayStart)
        .lte('start_time', todayEnd)
        .order('start_time', { ascending: true })

      if (data) setEvents(data)
      setLoading(false)
    }

    fetchTodayEvents()
  }, [refreshKey, selectedDate])

  const goPrevDay = () => onDateChange(addDays(selectedDate, -1))
  const goNextDay = () => onDateChange(addDays(selectedDate, 1))

  return (
    <div className="scrollable-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', color: 'var(--primary-color)' }}>
            {format(selectedDate, 'EEEE')}
          </h1>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 400 }}>
            {format(selectedDate, 'MMMM d, yyyy')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={goPrevDay} className="btn-secondary" style={{ padding: '8px 12px' }}>Prev</button>
          <button onClick={goNextDay} className="btn-secondary" style={{ padding: '8px 12px' }}>Next</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-main)' }}>Loading tasks...</div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>No events today.</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '8px' }}>Tap the + button to add a task or appointment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {events.map((event) => (
            <div key={event.id} className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--primary-color)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{event.title}</h3>
                  {event.description && <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{event.description}</p>}
                </div>
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--secondary-color)', fontWeight: 600 }}>
                    {event.is_all_day ? 'All Day' : format(new Date(event.start_time), 'h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
