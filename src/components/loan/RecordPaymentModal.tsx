'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loan, LoanPayment, AmortizationRow } from '@/types/loan';
import {
  dollarsToCents,
  centsToDollars,
  formatCents,
  applyPayment,
} from '@/lib/loanEngine';
import { format } from 'date-fns';

type RecordPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (payment: LoanPayment) => void;
  loan: Loan;
  selectedRow?: AmortizationRow | null;
  currentBalanceCents: number;
  userId: string;
};

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSavePayment,
  loan,
  selectedRow,
  currentBalanceCents,
  userId,
}: RecordPaymentModalProps) {
  const defaultDueDate = selectedRow?.dueDate || format(new Date(), 'yyyy-MM-01');
  const defaultScheduledCents = selectedRow?.scheduledPaymentCents ?? loan.scheduledPaymentCents;

  const [paymentNumber, setPaymentNumber] = useState<number>(selectedRow?.paymentNumber || 1);
  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [paidDate, setPaidDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [amountReceivedDollars, setAmountReceivedDollars] = useState<string>(
    centsToDollars(defaultScheduledCents).toString()
  );
  const [extraPrincipalDollars, setExtraPrincipalDollars] = useState<string>('0');
  const [lateFeeDollars, setLateFeeDollars] = useState<string>('0');
  const [memo, setMemo] = useState<string>(selectedRow?.memo || '');

  // Sync state whenever modal opens or selectedRow changes
  useEffect(() => {
    if (isOpen) {
      const num = selectedRow?.paymentNumber || 1;
      const due = selectedRow?.dueDate || format(new Date(), 'yyyy-MM-01');
      const scheduled = selectedRow?.scheduledPaymentCents ?? loan.scheduledPaymentCents;
      setPaymentNumber(num);
      setDueDate(due);
      setPaidDate(format(new Date(), 'yyyy-MM-dd'));
      setAmountReceivedDollars(centsToDollars(scheduled).toString());
      setExtraPrincipalDollars('0');
      setLateFeeDollars('0');
      setMemo(selectedRow?.memo || '');
    }
  }, [isOpen, selectedRow, loan]);

  // Prior balance at start of cycle
  const balanceBefore = selectedRow?.beginningBalanceCents ?? currentBalanceCents;
  const accruedUnpaidInterest = selectedRow?.unpaidInterestCents ?? 0;

  // Numerical conversions
  const paymentReceivedCents = useMemo(() => dollarsToCents(amountReceivedDollars), [amountReceivedDollars]);
  const extraPrincipalCents = useMemo(() => dollarsToCents(extraPrincipalDollars), [extraPrincipalDollars]);
  const lateFeeCents = useMemo(() => dollarsToCents(lateFeeDollars), [lateFeeDollars]);

  // Real-time breakdown calculation
  const breakdown = useMemo(() => {
    return applyPayment({
      balanceBeforeCents: balanceBefore,
      annualRateBps: loan.annualRateBps,
      paymentReceivedCents,
      extraPrincipalCents,
      accruedUnpaidInterestCents: accruedUnpaidInterest,
      lateFeeCents,
    });
  }, [balanceBefore, loan.annualRateBps, paymentReceivedCents, extraPrincipalCents, accruedUnpaidInterest, lateFeeCents]);

  const paymentStatus = useMemo(() => {
    if (breakdown.balanceAfterCents === 0) return 'paid';
    if (breakdown.unpaidInterestCents > 0 || paymentReceivedCents < defaultScheduledCents) {
      return 'partial';
    }
    return 'paid';
  }, [breakdown.balanceAfterCents, breakdown.unpaidInterestCents, paymentReceivedCents, defaultScheduledCents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payment: LoanPayment = {
      id: selectedRow?.paymentId || `pmt-${Date.now()}`,
      loanId: loan.id,
      user_id: userId,
      paymentNumber,
      dueDate,
      paidDate,
      scheduledPaymentCents: defaultScheduledCents,
      paymentReceivedCents,
      interestCents: breakdown.interestCents,
      scheduledPrincipalCents: breakdown.scheduledPrincipalCents,
      extraPrincipalCents: breakdown.extraPrincipalCents,
      lateFeeCents: breakdown.lateFeePaidCents,
      unpaidInterestCents: breakdown.unpaidInterestCents,
      balanceBeforeCents: balanceBefore,
      balanceAfterCents: breakdown.balanceAfterCents,
      status: paymentStatus,
      memo: memo.trim() || undefined,
    };
    onSavePayment(payment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          background: 'rgba(15, 23, 42, 0.97)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(102, 252, 241, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧾</span> Record Loan Payment
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
              Payment #{paymentNumber} • Starting Balance: {formatCents(balanceBefore)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Receipt Preview Box */}
          <div
            style={{
              background: 'rgba(11, 12, 16, 0.85)',
              border: '1px dashed rgba(102, 252, 241, 0.4)',
              borderRadius: '12px',
              padding: '1.25rem',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: '0.9rem' }}>
                RECEIPT PREVIEW
              </span>
              <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>
                {paidDate}
              </span>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              {formatCents(paymentReceivedCents)} received
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Interest Applied:</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{formatCents(breakdown.interestCents)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Scheduled Principal:</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCents(breakdown.scheduledPrincipalCents)}</span>
              </div>
              {breakdown.extraPrincipalCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Extra Principal-Only:</span>
                  <span style={{ color: '#06b6d4', fontWeight: 600 }}>{formatCents(breakdown.extraPrincipalCents)}</span>
                </div>
              )}
              {breakdown.lateFeePaidCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Late Fee Deducted:</span>
                  <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>{formatCents(breakdown.lateFeePaidCents)}</span>
                </div>
              )}
              {breakdown.unpaidInterestCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)', fontWeight: 600 }}>
                  <span>⚠️ Unpaid Interest Carried:</span>
                  <span>{formatCents(breakdown.unpaidInterestCents)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.15)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-heading)', fontWeight: 700 }}>
                <span>Remaining Balance:</span>
                <span style={{ color: 'var(--primary-color)' }}>{formatCents(breakdown.balanceAfterCents)}</span>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Total Payment Received ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-main)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={amountReceivedDollars}
                  onChange={e => setAmountReceivedDollars(e.target.value)}
                  style={{ paddingLeft: '28px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Extra Principal Designation ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-main)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={extraPrincipalDollars}
                  onChange={e => setExtraPrincipalDollars(e.target.value)}
                  style={{ paddingLeft: '28px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Optional Late Fee ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-main)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={lateFeeDollars}
                  onChange={e => setLateFeeDollars(e.target.value)}
                  style={{ paddingLeft: '28px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Payment #</label>
              <input
                type="number"
                min="1"
                value={paymentNumber}
                onChange={e => setPaymentNumber(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Actual Paid Date</label>
              <input
                type="date"
                value={paidDate}
                onChange={e => setPaidDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Memo / Transaction Note
            </label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder='e.g. "Check #1042 - Includes $500 principal-only"'
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '0.9rem' }}
            >
              ✓ Save Payment & Recalculate Schedule
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
