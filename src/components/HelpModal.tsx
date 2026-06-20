'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Lock, RefreshCw, Eye, Sparkles, TrendingUp, Mic } from 'lucide-react'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

const guideItems = [
  {
    icon: <TrendingUp size={20} style={{ color: '#00d4ff' }} />,
    title: "CD Auto Calculation",
    description: "Toggle CD Renewal inside any event to access a live certificate of deposit investment tool. It dynamically calculates compound interest, maturity dates, and investment yields.",
    bg: 'rgba(0, 212, 255, 0.1)',
  },
  {
    icon: <Mic size={20} style={{ color: '#ff007f' }} />,
    title: "Smart Voice Input",
    description: "Create events faster with speech-to-text. Tap the mic icon when adding an event to automatically dictate and populate the event title or notes.",
    bg: 'rgba(255, 0, 127, 0.1)',
  },
  {
    icon: <Lock size={20} style={{ color: '#ff4b4b' }} />,
    title: "Frictionless Passkey Auth",
    description: "Experience secure, passwordless authentication using your device's biometrics or pin. Keep your personal data fully private without memorizing complex passwords.",
    bg: 'rgba(255, 75, 75, 0.1)',
  },
  {
    icon: <Clock size={20} style={{ color: 'var(--primary-color)' }} />,
    title: "Today's Agenda",
    description: "Track tasks and appointments for the current day. Navigate to previous or next days, add new entries, or edit/delete existing events with ease.",
    bg: 'rgba(102, 252, 241, 0.1)',
  },
  {
    icon: <Calendar size={20} style={{ color: '#ffb800' }} />,
    title: "Weekly & Monthly Views",
    description: "Switch views to see the layout of your schedule. Tap days to drill down into specific hours or tasks, helping you organize your time effectively.",
    bg: 'rgba(255, 184, 0, 0.1)',
  },
  {
    icon: <Eye size={20} style={{ color: '#a855f7' }} />,
    title: "Yearly Overview",
    description: "Look at the year at a large scale. The heat map and density metrics let you spot busy vs. free periods, holidays, and major milestones at a glance.",
    bg: 'rgba(168, 85, 247, 0.1)',
  },
  {
    icon: <RefreshCw size={20} style={{ color: '#22c55e' }} />,
    title: "Recurring Events",
    description: "Configure repeated tasks (daily, weekly, monthly, yearly). Choose when the series ends, and edit single occurrences or the entire series at once.",
    bg: 'rgba(34, 197, 94, 0.1)',
  },
]

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            zIndex: 3000,
            padding: '1rem',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              background: 'rgba(31, 40, 51, 0.85)',
              borderRadius: '24px',
              boxShadow: '0 0 40px rgba(102, 252, 241, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(102, 252, 241, 0.2)',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close icon */}
            <button
              onClick={onClose}
              aria-label="Close user guide"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary-color)' }} />
                <h2
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em',
                  }}
                >
                  SwiftNotes Guide ⚡
                </h2>
              </div>
              <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: 1.5, opacity: 0.8 }}>
                Manage your tasks efficiently and protect your schedule. Here is how to use the key features of this application:
              </p>
            </div>

            {/* Scrollable list */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '6px',
                marginRight: '-6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {guideItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                    e.currentTarget.style.borderColor = 'rgba(102, 252, 241, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: item.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '4px' }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: 1.45, opacity: 0.85 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Quote at the bottom */}
              <div
                style={{
                  marginTop: '12px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'rgba(102, 252, 241, 0.03)',
                  border: '1px dashed rgba(102, 252, 241, 0.15)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontStyle: 'italic' }}>
                  "Either you run the day, or the day runs you."
                  <br />
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, color: 'var(--text-main)', fontStyle: 'normal' }}>
                    — SwiftNotes Navigator 🎙️✨
                  </span>
                </p>
              </div>
            </div>

            {/* Bottom Button */}
            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
              <button
                onClick={onClose}
                className="btn-primary"
                style={{
                  width: '100%',
                  fontSize: '0.9rem',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(102, 252, 241, 0.2)',
                }}
              >
                Got It!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
