import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import BottomNav from './BottomNav'
import TodayView from './views/TodayView'
import CalendarView from './views/CalendarView'
import YearView from './views/YearView'
import PasskeyView from './views/PasskeyView'
import EventModal from './EventModal'
import { AnimatePresence, motion } from 'framer-motion'

type Tab = 'today' | 'weekly' | 'monthly' | 'yearly' | 'passkey'

type View = Tab

export default function Dashboard({ session }: { session: Session }) {
  const [currentTab, setCurrentTab] = useState<Tab>('today')
  const [currentView, setCurrentView] = useState<View>('today')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {currentView === 'today' && <TodayView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onDateChange={setSelectedDate} onEditEvent={handleEditEvent} onNavigateUp={() => handleNavigateToDate('weekly', selectedDate)} />}
            {currentView === 'weekly' && <CalendarView session={session} view="weekly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => handleNavigateToDate('monthly', selectedDate)} />}
            {currentView === 'monthly' && <CalendarView session={session} view="monthly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => setCurrentView('yearly')} />}
            {currentView === 'yearly' && <YearView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} onNavigateUp={() => handleNavigateToDate('monthly', selectedDate)} />}
            {currentView === 'passkey' && <PasskeyView session={session} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} onAdd={openNewEvent} />

      {isModalOpen && <EventModal session={session} event={editingEvent} onClose={() => setIsModalOpen(false)} onSuccess={handleEventAdded} />}
    </>
  )
}
