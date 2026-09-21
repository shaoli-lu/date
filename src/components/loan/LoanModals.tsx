'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loan, LoanPayment, LoanAmendment } from '@/types/loan';
import {
  formatCents,
  formatBps,
  percentToBps,
  bpsToPercent,
  dollarsToCents,
  centsToDollars,
} from '@/lib/loanEngine';
import { format } from 'date-fns';

/**
 * 1. Loan Forgiveness / Satisfaction Modal
 */
export function ForgiveLoanModal({
  isOpen,
  onClose,
  loan,
  currentBalanceCents,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  currentBalanceCents: number;
  onConfirm: (data: { docReference: string; reason: string; date: string }) => void;
}) {
  const [docReference, setDocReference] = useState('DEED-GIFT-FORGIVENESS-2026');
  const [reason, setReason] = useState('Annual family gift / Estate transfer / Full forgiveness');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '1.2rem', fontWeight: 700 }}>
          <span>📜</span> Mark Loan as Forgiven / Satisfied
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Record formal intrafamily loan forgiveness (such as parent death, estate gift, or loan satisfaction). The balance of{' '}
          <strong style={{ color: 'var(--text-heading)' }}>{formatCents(currentBalanceCents)}</strong> will be cleared and marked as{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Forgiven</span> rather than paid.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Legal Document / Deed / Will Reference
            </label>
            <input
              type="text"
              value={docReference}
              onChange={e => setDocReference(e.target.value)}
              placeholder="e.g. Estate Trust Ref #8901 / Gift Letter"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Forgiveness Reason / Notes
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Effective Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm({ docReference, reason, date });
              onClose();
            }}
            style={{
              padding: '8px 20px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: '#f59e0b',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Confirm Forgiveness
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 2. Versioned Written Amendment Modal
 */
export function AddAmendmentModal({
  isOpen,
  onClose,
  loan,
  onSaveAmendment,
}: {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan;
  onSaveAmendment: (amendment: LoanAmendment) => void;
}) {
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('Interest rate adjustment based on updated IRS Applicable Federal Rate (AFR)');
  const [newRatePercent, setNewRatePercent] = useState(bpsToPercent(loan.annualRateBps).toString());
  const [docReference, setDocReference] = useState(`AMEND-${loan.noteReference || 'LOAN'}-V${(loan.amendments?.length || 0) + 1}`);

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
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid var(--primary-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 700 }}>
          <span>📝</span> Record Written Loan Amendment
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.5rem' }}>
          Creates an official versioned modification record without overwriting previous loan terms.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Amendment Document Reference
            </label>
            <input
              type="text"
              value={docReference}
              onChange={e => setDocReference(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Updated Annual Rate (% / AFR)
            </label>
            <input
              type="number"
              step="0.01"
              value={newRatePercent}
              onChange={e => setNewRatePercent(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', marginTop: '2px', display: 'block' }}>
              Prior Rate: {formatBps(loan.annualRateBps)} → New Rate: {formatBps(percentToBps(newRatePercent))}
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '4px' }}>
              Terms / Amendment Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const amendment: LoanAmendment = {
                id: `amend-${Date.now()}`,
                loanId: loan.id,
                effectiveDate,
                description,
                previousAnnualRateBps: loan.annualRateBps,
                newAnnualRateBps: percentToBps(newRatePercent),
                docReference,
                createdAt: new Date().toISOString(),
              };
              onSaveAmendment(amendment);
              onClose();
            }}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Save Amendment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 3. Printable Receipt Modal
 */
export function ReceiptSlipModal({
  isOpen,
  onClose,
  payment,
  loan,
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: LoanPayment | null;
  loan: Loan;
}) {
  if (!isOpen || !payment) return null;

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
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '2rem',
          background: '#0f172a',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          color: '#e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255, 255, 255, 0.2)', paddingBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧾</span>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '4px 0 2px' }}>
            OFFICIAL PAYMENT RECEIPT
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-color)' }}>
            {loan.title} • {loan.noteReference || 'Promissory Note'}
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Receipt ID:</span>
            <span style={{ color: '#fff' }}>{payment.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Date:</span>
            <span style={{ color: '#fff' }}>{payment.paidDate || payment.dueDate}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Borrower:</span>
            <span style={{ color: '#fff' }}>{loan.borrowerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Lender:</span>
            <span style={{ color: '#fff' }}>{loan.lenderName}</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              <span>Total Received:</span>
              <span style={{ color: 'var(--primary-color)' }}>{formatCents(payment.paymentReceivedCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
              <span>• Interest Paid:</span>
              <span>{formatCents(payment.interestCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
              <span>• Scheduled Principal:</span>
              <span>{formatCents(payment.scheduledPrincipalCents)}</span>
            </div>
            {payment.extraPrincipalCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4' }}>
                <span>• Extra Principal:</span>
                <span>{formatCents(payment.extraPrincipalCents)}</span>
              </div>
            )}
            {payment.lateFeeCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)' }}>
                <span>• Late Fee:</span>
                <span>{formatCents(payment.lateFeeCents)}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.2)', marginTop: '8px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Balance Before:</span>
              <span>{formatCents(payment.balanceBeforeCents)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#fff' }}>
              <span>Remaining Balance:</span>
              <span style={{ color: 'var(--primary-color)' }}>{formatCents(payment.balanceAfterCents)}</span>
            </div>
          </div>

          {payment.memo && (
            <div style={{ marginTop: '8px', fontStyle: 'italic', color: '#94a3b8', fontSize: '0.8rem' }}>
              Memo: {payment.memo}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'transparent',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            🖨️ Print Slip
          </button>
          <button type="button" onClick={onClose} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
