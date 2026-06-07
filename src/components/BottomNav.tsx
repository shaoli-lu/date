import { Calendar, LayoutDashboard, CalendarDays } from 'lucide-react'

interface BottomNavProps {
  currentTab: 'today' | 'weekly' | 'monthly'
  onTabChange: (tab: 'today' | 'weekly' | 'monthly') => void
}

interface BottomNavProps {
  currentTab: 'today' | 'weekly' | 'monthly'
  onTabChange: (tab: 'today' | 'weekly' | 'monthly') => void
  onAdd: () => void
}

export default function BottomNav({ currentTab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      right: '20px',
      height: 'var(--top-nav-height)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 16px',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'auto' }}>
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

      <button
        onClick={onAdd}
        className="btn-primary"
        style={{ minWidth: '56px', width: '56px', height: '56px', borderRadius: '28px', padding: '0' }}
      >
        <span style={{ fontSize: '24px', lineHeight: 1 }}>&#43;</span>
      </button>
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
