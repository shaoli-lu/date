import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import BottomNav from './BottomNav'
import TodayView from './views/TodayView'
import CalendarView from './views/CalendarView'
import YearView from './views/YearView'
import PasskeyView from './views/PasskeyView'
import EventModal from './EventModal'
import HelpModal from './HelpModal'
import { AnimatePresence, motion } from 'framer-motion'

type Tab = 'today' | 'weekly' | 'monthly' | 'yearly' | 'passkey'

type View = Tab

export default function Dashboard({ session }: { session: Session }) {
  const [currentTab, setCurrentTab] = useState<Tab>('today')
  const [currentView, setCurrentView] = useState<View>('today')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEventAdded = (eventDate: Date) => {
    setIsModalOpen(false)
    setEditingEvent(null)
    setRefreshKey(prev => prev + 1)
    setSelectedDate(eventDate)
  }

  const openNewEvent = () => {
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const handleEditEvent = (event: any) => {
    setEditingEvent(event)
    setIsModalOpen(true)
  }

  const handleNavigateToDate = (view: View, date: Date) => {
    setSelectedDate(date)
    setCurrentView(view)
    setCurrentTab(view)
  }

  const handleTabChange = (tab: Tab) => {
    if (tab === 'today') {
      setSelectedDate(new Date())
    }
    setCurrentTab(tab)
    setCurrentView(tab)
  }

  return (
    <>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {currentView === 'today' && <TodayView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onDateChange={setSelectedDate} onEditEvent={handleEditEvent} onNavigateUp={() => handleNavigateToDate('weekly', selectedDate)} />}
            {currentView === 'weekly' && <CalendarView session={session} view="weekly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => handleNavigateToDate('monthly', selectedDate)} />}
            {currentView === 'monthly' && <CalendarView session={session} view="monthly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => handleNavigateToDate('yearly', selectedDate)} />}
            {currentView === 'yearly' && <YearView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => handleNavigateToDate('monthly', selectedDate)} />}
            {currentView === 'passkey' && <PasskeyView session={session} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Help Guide */}
      <motion.button
        id="help-trigger-fab"
        type="button"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Help Guide"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          background: 'rgba(31, 40, 51, 0.85)',
          color: 'var(--primary-color)',
          fontSize: '1.2rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(102, 252, 241, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 99,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        ❓
      </motion.button>

      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} onAdd={openNewEvent} />

      {isModalOpen && <EventModal session={session} event={editingEvent} onClose={() => setIsModalOpen(false)} onSuccess={handleEventAdded} />}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  )
}
