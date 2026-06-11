type BottomNavProps = {
  currentTab: 'today' | 'weekly' | 'monthly'
  onTabChange: (tab: 'today' | 'weekly' | 'monthly') => void
  onAdd: () => void
}

const tabLabels: Record<BottomNavProps['currentTab'], string> = {
  today: 'Today',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export default function BottomNav({ currentTab, onTabChange, onAdd }: BottomNavProps) {
  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '1rem',
        background: 'rgba(11, 12, 16, 0.92)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {(['today', 'weekly', 'monthly'] as BottomNavProps['currentTab'][]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: currentTab === tab ? 'rgba(102, 252, 241, 0.12)' : 'transparent',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: currentTab === tab ? 700 : 500,
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '999px',
          border: '1px solid var(--primary-color)',
          background: 'var(--primary-color)',
          color: '#0b0c10',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Add
      </button>
    </nav>
  )
}
