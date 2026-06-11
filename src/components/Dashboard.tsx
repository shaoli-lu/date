import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import BottomNav from './BottomNav'
import TodayView from './views/TodayView'
import CalendarView from './views/CalendarView'
import PasskeyView from './views/PasskeyView'
import EventModal from './EventModal'
import { AnimatePresence, motion } from 'framer-motion'

type Tab = 'today' | 'weekly' | 'monthly' | 'passkey'

export default function Dashboard({ session }: { session: Session }) {
  const [currentTab, setCurrentTab] = useState<Tab>('today')
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

  const handleNavigateToDate = (view: 'today' | 'weekly' | 'monthly', date: Date) => {
    setSelectedDate(date)
    setCurrentTab(view)
  }

  const handleTabChange = (tab: Tab) => {
    if (tab === 'today') {
      setSelectedDate(new Date())
    }
    setCurrentTab(tab)
  }

  return (
    <>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
          >
            {currentTab === 'today' && <TodayView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onDateChange={setSelectedDate} onEditEvent={handleEditEvent} />}
            {currentTab === 'weekly' && <CalendarView session={session} view="weekly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} />}
            {currentTab === 'monthly' && <CalendarView session={session} view="monthly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} />}
            {currentTab === 'passkey' && <PasskeyView session={session} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} onAdd={openNewEvent} />

      {isModalOpen && <EventModal session={session} event={editingEvent} onClose={() => setIsModalOpen(false)} onSuccess={handleEventAdded} />}
    </>
  )
}
