'use client';

import { useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loan,
  LoanPayment,
  AmortizationRow,
  LoanAmendment,
} from '@/types/loan';
import {
  formatCents,
  formatBps,
  centsToDollars,
  generateAmortizationSchedule,
  calculateTaxSummary,
  calculateWhatIf,
} from '@/lib/loanEngine';
import {
  fetchLoans,
  saveLoan,
  deleteLoan,
  fetchPayments,
  savePayment,
  deletePayment,
  getSampleLoan,
} from '@/lib/loanStorage';
import CreateLoanModal from '../loan/CreateLoanModal';
import RecordPaymentModal from '../loan/RecordPaymentModal';
import {
  ForgiveLoanModal,
  AddAmendmentModal,
  ReceiptSlipModal,
} from '../loan/LoanModals';
import LoanDocuments from '../loan/LoanDocuments';

type LoanSubTab = 'dashboard' | 'amortization' | 'ledger' | 'simulator' | 'documents' | 'tax' | 'settings';

export default function LoanView({ session }: { session: Session }) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<LoanSubTab>('dashboard');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedRowForPayment, setSelectedRowForPayment] = useState<AmortizationRow | null>(null);
  const [isForgiveModalOpen, setIsForgiveModalOpen] = useState(false);
  const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<LoanPayment | null>(null);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Amortization table filter / pagination
  const [searchYear, setSearchYear] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Simulator custom amount state
  const [customSimulatorAmount, setCustomSimulatorAmount] = useState<number>(3000);

  // 1. Fetch loans on load
  const loadLoans = async () => {
    setLoading(true);
    const data = await fetchLoans(session.user?.id);
    if (data.length === 0) {
      const sample = getSampleLoan(session.user?.id);
      await saveLoan(sample);
      setLoans([sample]);
      setSelectedLoanId(sample.id);
    } else {
      setLoans(data);
      if (!selectedLoanId || !data.some(l => l.id === selectedLoanId)) {
        setSelectedLoanId(data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLoans();
  }, [session.user?.id]);

  // Active Loan
  const activeLoan = useMemo(() => {
    return loans.find(l => l.id === selectedLoanId) || loans[0] || null;
  }, [loans, selectedLoanId]);

  // 2. Fetch payments when active loan changes
  const loadPayments = async () => {
    if (!activeLoan) return;
    const p = await fetchPayments(activeLoan.id);
    setPayments(p);
  };

  useEffect(() => {
    if (activeLoan) {
      loadPayments();
    }
  }, [activeLoan?.id]);

  // 3. Dynamic Amortization Schedule calculation
  const { rows, summary } = useMemo(() => {
    if (!activeLoan) {
      return { rows: [], summary: null };
    }
    return generateAmortizationSchedule(activeLoan, payments);
  }, [activeLoan, payments]);

  // 4. Tax Summary
  const taxSummaries = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return calculateTaxSummary(rows);
  }, [rows]);

  // 5. What-If comparison matrix
  const whatIfComparisons = useMemo(() => {
    if (!activeLoan) return [];
    const base = activeLoan.scheduledPaymentCents;
    const baseDollars = Math.round(centsToDollars(base));
    const presets = [
      { label: `+$165/mo (${formatCents(base + 16500)})`, amountCents: base + 16500 },
      { label: '$2,559/mo (Accelerated)', amountCents: 255900 },
      { label: '$3,000/mo (High Paydown)', amountCents: 300000 },
      { label: '$4,000/mo (Aggressive)', amountCents: 400000 },
    ];
    if (customSimulatorAmount > 0 && !presets.some(p => p.amountCents === customSimulatorAmount * 100)) {
      presets.push({
        label: `Custom ($${customSimulatorAmount}/mo)`,
        amountCents: customSimulatorAmount * 100,
      });
    }
    return calculateWhatIf(activeLoan, presets);
  }, [activeLoan, customSimulatorAmount]);

  // Filtered rows for Amortization table
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const year = r.dueDate.substring(0, 4);
      if (searchYear !== 'all' && year !== searchYear) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, searchYear, statusFilter]);

  // List of distinct years in schedule
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => set.add(r.dueDate.substring(0, 4)));
    return Array.from(set).sort();
  }, [rows]);

  // Handlers
  const handleSaveLoan = async (loan: Loan) => {
    const saved = await saveLoan(loan);
    setLoans(prev => {
      const idx = prev.findIndex(l => l.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setSelectedLoanId(saved.id);
    setIsCreateModalOpen(false);
    setEditingLoan(null);
  };

  const handleDeleteActiveLoan = async () => {
    if (!activeLoan) return;
    if (window.confirm(`Are you sure you want to delete "${activeLoan.title}"?`)) {
      await deleteLoan(activeLoan.id);
      const remaining = loans.filter(l => l.id !== activeLoan.id);
      setLoans(remaining);
      setSelectedLoanId(remaining[0]?.id || null);
    }
  };

  const handleSavePayment = async (payment: LoanPayment) => {
    const saved = await savePayment(payment);
    setPayments(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setReceiptPayment(saved);
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!activeLoan) return;
    if (window.confirm('Delete this recorded payment? The amortization schedule will recalculate.')) {
      await deletePayment(paymentId, activeLoan.id);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    }
  };

  const handleForgiveLoan = async ({ docReference, reason, date }: { docReference: string; reason: string; date: string }) => {
    if (!activeLoan) return;
    const updated: Loan = {
      ...activeLoan,
      status: 'forgiven',
      forgivenDate: date,
      forgivenDocReference: docReference,
      forgivenReason: reason,
    };
    await handleSaveLoan(updated);
  };

  const handleSaveAmendment = async (amendment: LoanAmendment) => {
    if (!activeLoan) return;
    const updated: Loan = {
      ...activeLoan,
      annualRateBps: amendment.newAnnualRateBps || activeLoan.annualRateBps,
      amendments: [...(activeLoan.amendments || []), amendment],
    };
    await handleSaveLoan(updated);
  };

  const exportAmortizationCSV = () => {
    if (!rows || rows.length === 0) return;
    const headers = ['Payment #', 'Due Date', 'Beginning Balance', 'Scheduled Payment', 'Interest', 'Principal', 'Extra Principal', 'Ending Balance', 'Status', 'Paid Date'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        r.paymentNumber,
        r.dueDate,
        (r.beginningBalanceCents / 100).toFixed(2),
        (r.scheduledPaymentCents / 100).toFixed(2),
        (r.interestCents / 100).toFixed(2),
        (r.principalCents / 100).toFixed(2),
        (r.extraPrincipalCents / 100).toFixed(2),
        (r.endingBalanceCents / 100).toFixed(2),
        r.status,
        r.actualPaidDate || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeLoan?.title || 'loan'}_amortization_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
        Loading Loan System...
      </div>
    );
  }

  if (!activeLoan) {
    return (
      <div style={{ display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>🏦</div>
        <h2>No Active Intrafamily Loan</h2>
        <p style={{ color: 'var(--text-main)', textAlign: 'center', maxWidth: '400px' }}>
          Create a precision intrafamily mortgage or load the default $440k sample loan.
        </p>
        <button type="button" onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
          + Create First Loan
        </button>
      </div>
    );
  }

  return (
    <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
      {/* Sticky Top Header & Sub-Navigation Bar */}
      <div
        style={{
          position: 'sticky',
          top: '-20px',
          zIndex: 40,
          background: 'rgba(11, 12, 16, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          margin: '-20px -20px 0 -20px',
          padding: '14px 20px 10px 20px',
          borderBottom: '1px solid rgba(102, 252, 241, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Loan Title & Details Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', paddingRight: '50px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(102,252,241,0.2) 0%, rgba(69,162,158,0.2) 100%)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            🏦
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title & Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={activeLoan.id}
                onChange={e => setSelectedLoanId(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(102, 252, 241, 0.3)',
                  color: 'var(--text-heading)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  maxWidth: '100%',
                }}
              >
                {loans.map(l => (
                  <option key={l.id} value={l.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {l.title} ({formatCents(l.originalPrincipalCents)})
                  </option>
                ))}
              </select>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '2px 7px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background:
                    activeLoan.status === 'active'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : activeLoan.status === 'forgiven'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(102, 252, 241, 0.2)',
                  color:
                    activeLoan.status === 'active'
                      ? '#10b981'
                      : activeLoan.status === 'forgiven'
                      ? '#f59e0b'
                      : 'var(--primary-color)',
                  border: '1px solid currentColor',
                }}
              >
                {activeLoan.status}
              </span>
            </div>
            {/* Borrower & Lender Row */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.4, wordBreak: 'break-word' }}>
              Borrower: <strong style={{ color: '#fff' }}>{activeLoan.borrowerName}</strong> &nbsp;•&nbsp; Lender: <strong style={{ color: '#fff' }}>{activeLoan.lenderName}</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons Row - Below Borrower Row */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setSelectedRowForPayment(null);
              setIsRecordModalOpen(true);
            }}
            className="btn-primary"
            style={{ padding: '7px 18px', fontSize: '0.85rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            💰 Record Payment
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingLoan(null);
              setIsCreateModalOpen(true);
            }}
            className="btn-secondary"
            style={{ padding: '7px 18px', fontSize: '0.85rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            + New Loan
          </button>
        </div>

        {/* Sub-Navigation Tabs Row */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '2px',
            paddingRight: '56px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'amortization', label: '📅 Amortization (360)' },
            { id: 'ledger', label: `🧾 Ledger (${payments.length})` },
            { id: 'simulator', label: '🚀 What-If Simulator' },
            { id: 'documents', label: '📜 Legal Note & Docs' },
            { id: 'tax', label: '📑 CPA Tax View' },
            { id: 'settings', label: '⚙️ Settings' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as LoanSubTab)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: subTab === t.id ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: subTab === t.id ? 'var(--primary-color)' : 'rgba(31, 40, 51, 0.7)',
                color: subTab === t.id ? '#0b0c10' : 'var(--text-main)',
                fontWeight: subTab === t.id ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-VIEW 1: DASHBOARD */}
      {subTab === 'dashboard' && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Key KPI Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Current Balance */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Remaining Principal Balance
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '4px' }}>
                {formatCents(summary.currentBalanceCents)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', marginTop: '4px' }}>
                Original: {formatCents(activeLoan.originalPrincipalCents)}
              </div>
            </div>

            {/* Next Payment */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Next Payment Due
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {formatCents(summary.nextPaymentAmountCents)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '4px' }}>
                Due on {summary.nextPaymentDueDate || activeLoan.firstPaymentDate}
              </div>
            </div>

            {/* Interest Rate & Term */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Interest Rate & Term
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#60a5fa', marginTop: '4px' }}>
                {formatBps(activeLoan.annualRateBps)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', marginTop: '4px' }}>
                {activeLoan.termMonths / 12} Years ({activeLoan.termMonths} Months)
              </div>
            </div>

            {/* Estimated Payoff */}
            <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Projected Payoff Date
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                {summary.estimatedPayoffDate}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                {summary.monthsSaved > 0 ? `🚀 ${summary.monthsSaved} months saved!` : `${summary.monthsToPayoff} payments total`}
              </div>
            </div>
          </div>

          {/* Loan Repayment Progress Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                Principal Paid Down: {summary.progressPercent.toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                {formatCents(activeLoan.originalPrincipalCents - summary.currentBalanceCents)} of {formatCents(activeLoan.originalPrincipalCents)}
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${summary.progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--secondary-color) 0%, var(--primary-color) 100%)',
                  boxShadow: '0 0 10px rgba(102, 252, 241, 0.5)',
                }}
              />
            </div>
          </div>

          {/* Interest vs Principal Breakdown Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Historical Actual Payments */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💵</span> Actual Payments To Date
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Total Cash Paid:</span>
                  <strong style={{ color: '#fff' }}>{formatCents(summary.totalActualPaidCents)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Principal Reduction:</span>
                  <strong style={{ color: '#10b981' }}>{formatCents(summary.totalActualPrincipalPaidCents)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Interest Paid to Family:</span>
                  <strong style={{ color: '#f59e0b' }}>{formatCents(summary.totalActualInterestPaidCents)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--text-main)' }}>Payments Recorded:</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{payments.length}</strong>
                </div>
              </div>
            </div>

            {/* Full Lifetime Projection */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📈</span> Full Lifetime Projection
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Original Principal:</span>
                  <strong style={{ color: '#fff' }}>{formatCents(activeLoan.originalPrincipalCents)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Total Projected Interest:</span>
                  <strong style={{ color: '#f59e0b' }}>{formatCents(summary.totalInterestCents)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-main)' }}>Total Loan Cost:</span>
                  <strong style={{ color: 'var(--primary-color)' }}>{formatCents(summary.totalPaidCents)}</strong>
                </div>
                {summary.interestSavedCents > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', color: '#10b981' }}>
                    <span>Total Interest Saved:</span>
                    <strong>{formatCents(summary.interestSavedCents)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: AMORTIZATION SCHEDULE */}
      {subTab === 'amortization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Table Controls */}
          <div
            className="glass-panel"
            style={{
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Filter Year:</span>
                <select
                  value={searchYear}
                  onChange={e => setSearchYear(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="all">All Years</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="partial">Partial</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={exportAmortizationCSV}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--secondary-color)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '10px 8px' }}>Start Balance</th>
                  <th style={{ padding: '10px 8px' }}>Payment</th>
                  <th style={{ padding: '10px 8px' }}>Interest</th>
                  <th style={{ padding: '10px 8px' }}>Principal</th>
                  <th style={{ padding: '10px 8px' }}>Extra Princ.</th>
                  <th style={{ padding: '10px 8px' }}>End Balance</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => (
                  <tr
                    key={row.paymentNumber}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: row.isActualPayment ? 'rgba(102, 252, 241, 0.04)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-main)' }}>
                      {row.paymentNumber}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {row.dueDate}
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-main)' }}>
                      {formatCents(row.beginningBalanceCents)}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 600, color: 'var(--text-heading)' }}>
                      {formatCents(row.isActualPayment ? row.paymentReceivedCents : row.scheduledPaymentCents)}
                    </td>
                    <td style={{ padding: '8px', color: '#f59e0b' }}>
                      {formatCents(row.interestCents)}
                    </td>
                    <td style={{ padding: '8px', color: '#10b981' }}>
                      {formatCents(row.principalCents)}
                    </td>
                    <td style={{ padding: '8px', color: '#06b6d4' }}>
                      {row.extraPrincipalCents > 0 ? formatCents(row.extraPrincipalCents) : '—'}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      {formatCents(row.endingBalanceCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background:
                            row.status === 'paid'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : row.status === 'partial'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(255, 255, 255, 0.06)',
                          color:
                            row.status === 'paid'
                              ? '#10b981'
                              : row.status === 'partial'
                              ? '#f59e0b'
                              : 'var(--text-main)',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {row.isActualPayment ? (
                        <button
                          type="button"
                          onClick={() => {
                            const p = payments.find(p => p.id === row.paymentId);
                            if (p) setReceiptPayment(p);
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(102, 252, 241, 0.15)',
                            border: '1px solid rgba(102, 252, 241, 0.3)',
                            color: 'var(--primary-color)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Receipt
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRowForPayment(row);
                            setIsRecordModalOpen(true);
                          }}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#fff',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Record
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: PAYMENT LEDGER */}
      {subTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)' }}>
              Actual Recorded Payment Ledger ({payments.length})
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedRowForPayment(null);
                setIsRecordModalOpen(true);
              }}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              + Record Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-main)' }}>
              No payments recorded yet. Click <strong>Record Payment</strong> to log the first transaction.
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--secondary-color)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Paid Date</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Interest</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Principal</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Extra Princ.</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Balance After</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left' }}>Memo</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#fff' }}>
                        {p.paidDate || p.dueDate}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {formatCents(p.paymentReceivedCents)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#f59e0b' }}>
                        {formatCents(p.interestCents)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#10b981' }}>
                        {formatCents(p.scheduledPrincipalCents)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: '#06b6d4' }}>
                        {p.extraPrincipalCents > 0 ? formatCents(p.extraPrincipalCents) : '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCents(p.balanceAfterCents)}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-main)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        {p.memo || '—'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setReceiptPayment(p)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(102, 252, 241, 0.15)',
                              border: '1px solid rgba(102, 252, 241, 0.3)',
                              color: 'var(--primary-color)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            Slip
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(p.id)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 4: WHAT-IF SIMULATOR */}
      {subTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> Accelerated Payoff & Interest Savings Simulator
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
              Compare your required scheduled payment of{' '}
              <strong style={{ color: 'var(--primary-color)' }}>{formatCents(activeLoan.scheduledPaymentCents)}/mo</strong> against accelerated payment strategies.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Custom Monthly Budget ($):</span>
              <input
                type="number"
                step="50"
                value={customSimulatorAmount}
                onChange={e => setCustomSimulatorAmount(parseFloat(e.target.value) || 0)}
                style={{ width: '150px', padding: '8px 12px' }}
              />
            </div>
          </div>

          {/* Comparison Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {whatIfComparisons.map((c, idx) => {
              const isBaseline = idx === 0;
              return (
                <div
                  key={c.label}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    border: isBaseline ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(16, 185, 129, 0.4)',
                    background: isBaseline ? 'rgba(31, 40, 51, 0.4)' : 'rgba(16, 185, 129, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isBaseline ? 'var(--text-main)' : '#10b981', textTransform: 'uppercase' }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: '6px 0' }}>
                    {formatCents(c.monthlyPaymentCents)}/mo
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-main)' }}>Payoff Date:</span>
                      <strong>{c.estimatedPayoffDate}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-main)' }}>Time to Pay Off:</span>
                      <strong>{(c.monthsToPayoff / 12).toFixed(1)} yrs ({c.monthsToPayoff} mos)</strong>
                    </div>
                    {!isBaseline && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 700 }}>
                        <span>Time Saved:</span>
                        <span>🚀 {c.monthsSaved} months ({(c.monthsSaved / 12).toFixed(1)} yrs)</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-main)' }}>Total Interest:</span>
                      <span style={{ color: '#f59e0b' }}>{formatCents(c.totalInterestCents)}</span>
                    </div>
                    {!isBaseline && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary-color)', fontWeight: 700 }}>
                        <span>Interest Saved:</span>
                        <span>💰 {formatCents(c.interestSavedCents)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: LEGAL DOCUMENTS & PROMISSORY NOTE */}
      {subTab === 'documents' && (
        <LoanDocuments loan={activeLoan} taxSummaries={taxSummaries} rows={rows} />
      )}

      {/* SUB-VIEW 6: CPA TAX SUMMARY */}
      {subTab === 'tax' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📑</span> Annual Tax Year Interest & Principal Summary
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
              Official record for your CPA or tax preparer. Tracks annual deductible interest paid and principal amortized under IRS Applicable Federal Rate (AFR) rules.
            </p>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--secondary-color)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left' }}>Tax Year</th>
                  <th style={{ padding: '10px 8px' }}>Interest Paid</th>
                  <th style={{ padding: '10px 8px' }}>Principal Paid</th>
                  <th style={{ padding: '10px 8px' }}>Extra Principal</th>
                  <th style={{ padding: '10px 8px' }}>Total Cash Paid</th>
                  <th style={{ padding: '10px 8px' }}>Ending Balance</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Payments</th>
                </tr>
              </thead>
              <tbody>
                {taxSummaries.map(t => (
                  <tr key={t.year} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', textAlign: 'left', fontWeight: 700, color: '#fff' }}>
                      {t.year}
                    </td>
                    <td style={{ padding: '8px', color: '#f59e0b', fontWeight: 600 }}>
                      {formatCents(t.totalInterestCents)}
                    </td>
                    <td style={{ padding: '8px', color: '#10b981' }}>
                      {formatCents(t.totalPrincipalCents)}
                    </td>
                    <td style={{ padding: '8px', color: '#06b6d4' }}>
                      {t.totalExtraPrincipalCents > 0 ? formatCents(t.totalExtraPrincipalCents) : '—'}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 600, color: '#fff' }}>
                      {formatCents(t.totalPaidCents)}
                    </td>
                    <td style={{ padding: '8px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      {formatCents(t.endingBalanceCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-main)' }}>
                      {t.paymentCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: AMENDMENTS & SETTINGS */}
      {subTab === 'settings' && summary && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Loan Modifications / Amendments */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>Written Loan Amendments</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  Record versioned adjustments to interest rate (AFR update) or loan terms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAmendmentModalOpen(true)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                + Add Amendment
              </button>
            </div>

            {(!activeLoan.amendments || activeLoan.amendments.length === 0) ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                No amendments recorded. Original terms in effect.
              </div>
            ) : (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeLoan.amendments.map((a, idx) => (
                  <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--primary-color)', fontSize: '0.85rem' }}>
                      <span>Amendment #{idx + 1} ({a.docReference})</span>
                      <span>Effective: {a.effectiveDate}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '4px' }}>
                      {a.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Loan Forgiveness & Satisfaction */}
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1rem', color: '#f59e0b' }}>Loan Forgiveness / Parent Death / Satisfaction</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px' }}>
              Mark the balance as formally forgiven (estate gift / death / family agreement) and issue a release certificate.
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsForgiveModalOpen(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📜 Execute Loan Forgiveness
              </button>
            </div>
          </div>

          {/* Edit Loan Terms or Delete */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-heading)' }}>Loan Administration</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingLoan(activeLoan);
                  setIsCreateModalOpen(true);
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                ✏️ Edit Core Terms
              </button>
              <button
                type="button"
                onClick={handleDeleteActiveLoan}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--danger-color)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--danger-color)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🗑️ Delete Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateLoanModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingLoan(null);
        }}
        onSave={handleSaveLoan}
        existingLoan={editingLoan}
        userId={session.user?.id || 'demo-user'}
      />

      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setSelectedRowForPayment(null);
        }}
        onSavePayment={handleSavePayment}
        loan={activeLoan}
        selectedRow={selectedRowForPayment}
        currentBalanceCents={summary ? summary.currentBalanceCents : activeLoan.originalPrincipalCents}
        userId={session.user?.id || 'demo-user'}
      />

      <ForgiveLoanModal
        isOpen={isForgiveModalOpen}
        onClose={() => setIsForgiveModalOpen(false)}
        loan={activeLoan}
        currentBalanceCents={summary ? summary.currentBalanceCents : activeLoan.originalPrincipalCents}
        onConfirm={handleForgiveLoan}
      />

      <AddAmendmentModal
        isOpen={isAmendmentModalOpen}
        onClose={() => setIsAmendmentModalOpen(false)}
        loan={activeLoan}
        onSaveAmendment={handleSaveAmendment}
      />

      <ReceiptSlipModal
        isOpen={!!receiptPayment}
        onClose={() => setReceiptPayment(null)}
        payment={receiptPayment}
        loan={activeLoan}
      />
    </div>
  );
}
