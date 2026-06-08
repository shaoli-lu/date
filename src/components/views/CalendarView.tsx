import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, addWeeks, subWeeks, getHours, getMinutes, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarView({ session, view, refreshKey, selectedDate, onNavigateToDate }: { session: Session, view: 'weekly' | 'monthly', refreshKey: number, selectedDate: Date, onNavigateToDate: (view: 'today' | 'weekly' | 'monthly', date: Date) => void }) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [direction, setDirection] = useState(0)
  const [events, setEvents] = useState<any[]>([])

  const startDate = view === 'monthly' ? startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }) : startOfWeek(currentDate, { weekStartsOn: 1 })
  const endDate = view === 'monthly' ? endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) : endOfWeek(currentDate, { weekStartsOn: 1 })
  const weekRangeLabel = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`

  useEffect(() => {
    setCurrentDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
      if (data) setEvents(data)
    }
    fetchEvents()
  }, [currentDate, view, refreshKey])

  const nextPeriod = () => {
    setDirection(1)
    if (view === 'monthly') setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addWeeks(currentDate, 1))
  }

  const prevPeriod = () => {
    setDirection(-1)
    if (view === 'monthly') setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subWeeks(currentDate, 1))
  }

  const renderMonthlyGrid = () => {
    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), cloneDay))
        
        days.push(
          <div 
            className={`calendar-cell ${!isSameMonth(day, currentDate) ? "disabled" : isSameDay(day, new Date()) ? "today" : ""}`} 
            key={day.toISOString()}
            onClick={() => onNavigateToDate('weekly', cloneDay)}
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '4px', cursor: 'pointer' }}
          >
            <span style={{ alignSelf: 'center', marginBottom: '4px' }}>{format(day, 'd')}</span>
            <div className="monthly-event-container">
              {dayEvents.slice(0, 3).map(e => (
                <div key={e.id} className="monthly-event-pill">
                  {e.is_all_day ? '' : format(parseISO(e.start_time), 'h:mma ').toLowerCase()}{e.title}
                </div>
              ))}
              {dayEvents.length > 3 && <div className="monthly-event-overflow">+{dayEvents.length - 3}</div>}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(<div className="calendar-row" key={day.toISOString()}>{days}</div>)
      days = []
    }
    return <div style={{ minHeight: '400px' }}>{rows}</div>
  }

  const renderWeeklyGrid = () => {
    let days = []
    let day = startDate

    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const dayEvents = events.filter(e => isSameDay(parseISO(e.start_time), cloneDay))

      days.push(
        <div 
          className={`calendar-cell weekly-cell ${isSameDay(day, new Date()) ? "today" : ""}`} 
          key={day.toISOString()}
          onClick={() => onNavigateToDate('today', cloneDay)}
          style={{ cursor: 'pointer' }}
        >
          <div className="weekly-day-header">
            <span className="weekly-day-name">{format(day, 'eee')}</span>
            <span className="weekly-day-date">{format(day, 'd MMM')}</span>
          </div>
          <div className="weekly-events-container">
            {dayEvents.map(e => (
              <div key={e.id} className="weekly-event-pill">
                {e.is_all_day ? '' : format(parseISO(e.start_time), 'h:mma ').toLowerCase()}{e.title}
              </div>
            ))}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }

    return (
      <div className="glass-panel weekly-panel" style={{ padding: '16px' }}>
        <div className="weekly-row">
          {days}
        </div>
      </div>
    )
  }

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  }

  return (
    <div className="scrollable-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: '2rem', marginBottom: view === 'weekly' ? '4px' : '0', minWidth: 0, wordBreak: 'break-word' }}>
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          {view === 'weekly' && (
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', margin: 0 }}>
              Week of {weekRangeLabel}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={prevPeriod} className="btn-secondary" style={{ padding: '8px' }}><ChevronLeft /></button>
          <button onClick={nextPeriod} className="btn-secondary" style={{ padding: '8px' }}><ChevronRight /></button>
        </div>
      </div>

      {view === 'monthly' ? (
        <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
          <div className="calendar-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} style={{ color: 'var(--primary-color)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{d}</div>)}
          </div>
          
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentDate.toISOString()}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: '100%' }}
            >
              {renderMonthlyGrid()}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentDate.toISOString()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: '100%' }}
          >
            {renderWeeklyGrid()}
          </motion.div>
        </AnimatePresence>
      )}

      <style>{`
        .calendar-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }
        .calendar-cell {
          aspect-ratio: 1;
          display: flex;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          transition: background 0.2s;
          font-weight: 500;
          min-height: 80px;
          min-width: 0;
          overflow: hidden;
        }
        .calendar-cell:hover {
          background: rgba(255,255,255,0.1);
        }
        .calendar-cell.disabled {
          color: rgba(255,255,255,0.2);
        }
        .calendar-cell.today {
          background: rgba(102, 252, 241, 0.1);
          border: 1px solid var(--primary-color);
        }
        .calendar-cell.today span {
          color: var(--primary-color);
          font-weight: bold;
        }

        /* Monthly View Styling */
        .monthly-event-container {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          overflow: hidden;
        }
        .monthly-event-pill {
          font-size: 0.6rem;
          background: var(--primary-color);
          color: #0b0c10;
          border-radius: 2px;
          padding: 1px 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .monthly-event-overflow {
          font-size: 0.6rem;
          text-align: center;
          color: var(--text-main);
        }

        /* Weekly View Styling */
        .weekly-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(140px, 1fr));
          gap: 16px;
          width: 100%;
          min-width: max-content;
        }
        .weekly-panel {
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
        }
        .weekly-cell {
          aspect-ratio: auto;
          flex-direction: column;
          justify-content: flex-start;
          padding: 16px;
          min-height: 250px;
          min-width: 140px;
        }
        .weekly-day-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 12px;
          gap: 4px;
        }
        .weekly-day-name {
          font-size: 0.8rem;
          color: var(--text-main);
          text-transform: uppercase;
        }
        .weekly-day-date {
          font-size: 1rem;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }
        .weekly-events-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          min-width: 0;
        }
        .weekly-event-pill {
          font-size: 0.75rem;
          background: var(--primary-color);
          color: #0b0c10;
          border-radius: 4px;
          padding: 6px 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
          /* Monthly */
          .calendar-row {
            gap: 4px;
            margin-bottom: 4px;
          }
          .calendar-cell {
            min-height: 50px;
            aspect-ratio: auto;
          }
          .monthly-event-container {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            gap: 3px;
          }
          .monthly-event-pill {
            width: 6px;
            height: 6px;
            padding: 0;
            border-radius: 50%;
            text-indent: -9999px;
            flex-shrink: 0;
          }
          .monthly-event-overflow {
            display: none;
          }

          /* Weekly */
          .weekly-row {
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
          }
          .weekly-panel {
            overflow-x: hidden;
            overflow-y: auto;
            max-height: calc(100vh - 220px);
          }
          .weekly-cell {
            min-height: auto;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            min-width: 0;
            width: 100%;
          }
          .weekly-events-container {
            max-height: 220px;
            overflow-y: auto;
            padding-right: 8px;
          }
          .weekly-day-header {
            min-width: 0;
            align-items: flex-start;
            margin-bottom: 12px;
          }
        }
      `}</style>
    </div>
  )
}
