import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

const formatLocalDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatLocalDate = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toLocalDateISOString = (value: string) => {
  const date = parseLocalDate(value)
  return date.toISOString()
}

const getDefaultEndTime = (start: string) => {
  const date = new Date(start)
  if (Number.isNaN(date.getTime())) return ''
  date.setHours(date.getHours() + 1)
  return formatLocalDateTime(date)
}

export default function EventModal({ session, onClose, onSuccess }: { session: Session, onClose: () => void, onSuccess: (date: Date) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const newEvent = {
      user_id: session.user.id,
      title,
      description,
      start_time: isAllDay && startTime ? toLocalDateISOString(startTime) : new Date(`${startTime}`).toISOString(),
      end_time: isAllDay || !endTime ? null : new Date(`${endTime}`).toISOString(),
      is_all_day: isAllDay
    }

    const result = await supabase.from('events').insert<any>([newEvent])
    const data = result.data as any[] | null
    const error = result.error
    setLoading(false)

    if (!error && data && data.length > 0) {
      onSuccess(new Date(data[0].start_time))
    } else if (!error) {
      onSuccess(new Date(newEvent.start_time))
    } else {
      alert("Error saving event: " + error.message)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>New Event</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Event Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
          />
          
          <textarea 
            placeholder="Description or Notes" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={3}
            style={{ resize: 'none' }}
          />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <input 
              type="checkbox" 
              checked={isAllDay} 
              onChange={(e) => {
                const checked = e.target.checked
                setIsAllDay(checked)
                if (checked) {
                  const dateValue = startTime ? startTime.split('T')[0] : formatLocalDate(new Date())
                  setStartTime(dateValue)
                  setEndTime('')
                } else if (!startTime) {
                  setStartTime(formatLocalDateTime(new Date()))
                }
              }} 
              style={{ width: 'auto' }}
            />
            All-day event
          </label>

          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Starts</label>
              <input 
                type={isAllDay ? "date" : "datetime-local"} 
                value={startTime} 
                onChange={(e) => {
                  const value = e.target.value
                  setStartTime(value)
                  if (!isAllDay && value) {
                    const startDate = new Date(value)
                    const endDate = endTime ? new Date(endTime) : null
                    const shouldUpdateEnd = !endTime || !endDate || Number.isNaN(endDate.getTime()) || endDate <= startDate
                    if (shouldUpdateEnd) {
                      setEndTime(getDefaultEndTime(value))
                    }
                  }
                }} 
                required 
              />
            </div>
            {!isAllDay && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Ends</label>
                <input 
                  type="datetime-local" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                />
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px', padding: '14px' }}>
            {loading ? 'Saving...' : 'Save Event'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
