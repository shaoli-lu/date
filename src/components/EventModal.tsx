import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { X, Mic, MicOff } from 'lucide-react'
import {
  parseDescription,
  serializeDescription,
  calculateCdInterest,
  calculateMaturityDate,
  generateOccurrences
} from '@/lib/eventUtils'

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

export default function EventModal({ session, event, onClose, onSuccess }: { session: Session, event?: any | null, onClose: () => void, onSuccess: (date: Date) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceEndCondition, setRecurrenceEndCondition] = useState<'never' | 'count' | 'date'>('never')
  const [recurrenceEndCount, setRecurrenceEndCount] = useState<number>(10)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('')
  const [seriesId, setSeriesId] = useState<string | null>(null)
  const [editScope, setEditScope] = useState<'single' | 'series'>('single')

  // CD Renewal states
  const [isCdRenewal, setIsCdRenewal] = useState(false)
  const [cdPrincipal, setCdPrincipal] = useState<number>(10000)
  const [cdApy, setCdApy] = useState<number>(5.0)
  const [cdStartDate, setCdStartDate] = useState<string>(() => {
    const today = new Date()
    const pad = (value: number) => value.toString().padStart(2, '0')
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  })
  const [cdTermValue, setCdTermValue] = useState<number>(12)
  const [cdTermUnit, setCdTermUnit] = useState<'days' | 'months' | 'years'>('months')

  // Dynamic CD Interest Calculation
  const { interest: cdInterest, grandTotal: cdGrandTotal } = isCdRenewal
    ? calculateCdInterest(cdPrincipal, cdApy, cdTermValue, cdTermUnit)
    : { interest: 0, grandTotal: 0 }

  // Sync CD Maturation date with Event start date
  useEffect(() => {
    if (isCdRenewal && cdStartDate && cdTermValue > 0) {
      const maturity = calculateMaturityDate(cdStartDate, cdTermValue, cdTermUnit)
      if (isAllDay) {
        setStartTime(formatLocalDate(maturity))
        setEndTime('')
      } else {
        let hours = 9
        let minutes = 0
        if (startTime && startTime.includes('T')) {
          const timePart = startTime.split('T')[1]
          const [h, m] = timePart.split(':').map(Number)
          if (!isNaN(h)) hours = h
          if (!isNaN(m)) minutes = m
        }
        maturity.setHours(hours, minutes, 0, 0)
        const newStart = formatLocalDateTime(maturity)
        setStartTime(newStart)
        setEndTime(getDefaultEndTime(newStart))
      }
    }
  }, [isCdRenewal, cdStartDate, cdTermValue, cdTermUnit, isAllDay])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(Boolean(SpeechRecognition))
  }, [])

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) {
        setTitle(transcript)
        setIsAllDay(true)
        setStartTime(formatLocalDate(new Date()))
        setEndTime('')
      }
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognition.start()
  }

  useEffect(() => {
    if (!event) {
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setIsAllDay(false)

      setIsRecurring(false)
      setRecurrenceFrequency('weekly')
      setRecurrenceEndCondition('never')
      setRecurrenceEndCount(10)
      setRecurrenceEndDate('')
      setSeriesId(null)
      setEditScope('single')

      setIsCdRenewal(false)
      setCdPrincipal(10000)
      setCdApy(5.0)
      setCdStartDate(() => {
        const today = new Date()
        const pad = (value: number) => value.toString().padStart(2, '0')
        return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
      })
      setCdTermValue(12)
      setCdTermUnit('months')
      return
    }

    const eventStart = new Date(event.start_time)
    const eventEnd = event.end_time ? new Date(event.end_time) : null

    const parsed = parseDescription(event.description)
    setTitle(event.title ?? '')
    setDescription(parsed.text ?? '')
    setIsAllDay(Boolean(event.is_all_day))

    if (event.is_all_day) {
      setStartTime(formatLocalDate(eventStart))
      setEndTime('')
    } else {
      setStartTime(formatLocalDateTime(eventStart))
      setEndTime(eventEnd ? formatLocalDateTime(eventEnd) : getDefaultEndTime(formatLocalDateTime(eventStart)))
    }

    if (parsed.metadata.recurring) {
      setIsRecurring(true)
      setRecurrenceFrequency(parsed.metadata.recurring.frequency ?? 'weekly')
      setRecurrenceEndCondition(parsed.metadata.recurring.endCondition ?? 'never')
      setRecurrenceEndCount(parsed.metadata.recurring.endCount ?? 10)
      setRecurrenceEndDate(parsed.metadata.recurring.endDate ? parsed.metadata.recurring.endDate.split('T')[0] : '')
      setSeriesId(parsed.metadata.recurring.seriesId || null)
      setEditScope('single')
    } else {
      setIsRecurring(false)
      setSeriesId(null)
    }

    if (parsed.metadata.cdRenewal) {
      setIsCdRenewal(true)
      setCdPrincipal(parsed.metadata.cdRenewal.principal ?? 10000)
      setCdApy(parsed.metadata.cdRenewal.apy ?? 5.0)
      setCdStartDate(parsed.metadata.cdRenewal.startDate ? parsed.metadata.cdRenewal.startDate.split('T')[0] : '')
      setCdTermValue(parsed.metadata.cdRenewal.termValue ?? 12)
      setCdTermUnit(parsed.metadata.cdRenewal.termUnit ?? 'months')
    } else {
      setIsCdRenewal(false)
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const cdRenewalMetadata = isCdRenewal ? {
      principal: cdPrincipal,
      apy: cdApy,
      startDate: cdStartDate,
      termValue: cdTermValue,
      termUnit: cdTermUnit,
      interest: cdInterest,
      grandTotal: cdGrandTotal
    } : undefined

    const baseStart = isAllDay && startTime ? parseLocalDate(startTime) : new Date(`${startTime}`)
    const finalSeriesId = seriesId || crypto.randomUUID()

    // 1. Edit branch
    if (event?.id) {
      if (editScope === 'series' && seriesId) {
        // Delete all in series, then insert new ones
        const { error: delError } = await supabase.from('events').delete().like('description', `%${seriesId}%`)
        if (delError) {
          alert("Error updating series (deletion phase): " + delError.message)
          setLoading(false)
          return
        }

        // Generate and insert new ones
        let occurrencesDates: Date[] = []
        if (isRecurring) {
          const parsedEndDate = recurrenceEndDate ? new Date(recurrenceEndDate + 'T23:59:59') : undefined
          occurrencesDates = generateOccurrences(
            baseStart,
            recurrenceFrequency,
            recurrenceEndCondition,
            recurrenceEndCount,
            parsedEndDate
          )
        } else {
          occurrencesDates = [baseStart]
        }

        const durationMs = isAllDay || !endTime ? 0 : new Date(`${endTime}`).getTime() - baseStart.getTime()
        const payloads = occurrencesDates.map((occDate, index) => {
          const occStart = occDate
          const occEnd = isAllDay || !endTime ? null : new Date(occStart.getTime() + durationMs)

          const occurrenceMetadata = {
            recurring: {
              seriesId: finalSeriesId,
              index: index + 1,
              total: occurrencesDates.length,
              frequency: recurrenceFrequency,
              endCondition: recurrenceEndCondition,
              endCount: recurrenceEndCount,
              endDate: recurrenceEndDate
            },
            ...(cdRenewalMetadata ? { cdRenewal: cdRenewalMetadata } : {})
          }

          return {
            user_id: session.user.id,
            title,
            description: serializeDescription(description, occurrenceMetadata),
            start_time: isAllDay ? toLocalDateISOString(formatLocalDate(occStart)) : occStart.toISOString(),
            end_time: occEnd ? occEnd.toISOString() : null,
            is_all_day: isAllDay
          }
        })

        const { error: insertError } = await supabase.from('events').insert(payloads)
        setLoading(false)
        if (insertError) {
          alert("Error updating series (insertion phase): " + insertError.message)
        } else {
          onSuccess(baseStart)
        }
      } else {
        // Single update
        const finalMetadata = {
          ...(isRecurring ? {
            recurring: {
              seriesId: finalSeriesId,
              index: parseDescription(event.description).metadata.recurring?.index || 1,
              total: parseDescription(event.description).metadata.recurring?.total || 1,
              frequency: recurrenceFrequency,
              endCondition: recurrenceEndCondition,
              endCount: recurrenceEndCount,
              endDate: recurrenceEndDate
            }
          } : {}),
          ...(cdRenewalMetadata ? { cdRenewal: cdRenewalMetadata } : {})
        }

        const eventPayload = {
          user_id: session.user.id,
          title,
          description: serializeDescription(description, finalMetadata),
          start_time: isAllDay && startTime ? toLocalDateISOString(startTime) : new Date(`${startTime}`).toISOString(),
          end_time: isAllDay || !endTime ? null : new Date(`${endTime}`).toISOString(),
          is_all_day: isAllDay
        }

        const { error } = await supabase.from('events').update(eventPayload).eq('id', event.id)
        setLoading(false)
        if (error) {
          alert("Error saving event: " + error.message)
        } else {
          onSuccess(baseStart)
        }
      }
    } else {
      // 2. Insert branch
      let occurrencesDates: Date[] = []
      if (isRecurring) {
        const parsedEndDate = recurrenceEndDate ? new Date(recurrenceEndDate + 'T23:59:59') : undefined
        occurrencesDates = generateOccurrences(
          baseStart,
          recurrenceFrequency,
          recurrenceEndCondition,
          recurrenceEndCount,
          parsedEndDate
        )
      } else {
        occurrencesDates = [baseStart]
      }

      const durationMs = isAllDay || !endTime ? 0 : new Date(`${endTime}`).getTime() - baseStart.getTime()
      const payloads = occurrencesDates.map((occDate, index) => {
        const occStart = occDate
        const occEnd = isAllDay || !endTime ? null : new Date(occStart.getTime() + durationMs)

        const occurrenceMetadata = {
          ...(isRecurring ? {
            recurring: {
              seriesId: finalSeriesId,
              index: index + 1,
              total: occurrencesDates.length,
              frequency: recurrenceFrequency,
              endCondition: recurrenceEndCondition,
              endCount: recurrenceEndCount,
              endDate: recurrenceEndDate
            }
          } : {}),
          ...(cdRenewalMetadata ? { cdRenewal: cdRenewalMetadata } : {})
        }

        return {
          user_id: session.user.id,
          title,
          description: serializeDescription(description, occurrenceMetadata),
          start_time: isAllDay ? toLocalDateISOString(formatLocalDate(occStart)) : occStart.toISOString(),
          end_time: occEnd ? occEnd.toISOString() : null,
          is_all_day: isAllDay
        }
      })

      const { error } = await supabase.from('events').insert(payloads)
      setLoading(false)
      if (error) {
        alert("Error saving event: " + error.message)
      } else {
        onSuccess(baseStart)
      }
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
          <h2>{event ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <X />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Event Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              style={{ flex: 1, fontSize: '1.2rem', fontWeight: 'bold' }}
            />
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={!voiceSupported || isRecording}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '1px solid rgba(102, 252, 241, 0.45)',
                backgroundColor: 'rgba(102, 252, 241, 0.08)',
                backgroundImage: 'linear-gradient(135deg, #66fcf1 0%, #f5c242 55%, #ff6f61 100%)',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
                fontWeight: 900,
                cursor: voiceSupported ? 'pointer' : 'not-allowed',
                boxShadow: '0 14px 28px rgba(0, 0, 0, 0.22)',
              }}
            >
              {isRecording ? <MicOff size={16} style={{ color: 'var(--primary-color)' }} /> : <Mic size={16} style={{ color: 'var(--primary-color)' }} />}
              <span style={{
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {isRecording ? 'Listening' : 'Voice'}
              </span>
            </button>
          </div>
          
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
                } else {
                  const baseDate = startTime ? parseLocalDate(startTime) : new Date()
                  baseDate.setHours(9, 0, 0, 0)
                  const newStart = formatLocalDateTime(baseDate)
                  setStartTime(newStart)
                  setEndTime(getDefaultEndTime(newStart))
                }
              }} 
              style={{ width: 'auto' }}
            />
            All-day event
          </label>

          {!isCdRenewal ? (
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Starts</label>
                <input 
                  type={isAllDay ? 'date' : 'datetime-local'} 
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
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>Maturity Date (Event Date)</label>
              <div style={{
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--primary-color)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📅 {startTime ? new Date(startTime + 'T12:00:00').toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Calculating...'}
              </div>
            </div>
          )}

          {/* Recurrence and CD Renewal Toggles with Cascading Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            
            {/* Recurring Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>🔁 Recurring Event</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* Recurring Panel */}
            {isRecurring && (
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Repeat Frequency</label>
                  <select 
                    value={recurrenceFrequency} 
                    onChange={(e: any) => setRecurrenceFrequency(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      width: '100%'
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Ends</label>
                  <select 
                    value={recurrenceEndCondition} 
                    onChange={(e: any) => setRecurrenceEndCondition(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '10px',
                      width: '100%'
                    }}
                  >
                    <option value="never">Never (Up to 1 year)</option>
                    <option value="count">After a number of occurrences</option>
                    <option value="date">On a specific date</option>
                  </select>
                </div>

                {recurrenceEndCondition === 'count' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Number of Occurrences</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={recurrenceEndCount} 
                      onChange={(e) => setRecurrenceEndCount(parseInt(e.target.value) || 1)} 
                      style={{ padding: '10px' }}
                    />
                  </div>
                )}

                {recurrenceEndCondition === 'date' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>End Date</label>
                    <input 
                      type="date" 
                      value={recurrenceEndDate} 
                      onChange={(e) => setRecurrenceEndDate(e.target.value)} 
                      style={{ padding: '10px' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* CD Renewal Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>💰 CD Renewal Reminder</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isCdRenewal} 
                  onChange={(e) => setIsCdRenewal(e.target.checked)} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* CD Renewal Panel */}
            {isCdRenewal && (
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Principal Amount ($)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={cdPrincipal} 
                      className="no-spin"
                      onChange={(e) => setCdPrincipal(parseFloat(e.target.value) || 0)} 
                      style={{ padding: '10px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Annual Yield (APY %)</label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={cdApy} 
                      onChange={(e) => setCdApy(parseFloat(e.target.value) || 0)} 
                      style={{ padding: '10px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>CD Term Duration</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={cdTermValue} 
                      onChange={(e) => setCdTermValue(parseInt(e.target.value) || 1)} 
                      style={{ padding: '10px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>Term Unit</label>
                    <select 
                      value={cdTermUnit} 
                      onChange={(e: any) => setCdTermUnit(e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '10px',
                        width: '100%'
                      }}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>CD Start Date</label>
                  <input 
                    type="date" 
                    value={cdStartDate} 
                    onChange={(e) => setCdStartDate(e.target.value)} 
                    style={{ padding: '10px' }}
                  />
                </div>

                {/* Dynamic Calculations Card */}
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(102, 252, 241, 0.08)',
                  border: '1px solid var(--primary-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', borderBottom: '1px solid rgba(102,252,241,0.2)', paddingBottom: '4px' }}>
                    Calculated Maturation Yield
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ opacity: 0.8 }}>Interest Earned:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>${cdInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ opacity: 0.8 }}>Maturity Total:</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>${cdGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Scope Options (if editing an existing series event) */}
            {event?.id && seriesId && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '8px'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>🔁 Recurring Series Options</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>How do you want to apply these changes?</span>
                <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', color: '#fff' }}>
                    <input 
                      type="radio" 
                      name="editScope" 
                      value="single" 
                      checked={editScope === 'single'} 
                      onChange={() => setEditScope('single')} 
                      style={{ width: 'auto' }}
                    />
                    Only this occurrence
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', color: '#fff' }}>
                    <input 
                      type="radio" 
                      name="editScope" 
                      value="series" 
                      checked={editScope === 'series'} 
                      onChange={() => setEditScope('series')} 
                      style={{ width: 'auto' }}
                    />
                    All occurrences
                  </label>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px', padding: '14px' }}>
            {loading ? (event ? 'Saving...' : 'Saving...') : event ? 'Update Event' : 'Save Event'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255,255,255,0.08);
          transition: .3s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: var(--text-main);
          transition: .3s;
        }
        input:checked + .slider {
          background-color: rgba(102, 252, 241, 0.2);
          border-color: var(--primary-color);
        }
        input:checked + .slider:before {
          transform: translateX(24px);
          background-color: var(--primary-color);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spin {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
