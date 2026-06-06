import { Calendar, LayoutDashboard, CalendarDays } from 'lucide-react'

interface BottomNavProps {
  currentTab: 'today' | 'weekly' | 'monthly'
  onTabChange: (tab: 'today' | 'weekly' | 'monthly') => void
}

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      height: 'var(--bottom-nav-height)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <NavItem 
        icon={<LayoutDashboard />} 
        label="Today" 
        active={currentTab === 'today'} 
        onClick={() => onTabChange('today')} 
      />
      <NavItem 
        icon={<CalendarDays />} 
        label="Weekly" 
        active={currentTab === 'weekly'} 
        onClick={() => onTabChange('weekly')} 
      />
      <NavItem 
        icon={<Calendar />} 
        label="Monthly" 
        active={currentTab === 'monthly'} 
        onClick={() => onTabChange('monthly')} 
      />
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: active ? 'var(--primary-color)' : 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        transition: 'color 0.2s',
        padding: '8px'
      }}
    >
      <div style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  )
}
