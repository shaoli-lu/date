'use client'

import React, { useState } from 'react'
import { HolidayData, ALL_HOLIDAYS, UpcomingHoliday } from '@/lib/holidayUtils'
import { Sparkles, Utensils, Compass, BookOpen, ChevronRight, X, Calendar as CalendarIcon, Info } from 'lucide-react'
import { format } from 'date-fns'

interface HolidaySpotlightProps {
  currentHoliday: HolidayData | null
  upcomingHoliday: UpcomingHoliday | null
  selectedDate: Date
  onSelectHolidayDate?: (date: Date) => void
}

export default function HolidaySpotlight({
  currentHoliday,
  upcomingHoliday,
  selectedDate,
  onSelectHolidayDate,
}: HolidaySpotlightProps) {
  const [activeTab, setActiveTab] = useState<'significance' | 'customs' | 'foods' | 'facts'>('significance')
  const [showAllModal, setShowAllModal] = useState(false)
  const [modalHoliday, setModalHoliday] = useState<HolidayData | null>(null)
  const [modalTab, setModalTab] = useState<'significance' | 'customs' | 'foods' | 'facts'>('significance')
  const [modalFilter, setModalFilter] = useState<'all' | 'holiday' | 'solarTerm'>('all')

  const activeHoliday = currentHoliday

  const handleOpenHoliday = (h: HolidayData) => {
    setModalHoliday(h)
    setModalTab('significance')
  }

  const filteredHolidays = ALL_HOLIDAYS.filter(h => {
    if (modalFilter === 'holiday') return h.isHoliday !== false
    if (modalFilter === 'solarTerm') return h.type === 'solarTerm' || h.isHoliday === false
    return true
  })

  return (
    <div style={{ marginTop: '16px', marginBottom: '20px' }}>
      {/* 1. Today is a Holiday Banner */}
      {activeHoliday ? (
        <div
          className="glass-panel"
          style={{
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${activeHoliday.accentColor}55`,
            background: `linear-gradient(135deg, ${activeHoliday.accentColor}12 0%, rgba(31, 40, 51, 0.75) 100%)`,
            boxShadow: `0 8px 32px ${activeHoliday.accentColor}20`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative glowing top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${activeHoliday.accentColor}, #66fcf1)`,
            }}
          />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2.4rem', lineHeight: 1 }}>{activeHoliday.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: `${activeHoliday.accentColor}25`,
                        color: activeHoliday.accentColor,
                        border: `1px solid ${activeHoliday.accentColor}50`,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {activeHoliday.isHoliday === false
                        ? '🍂 24 Solar Terms (Non-Holiday) · 二十四节气'
                        : activeHoliday.type === 'solarTerm'
                        ? '🌿 Traditional Festival & Solar Term · 传统佳节/节气'
                        : '🏮 Traditional Holiday · 传统佳节'}
                    </span>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {activeHoliday.lunarDateEng} ({activeHoliday.lunarDateStr})
                  </span>
                </div>
                <h3 style={{ fontSize: '1.6rem', color: '#fff', marginTop: '4px', marginBottom: '2px', display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <span>{activeHoliday.name}</span>
                  <span style={{ fontSize: '1.05rem', color: activeHoliday.accentColor, fontWeight: 500 }}>
                    {activeHoliday.nameEn}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                    {activeHoliday.namePinyin}
                  </span>
                </h3>
              </div>
            </div>

            {/* Explore all holidays button */}
            <button
              onClick={() => setShowAllModal(true)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <BookOpen size={14} />
              All Festivals · 节日锦囊
            </button>
          </div>

          {/* Quick Aliases / Tags */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {activeHoliday.aliases.slice(0, 5).map((alias, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                #{alias}
              </span>
            ))}
          </div>

          {/* Tabs Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginTop: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '8px',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'significance', label: 'Significance · 意义', icon: <Sparkles size={14} /> },
              { id: 'customs', label: 'To Do · 今日习俗', icon: <Compass size={14} /> },
              { id: 'foods', label: 'To Eat · 传统美食', icon: <Utensils size={14} /> },
              { id: 'facts', label: 'Fun Facts · 趣味典故', icon: <Info size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: activeTab === tab.id ? `${activeHoliday.accentColor}25` : 'transparent',
                  border: activeTab === tab.id ? `1px solid ${activeHoliday.accentColor}60` : '1px solid transparent',
                  borderRadius: '8px',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div style={{ marginTop: '14px', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
            {activeTab === 'significance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: '#fff', fontSize: '0.92rem' }}>
                  {activeHoliday.significance}
                </p>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderLeft: `3px solid ${activeHoliday.accentColor}`,
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '0.88rem',
                  }}
                >
                  <strong style={{ color: activeHoliday.accentColor, display: 'block', marginBottom: '2px', fontSize: '0.8rem' }}>
                    📖 传统文化渊源
                  </strong>
                  {activeHoliday.significanceZh}
                </div>
              </div>
            )}

            {activeTab === 'customs' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {activeHoliday.customs.map((custom, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: activeHoliday.accentColor, fontWeight: 600, fontSize: '0.85rem' }}>
                      <Compass size={14} />
                      {activeHoliday.customsZh[idx] ? activeHoliday.customsZh[idx].split('：')[0] : `Custom #${idx + 1}`}
                    </div>
                    <p style={{ color: '#fff', fontSize: '0.88rem', margin: 0 }}>
                      {custom}
                    </p>
                    {activeHoliday.customsZh[idx] && (
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                        {activeHoliday.customsZh[idx]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'foods' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {activeHoliday.foods.map((food, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: activeHoliday.accentColor, fontWeight: 600, fontSize: '0.85rem' }}>
                      <Utensils size={14} />
                      {activeHoliday.foodsZh[idx] ? activeHoliday.foodsZh[idx].split('：')[0] : `Traditional Food #${idx + 1}`}
                    </div>
                    <p style={{ color: '#fff', fontSize: '0.88rem', margin: 0 }}>
                      {food}
                    </p>
                    {activeHoliday.foodsZh[idx] && (
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0 }}>
                        {activeHoliday.foodsZh[idx]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'facts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeHoliday.funFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderLeft: `3px solid ${activeHoliday.accentColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: activeHoliday.accentColor, fontWeight: 600, fontSize: '0.82rem' }}>
                      <Sparkles size={14} />
                      {activeHoliday.funFactsZh[idx] ? activeHoliday.funFactsZh[idx].split('：')[0] : `Lore & Legend #${idx + 1}`}
                    </div>
                    <p style={{ color: '#fff', fontSize: '0.88rem', margin: 0 }}>
                      {fact}
                    </p>
                    {activeHoliday.funFactsZh[idx] && (
                      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', margin: 0 }}>
                        {activeHoliday.funFactsZh[idx]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. Today is not a holiday: Show Upcoming Holiday Teaser + Explore Button */
        <div
          className="glass-panel"
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'rgba(31, 40, 51, 0.35)',
            border: '1px solid rgba(102, 252, 241, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {upcomingHoliday ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>{upcomingHoliday.holiday.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {upcomingHoliday.holiday.isHoliday === false
                      ? '🍂 Upcoming Solar Term · 下一个节气 (24 Solar Terms)'
                      : '🏮 Upcoming Festival · 下一个传统节日'}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'rgba(102, 252, 241, 0.12)',
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                    }}
                  >
                    {upcomingHoliday.daysUntil === 1 ? 'Tomorrow · 明天' : `In ${upcomingHoliday.daysUntil} days · ${upcomingHoliday.daysUntil}天后`}
                  </span>
                </div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.98rem', marginTop: '2px' }}>
                  {upcomingHoliday.holiday.name} · {upcomingHoliday.holiday.nameEn}
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: '0.82rem', marginLeft: '8px' }}>
                    ({upcomingHoliday.holiday.lunarDateStr} · {format(upcomingHoliday.date, 'MMM d')})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏮</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                  Chinese Traditional Festivals & Solar Terms
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  Explore customs, significance, festive foods, and fun facts
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {upcomingHoliday && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenHoliday(upcomingHoliday.holiday)}
                  style={{
                    background: 'rgba(102, 252, 241, 0.1)',
                    border: '1px solid rgba(102, 252, 241, 0.3)',
                    color: 'var(--primary-color)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={13} />
                  Preview Lore · 习俗典故
                </button>
                {onSelectHolidayDate && (
                  <button
                    type="button"
                    onClick={() => onSelectHolidayDate(upcomingHoliday.date)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CalendarIcon size={13} />
                    Go to Date
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setShowAllModal(true)}
              className="btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BookOpen size={13} />
              All Festivals
            </button>
          </div>
        </div>
      )}

      {/* 3. Modal / Drawer for Exploring All Festivals */}
      {showAllModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 4000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid rgba(102, 252, 241, 0.3)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏮</span> Traditional Chinese Festivals & 24 Solar Terms · 传统节日与二十四节气锦囊
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '2px' }}>
                  Significance, customs, festive foods, and fun facts for major lunar celebrations and 24 solar terms (including non-holiday terms)
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All · 全部 (${ALL_HOLIDAYS.length})` },
                { id: 'holiday', label: `Traditional Festivals · 传统节日 (${ALL_HOLIDAYS.filter(h => h.isHoliday !== false).length})` },
                { id: 'solarTerm', label: `24 Seasons · 节气 (${ALL_HOLIDAYS.filter(h => h.type === 'solarTerm' || h.isHoliday === false).length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setModalFilter(f.id as any)}
                  style={{
                    background: modalFilter === f.id ? 'rgba(102, 252, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: modalFilter === f.id ? '1px solid rgba(102, 252, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: modalFilter === f.id ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.7)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: modalFilter === f.id ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List of Holidays Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {filteredHolidays.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleOpenHoliday(h)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${h.accentColor}30`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${h.accentColor}18`
                    e.currentTarget.style.borderColor = `${h.accentColor}80`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = `${h.accentColor}30`
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '1.6rem' }}>{h.icon}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {h.isHoliday === false ? (
                        <span style={{
                          fontSize: '0.65rem',
                          background: `${h.accentColor}20`,
                          color: h.accentColor,
                          border: `1px solid ${h.accentColor}40`,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          24 节气 (Non-Holiday)
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.65rem',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}>
                          传统节日
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: h.accentColor, fontWeight: 600 }}>
                        {h.lunarDateStr}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: 0 }}>
                      {h.name}
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                      {h.nameEn}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span>{h.foods[0] ? h.foods[0].split(':')[0] : 'Foods & Lore'}</span>
                    <ChevronRight size={14} color={h.accentColor} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Single Holiday Detail Viewer Modal */}
      {modalHoliday && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 5000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setModalHoliday(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              borderRadius: '20px',
              border: `1px solid ${modalHoliday.accentColor}60`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${modalHoliday.accentColor}25`,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '2.5rem' }}>{modalHoliday.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: `${modalHoliday.accentColor}25`,
                        color: modalHoliday.accentColor,
                        border: `1px solid ${modalHoliday.accentColor}50`,
                      }}
                    >
                      {modalHoliday.isHoliday === false
                        ? '🍂 24 Solar Terms (Non-Holiday) · 二十四节气'
                        : modalHoliday.type === 'solarTerm'
                        ? '🌿 Traditional Festival & Solar Term · 传统佳节/节气'
                        : '🏮 Traditional Holiday · 传统佳节'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      {modalHoliday.lunarDateStr} · {modalHoliday.lunarDateEng}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: '#fff', margin: '4px 0 0 0', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    {modalHoliday.name}
                    <span style={{ fontSize: '1.05rem', color: modalHoliday.accentColor, fontWeight: 500 }}>
                      {modalHoliday.nameEn}
                    </span>
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setModalHoliday(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '8px',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'significance', label: 'Significance · 意义', icon: <Sparkles size={14} /> },
                { id: 'customs', label: 'To Do · 习俗', icon: <Compass size={14} /> },
                { id: 'foods', label: 'To Eat · 美食', icon: <Utensils size={14} /> },
                { id: 'facts', label: 'Fun Facts · 典故', icon: <Info size={14} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  style={{
                    background: modalTab === tab.id ? `${modalHoliday.accentColor}25` : 'transparent',
                    border: modalTab === tab.id ? `1px solid ${modalHoliday.accentColor}60` : '1px solid transparent',
                    borderRadius: '8px',
                    color: modalTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: modalTab === tab.id ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {modalTab === 'significance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#fff', fontSize: '0.95rem' }}>{modalHoliday.significance}</p>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderLeft: `3px solid ${modalHoliday.accentColor}`,
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <strong style={{ color: modalHoliday.accentColor, display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>
                      文化渊源与象征意义
                    </strong>
                    {modalHoliday.significanceZh}
                  </div>
                </div>
              )}

              {modalTab === 'customs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {modalHoliday.customs.map((custom, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>{custom}</p>
                      {modalHoliday.customsZh[idx] && (
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                          {modalHoliday.customsZh[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'foods' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {modalHoliday.foods.map((food, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>{food}</p>
                      {modalHoliday.foodsZh[idx] && (
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                          {modalHoliday.foodsZh[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'facts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {modalHoliday.funFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderLeft: `3px solid ${modalHoliday.accentColor}`,
                      }}
                    >
                      <p style={{ color: '#fff', fontSize: '0.9rem', margin: 0 }}>{fact}</p>
                      {modalHoliday.funFactsZh[idx] && (
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
                          {modalHoliday.funFactsZh[idx]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
