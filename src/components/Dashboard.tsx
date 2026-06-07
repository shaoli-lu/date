import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import BottomNav from './BottomNav'
import TodayView from './views/TodayView'
import CalendarView from './views/CalendarView'
import EventModal from './EventModal'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Dashboard({ session }: { session: Session }) {
  const [currentTab, setCurrentTab] = useState<'today' | 'weekly' | 'monthly'>('today')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEventAdded = () => {
    setIsModalOpen(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleNavigateToDate = (view: 'today' | 'weekly' | 'monthly', date: Date) => {
    setSelectedDate(date)
    setCurrentTab(view)
  }

  const handleTabChange = (tab: 'today' | 'weekly' | 'monthly') => {
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
            {currentTab === 'today' && <TodayView session={session} refreshKey={refreshKey} selectedDate={selectedDate} onDateChange={setSelectedDate} />}
            {currentTab === 'weekly' && <CalendarView session={session} view="weekly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} />}
            {currentTab === 'monthly' && <CalendarView session={session} view="monthly" refreshKey={refreshKey} selectedDate={selectedDate} onNavigateToDate={handleNavigateToDate} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          padding: 0,
          boxShadow: '0 4px 20px rgba(102, 252, 241, 0.4)',
          zIndex: 1000
        }}
      >
        <Plus size={24} color="#0b0c10" />
      </button>

      <BottomNav currentTab={currentTab} onTabChange={handleTabChange} />

      {isModalOpen && <EventModal session={session} onClose={() => setIsModalOpen(false)} onSuccess={handleEventAdded} />}
    </>
  )
}
