import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { Trash2, Pencil } from 'lucide-react'
import { parseDescription } from '@/lib/eventUtils'

export default function TodayView({ session, refreshKey, selectedDate, onDateChange, onEditEvent }: { session: Session, refreshKey: number, selectedDate: Date, onDateChange: (date: Date) => void, onEditEvent?: (event: any) => void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

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

  const deleteEvent = (event: any) => {
    setDeleteTarget(event)
  }

  const executeDelete = async (eventId: string | number, scope: 'single' | 'series', seriesId?: string) => {
    setDeletingId(eventId)
    setDeleteTarget(null)

    let error
    if (scope === 'series' && seriesId) {
      const result = await supabase.from('events').delete().like('description', `%${seriesId}%`)
      error = result.error
      if (!error) {
        setEvents(prev => prev.filter(event => {
          const { metadata } = parseDescription(event.description)
          return metadata.recurring?.seriesId !== seriesId
        }))
      }
    } else {
      const result = await supabase.from('events').delete().eq('id', eventId)
      error = result.error
      if (!error) {
        setEvents(prev => prev.filter(event => event.id !== eventId))
      }
    }

    setDeletingId(null)

    if (error) {
      alert('Failed to delete event: ' + error.message)
    }
  }

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
          {events.map((event) => {
            const { text, metadata } = parseDescription(event.description)
            const showRecurring = Boolean(metadata.recurring)
            
            return (
              <div key={event.id} className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--primary-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {event.title}
                      {showRecurring && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(102, 252, 241, 0.08)',
                          border: '1px solid rgba(102, 252, 241, 0.2)',
                          fontSize: '0.75rem',
                          color: 'var(--primary-color)',
                          fontWeight: 'normal'
                        }}>
                          🔁 {metadata.recurring?.frequency} ({metadata.recurring?.index}/{metadata.recurring?.total})
                        </span>
                      )}
                    </h3>
                    
                    {text && <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '8px' }}>{text}</p>}

                    {metadata.cdRenewal && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(102, 252, 241, 0.04)',
                        border: '1px solid rgba(102, 252, 241, 0.15)',
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px 16px',
                        maxWidth: '450px'
                      }}>
                        <div style={{
                          gridColumn: 'span 2',
                          fontWeight: 'bold',
                          color: 'var(--primary-color)',
                          borderBottom: '1px solid rgba(102, 252, 241, 0.1)',
                          paddingBottom: '4px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>💰 CD Maturation Details</span>
                          <span>APY: {metadata.cdRenewal.apy}%</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7, display: 'block', fontSize: '0.75rem' }}>Principal</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>${metadata.cdRenewal.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7, display: 'block', fontSize: '0.75rem' }}>CD Term</span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{metadata.cdRenewal.termValue} {metadata.cdRenewal.termUnit}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7, display: 'block', fontSize: '0.75rem' }}>Interest at Maturity</span>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>${metadata.cdRenewal.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span style={{ opacity: 0.7, display: 'block', fontSize: '0.75rem' }}>Grand Total</span>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>${metadata.cdRenewal.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', opacity: 0.6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '2px' }}>
                          Start Date: {format(new Date(metadata.cdRenewal.startDate + 'T12:00:00'), 'MMM d, yyyy')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '80px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--secondary-color)', fontWeight: 600 }}>
                      {event.is_all_day ? 'All Day' : format(new Date(event.start_time), 'h:mm a')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => onEditEvent?.(event)}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEvent(event)}
                        disabled={deletingId === event.id}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={14} />
                        {deletingId === event.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--danger-color)' }}>
              {parseDescription(deleteTarget.description).metadata.recurring ? 'Delete Recurring Event' : 'Delete Event'}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {parseDescription(deleteTarget.description).metadata.recurring ? (
                <>
                  "<strong>{deleteTarget.title}</strong>" is part of a recurring series. How would you like to delete it?
                </>
              ) : (
                <>
                  Are you sure you want to delete "<strong>{deleteTarget.title}</strong>"?
                </>
              )}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {parseDescription(deleteTarget.description).metadata.recurring ? (
                <>
                  <button 
                    onClick={() => executeDelete(deleteTarget.id, 'single')}
                    className="btn-secondary"
                    style={{ width: '100%', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    Delete Only This Occurrence
                  </button>
                  <button 
                    onClick={() => executeDelete(deleteTarget.id, 'series', parseDescription(deleteTarget.description).metadata.recurring?.seriesId)}
                    className="btn-primary"
                    style={{ width: '100%', background: 'var(--danger-color)', color: '#fff' }}
                  >
                    Delete Entire Series
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => executeDelete(deleteTarget.id, 'single')}
                  className="btn-primary"
                  style={{ width: '100%', background: 'var(--danger-color)', color: '#fff' }}
                >
                  Delete Event
                </button>
              )}
              <button 
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary"
                style={{ width: '100%', border: 'none', background: 'transparent' }}
              >
                Cancel
              </button>
            </div>
          </div>
          <style>{`
            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
