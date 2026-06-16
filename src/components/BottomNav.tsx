type Tab = 'today' | 'weekly' | 'monthly' | 'yearly' | 'passkey'

type BottomNavProps = {
  currentTab: Tab
  onTabChange: (tab: Tab) => void
  onAdd: () => void
}

const tabLabels: Record<Tab, string> = {
  today: 'Today',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Year',
  passkey: 'Passkey',
}

const tabIcons: Record<Tab, string> = {
  today: '☀️',
  weekly: '📅',
  monthly: '🗓️',
  yearly: '📆',
  passkey: '🔑',
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
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'rgba(11, 12, 16, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', gap: '0.25rem', flex: 1 }}>
        {(['today', 'weekly', 'monthly', 'yearly', 'passkey'] as Tab[]).map(tab => (
          <button
            key={tab}
            id={`nav-tab-${tab}`}
            type="button"
            onClick={() => onTabChange(tab)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
              borderRadius: '12px',
              border: 'none',
              background: currentTab === tab ? 'rgba(102, 252, 241, 0.12)' : 'transparent',
              color: currentTab === tab ? 'var(--primary-color)' : 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.65rem',
              fontWeight: currentTab === tab ? 700 : 400,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1, filter: currentTab === tab ? 'none' : 'grayscale(0.5)' }}>
              {tabIcons[tab]}
            </span>
            <span>{tabLabels[tab]}</span>
          </button>
        ))}
      </div>

      <button
        id="nav-add-event"
        type="button"
        onClick={onAdd}
        style={{
          flexShrink: 0,
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: 'none',
          background: 'var(--primary-color)',
          color: '#0b0c10',
          fontWeight: 700,
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          marginLeft: '0.5rem',
          transition: 'transform 0.15s ease, background 0.2s ease',
        }}
      >
        +
      </button>
    </nav>
  )
}
