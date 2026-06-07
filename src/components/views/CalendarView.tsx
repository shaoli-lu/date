import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, addWeeks, subWeeks, getHours, getMinutes, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarView({ session, view, refreshKey }: { session: Session, view: 'weekly' | 'monthly', refreshKey: number }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [direction, setDirection] = useState(0)
  const [events, setEvents] = useState<any[]>([])

  const startDate = view === 'monthly' ? startOfWeek(startOfMonth(currentDate)) : startOfWeek(currentDate)
  const endDate = view === 'monthly' ? endOfWeek(endOfMonth(currentDate)) : endOfWeek(currentDate)

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
            style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '4px' }}
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
        >
          <div className="weekly-day-header">
            <span className="weekly-day-name">{format(day, 'eee')}</span>
            <span className="weekly-day-number">{format(day, 'd')}</span>
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
      <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
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
        <h1 style={{ fontSize: '2rem', minWidth: 0, wordBreak: 'break-word' }}>
          {view === 'monthly' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={prevPeriod} className="btn-secondary" style={{ padding: '8px' }}><ChevronLeft /></button>
          <button onClick={nextPeriod} className="btn-secondary" style={{ padding: '8px' }}><ChevronRight /></button>
        </div>
      </div>

      {view === 'monthly' ? (
        <div className="glass-panel" style={{ padding: '16px', overflow: 'hidden' }}>
          <div className="calendar-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', marginBottom: '10px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={{ color: 'var(--primary-color)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{d}</div>)}
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
          grid-template-columns: repeat(7, 1fr);
          gap: 16px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          margin: 0 auto;
        }
        .weekly-cell {
          aspect-ratio: auto;
          flex-direction: column;
          justify-content: flex-start;
          padding: 16px;
          min-height: 250px;
          min-width: 0;
        }
        .weekly-day-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 12px;
        }
        .weekly-day-name {
          font-size: 0.8rem;
          color: var(--text-main);
          text-transform: uppercase;
        }
        .weekly-day-number {
          font-size: 1.2rem;
          font-weight: bold;
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
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .weekly-cell {
            min-height: auto;
            flex-direction: row;
            align-items: flex-start;
            gap: 16px;
            min-width: 0;
          }
          .weekly-day-header {
            min-width: 40px;
            align-items: flex-start;
            margin-bottom: 0;
          }
        }
      `}</style>
    </div>
  )
}
