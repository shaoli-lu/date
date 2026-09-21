'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loan } from '@/types/loan';
import {
  dollarsToCents,
  percentToBps,
  monthlyPayment,
  formatCents,
  formatBps,
  centsToDollars,
  bpsToPercent,
  generateAmortizationSchedule,
} from '@/lib/loanEngine';
import { format, addMonths, parseISO, isValid } from 'date-fns';

type CreateLoanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: Loan) => void;
  existingLoan?: Loan | null;
  userId: string;
};

export default function CreateLoanModal({
  isOpen,
  onClose,
  onSave,
  existingLoan,
  userId,
}: CreateLoanModalProps) {
  const [title, setTitle] = useState(existingLoan?.title || 'Family Home Loan');
  const [borrowerName, setBorrowerName] = useState(existingLoan?.borrowerName || 'Alex & Jordan Smith');
  const [lenderName, setLenderName] = useState(existingLoan?.lenderName || 'Robert & Margaret Smith');
  const [propertyAddress, setPropertyAddress] = useState(existingLoan?.propertyAddress || '742 Evergreen Terrace, Springfield, IL 62704');
  
  const [principalDollars, setPrincipalDollars] = useState(existingLoan ? centsToDollars(existingLoan.originalPrincipalCents).toString() : '440000');
  const [ratePercent, setRatePercent] = useState(existingLoan ? bpsToPercent(existingLoan.annualRateBps).toString() : '5.12');
  const [termYears, setTermYears] = useState(existingLoan ? (existingLoan.termMonths / 12).toString() : '30');
  const [fundingDate, setFundingDate] = useState(existingLoan?.fundingDate || format(new Date(), 'yyyy-MM-dd'));
  const [firstPaymentDate, setFirstPaymentDate] = useState(existingLoan?.firstPaymentDate || format(addMonths(new Date(), 1), 'yyyy-MM-01'));
  const [paymentDueDay, setPaymentDueDay] = useState(existingLoan?.paymentDueDay?.toString() || '1');
  const [graceDays, setGraceDays] = useState(existingLoan?.graceDays?.toString() || '15');
  const [noteReference, setNoteReference] = useState(existingLoan?.noteReference || `NOTE-${new Date().getFullYear()}-001`);

  // Calculation simulation mode
  const [repaymentOption, setRepaymentOption] = useState<'scheduled' | 'higher' | 'irregular'>('scheduled');
  const [customMonthlyDollars, setCustomMonthlyDollars] = useState('2600');

  // Convert inputs to numbers
  const principalCents = useMemo(() => dollarsToCents(principalDollars), [principalDollars]);
  const rateBps = useMemo(() => percentToBps(ratePercent), [ratePercent]);
  const termMonths = useMemo(() => {
    const y = parseFloat(termYears);
    return isNaN(y) || y <= 0 ? 360 : Math.round(y * 12);
  }, [termYears]);

  // Calculated required monthly payment
  const calculatedMonthlyPaymentCents = useMemo(() => {
    return monthlyPayment(principalCents, rateBps, termMonths);
  }, [principalCents, rateBps, termMonths]);

  // Preview schedule
  const previewSummary = useMemo(() => {
    const dummyLoan: Loan = {
      id: 'preview',
      title,
      borrowerName,
      lenderName,
      propertyAddress,
      originalPrincipalCents: principalCents,
      annualRateBps: rateBps,
      termMonths,
      fundingDate,
      firstPaymentDate,
      paymentFrequency: 'monthly',
      scheduledPaymentCents: calculatedMonthlyPaymentCents,
      paymentDueDay: parseInt(paymentDueDay, 10) || 1,
      graceDays: parseInt(graceDays, 10) || 15,
      prepaymentPenalty: false,
      paymentApplication: 'interest_then_principal',
      status: 'active',
    };

    return generateAmortizationSchedule(dummyLoan);
  }, [
    title,
    borrowerName,
    lenderName,
    propertyAddress,
    principalCents,
    rateBps,
    termMonths,
    fundingDate,
    firstPaymentDate,
    calculatedMonthlyPaymentCents,
    paymentDueDay,
    graceDays,
  ]);

  const handlePreloadSample = () => {
    setTitle('Family Home Mortgage');
    setBorrowerName('Alex & Jordan Smith');
    setLenderName('Robert & Margaret Smith');
    setPropertyAddress('742 Evergreen Terrace, Springfield, IL 62704');
    setPrincipalDollars('440000');
    setRatePercent('5.12');
    setTermYears('30');
    setFundingDate('2026-11-14');
    setFirstPaymentDate('2026-12-01');
    setPaymentDueDay('1');
    setGraceDays('15');
    setNoteReference('PROMISSORY-NOTE-2026-001');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const loan: Loan = {
      id: existingLoan?.id || `loan-${Date.now()}`,
      user_id: userId,
      title: title.trim() || 'Intrafamily Loan',
      borrowerName: borrowerName.trim() || 'Borrower',
      lenderName: lenderName.trim() || 'Lender',
      propertyAddress: propertyAddress.trim() || undefined,
      originalPrincipalCents: principalCents,
      annualRateBps: rateBps,
      termMonths,
      fundingDate,
      firstPaymentDate,
      paymentFrequency: 'monthly',
      scheduledPaymentCents: calculatedMonthlyPaymentCents,
      paymentDueDay: parseInt(paymentDueDay, 10) || 1,
      graceDays: parseInt(graceDays, 10) || 15,
      prepaymentPenalty: false,
      paymentApplication: 'interest_then_principal',
      status: existingLoan?.status || 'active',
      noteReference: noteReference.trim() || undefined,
      created_at: existingLoan?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(loan);
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
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          background: 'rgba(15, 23, 42, 0.95)',
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
              <span>🏦</span> {existingLoan ? 'Edit Loan Terms' : 'Create Intrafamily Loan / Mortgage'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
              Precision integer-cents financial model with legal Promissory Note tracking
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!existingLoan && (
              <button
                type="button"
                onClick={handlePreloadSample}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(102, 252, 241, 0.12)',
                  border: '1px solid rgba(102, 252, 241, 0.3)',
                  color: 'var(--primary-color)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                ⚡ Load Sample Preset ($440k @ 5.12%)
              </button>
            )}
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
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Live Preview Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(102, 252, 241, 0.1) 0%, rgba(69, 162, 158, 0.05) 100%)',
              border: '1px solid rgba(102, 252, 241, 0.25)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-color)', fontWeight: 600 }}>
              Live Financial Calculation Preview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Required Monthly P&I</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {formatCents(calculatedMonthlyPaymentCents)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Total Projected Interest</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f59e0b', marginTop: '2px' }}>
                  {formatCents(previewSummary.summary.totalInterestCents)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Estimated Payoff</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-color)', marginTop: '2px' }}>
                  {previewSummary.summary.estimatedPayoffDate || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Total Lifetime Cost</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-heading)', marginTop: '2px' }}>
                  {formatCents(previewSummary.summary.totalPaidCents)}
                </div>
              </div>
            </div>
          </div>

          {/* Loan Title & Parties */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Loan Title / Purpose</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Family Home Mortgage"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Borrower(s) Full Name</label>
              <input
                type="text"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                placeholder="e.g. Alex & Jordan Smith"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Lender(s) Full Name</label>
              <input
                type="text"
                value={lenderName}
                onChange={e => setLenderName(e.target.value)}
                placeholder="e.g. Robert & Margaret Smith"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Property Address (Optional for mortgage / note)</label>
            <input
              type="text"
              value={propertyAddress}
              onChange={e => setPropertyAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Springfield, IL"
            />
          </div>

          {/* Financial Core Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Principal Amount ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-main)' }}>$</span>
                <input
                  type="number"
                  step="any"
                  value={principalDollars}
                  onChange={e => setPrincipalDollars(e.target.value)}
                  style={{ paddingLeft: '28px' }}
                  required
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-color)', marginTop: '2px', display: 'block' }}>
                Stored: {principalCents.toLocaleString()} integer cents
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Annual Rate (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  value={ratePercent}
                  onChange={e => setRatePercent(e.target.value)}
                  placeholder="e.g. 5.12 or 0"
                  required
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-color)', marginTop: '2px', display: 'block' }}>
                Stored: {rateBps} bps ({rateBps === 0 ? '0% Zero Interest' : formatBps(rateBps)})
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                Term (Years)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="50"
                value={termYears}
                onChange={e => setTermYears(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-color)', marginTop: '2px', display: 'block' }}>
                {termMonths} monthly payments
              </span>
            </div>
          </div>

          {/* Dates & Billing Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Funding Date</label>
              <input
                type="date"
                value={fundingDate}
                onChange={e => setFundingDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>First Payment Date</label>
              <input
                type="date"
                value={firstPaymentDate}
                onChange={e => setFirstPaymentDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Payment Due Day</label>
              <input
                type="number"
                min="1"
                max="31"
                value={paymentDueDay}
                onChange={e => setPaymentDueDay(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Grace Period (Days)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={graceDays}
                onChange={e => setGraceDays(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Note / Legal Reference */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>Promissory Note / Loan ID Reference</label>
            <input
              type="text"
              value={noteReference}
              onChange={e => setNoteReference(e.target.value)}
              placeholder="e.g. NOTE-2026-001"
            />
          </div>

          {/* Repayment Strategy Choice */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-heading)' }}>Repayment Strategy</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRepaymentOption('scheduled')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: repaymentOption === 'scheduled' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: repaymentOption === 'scheduled' ? 'rgba(102, 252, 241, 0.15)' : 'transparent',
                  color: repaymentOption === 'scheduled' ? 'var(--primary-color)' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ✓ Pay Scheduled Amount ({formatCents(calculatedMonthlyPaymentCents)})
              </button>
              <button
                type="button"
                onClick={() => setRepaymentOption('higher')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: repaymentOption === 'higher' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: repaymentOption === 'higher' ? 'rgba(102, 252, 241, 0.15)' : 'transparent',
                  color: repaymentOption === 'higher' ? 'var(--primary-color)' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ⚡ Set Higher Recurring Payment
              </button>
              <button
                type="button"
                onClick={() => setRepaymentOption('irregular')}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: repaymentOption === 'irregular' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: repaymentOption === 'irregular' ? 'rgba(102, 252, 241, 0.15)' : 'transparent',
                  color: repaymentOption === 'irregular' ? 'var(--primary-color)' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                🎯 Add Irregular Extra Principal Payments
              </button>
            </div>

            {repaymentOption === 'higher' && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>Custom Monthly Target ($):</span>
                <input
                  type="number"
                  value={customMonthlyDollars}
                  onChange={e => setCustomMonthlyDollars(e.target.value)}
                  style={{ width: '140px', padding: '8px 12px' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                  +${(parseFloat(customMonthlyDollars || '0') - centsToDollars(calculatedMonthlyPaymentCents)).toFixed(2)}/mo extra principal
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
              {existingLoan ? 'Save Changes' : 'Confirm & Generate 360-Row Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
