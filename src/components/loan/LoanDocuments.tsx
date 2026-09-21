'use client';

import { useState, useRef } from 'react';
import { Loan, TaxYearSummary, AmortizationRow } from '@/types/loan';
import { formatCents, formatBps, centsToDollars } from '@/lib/loanEngine';
import { printElement } from '@/lib/printUtils';

type LoanDocumentsProps = {
  loan: Loan;
  taxSummaries: TaxYearSummary[];
  rows: AmortizationRow[];
};

export default function LoanDocuments({ loan, taxSummaries, rows }: LoanDocumentsProps) {
  const [docType, setDocType] = useState<'note' | 'mortgage' | 'satisfaction' | 'tax'>('note');
  const docSheetRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Doc selector toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setDocType('note')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: docType === 'note' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: docType === 'note' ? 'rgba(102, 252, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: docType === 'note' ? 'var(--primary-color)' : 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📜 Promissory Note
        </button>
        <button
          type="button"
          onClick={() => setDocType('mortgage')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: docType === 'mortgage' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: docType === 'mortgage' ? 'rgba(102, 252, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: docType === 'mortgage' ? 'var(--primary-color)' : 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🏡 Mortgage / Deed of Trust
        </button>
        <button
          type="button"
          onClick={() => setDocType('satisfaction')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: docType === 'satisfaction' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: docType === 'satisfaction' ? 'rgba(102, 252, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: docType === 'satisfaction' ? 'var(--primary-color)' : 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✨ Loan Satisfaction / Forgiveness
        </button>
        <button
          type="button"
          onClick={() => setDocType('tax')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: docType === 'tax' ? '1px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)',
            background: docType === 'tax' ? 'rgba(102, 252, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
            color: docType === 'tax' ? 'var(--primary-color)' : 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📑 CPA Tax Summary
        </button>

        <button
          type="button"
          onClick={() => printElement(docSheetRef.current)}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(102, 252, 241, 0.4)',
            background: 'rgba(102, 252, 241, 0.1)',
            color: 'var(--primary-color)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Document Sheet */}
      <div
        ref={docSheetRef}
        className="glass-panel"
        style={{
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          padding: '2.5rem',
          maxWidth: '850px',
          margin: '0 auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          fontFamily: 'serif',
          lineHeight: 1.7,
        }}
      >
        {docType === 'note' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em' }}>
                INTRAFAMILY PROMISSORY NOTE
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                Document Ref: {loan.noteReference || 'NOTE-2026-001'} • Principal: {formatCents(loan.originalPrincipalCents)}
              </div>
            </div>

            <p>
              <strong>FOR VALUE RECEIVED</strong>, the undersigned Borrower(s),{' '}
              <strong>{loan.borrowerName}</strong>, jointly and severally promise to pay to the order of the Lender(s),{' '}
              <strong>{loan.lenderName}</strong>, the principal sum of{' '}
              <strong>{formatCents(loan.originalPrincipalCents)}</strong>, together with interest on the unpaid principal balance at the annual rate of{' '}
              <strong>{formatBps(loan.annualRateBps)}</strong> per annum (established in accordance with the IRS Applicable Federal Rate rules).
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>1. REPAYMENT TERMS</h3>
            <p>
              This Note shall be repaid in <strong>{loan.termMonths}</strong> consecutive monthly installments of{' '}
              <strong>{formatCents(loan.scheduledPaymentCents)}</strong> each. The first installment shall be due and payable on{' '}
              <strong>{loan.firstPaymentDate}</strong>, and subsequent installments shall be due on the{' '}
              <strong>{loan.paymentDueDay}st/th</strong> day of each succeeding month until the entire principal and accrued interest are fully paid.
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>2. PAYMENT APPLICATION</h3>
            <p>
              All payments received shall be applied first to any legal late charges due, second to accrued unpaid interest, third to scheduled principal, and fourth to designated extra principal-only reductions.
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>3. PREPAYMENT PRIVILEGE</h3>
            <p>
              Borrower reserves the right to prepay this Note, in whole or in part, at any time without penalty or premium. Any extra principal payments shall directly reduce the principal balance and shorten the maturity date.
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>4. SECURED PROPERTY</h3>
            <p>
              This Note is secured by a Mortgage / Deed of Trust on the real property commonly known as:{' '}
              <em>{loan.propertyAddress || 'As referenced in attached Exhibit A'}</em>.
            </p>

            {loan.amendments && loan.amendments.length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>5. RECORDED WRITTEN AMENDMENTS</h3>
                {loan.amendments.map((a, idx) => (
                  <div key={a.id} style={{ fontSize: '0.9rem', marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                    <strong>Amendment #{idx + 1} ({a.effectiveDate}):</strong> {a.description} • New Rate: {formatBps(a.newAnnualRateBps)} (Ref: {a.docReference})
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '8px' }}></div>
                <strong>BORROWER:</strong> {loan.borrowerName}
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Date: ________________________</div>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '8px' }}></div>
                <strong>LENDER:</strong> {loan.lenderName}
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Date: ________________________</div>
              </div>
            </div>
          </div>
        )}

        {docType === 'mortgage' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
                MORTGAGE / DEED OF TRUST RECORD
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Securing Promissory Note Ref: {loan.noteReference || 'NOTE-2026-001'}
              </div>
            </div>

            <p>
              This Mortgage is entered into on <strong>{loan.fundingDate}</strong> between <strong>{loan.borrowerName}</strong> (Grantor/Borrower) and <strong>{loan.lenderName}</strong> (Grantee/Lender).
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>COLLATERAL DESCRIPTION</h3>
            <p style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong>Property Address:</strong> {loan.propertyAddress || '742 Evergreen Terrace, Springfield, IL'}<br />
              <strong>Principal Obligation Secured:</strong> {formatCents(loan.originalPrincipalCents)}<br />
              <strong>Maturity Term:</strong> {loan.termMonths} Months ({loan.termMonths / 12} Years)<br />
              <strong>Recording Reference:</strong> County Registry of Deeds (Family Mortgage Provision)
            </p>

            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: '#0f172a' }}>COVENANTS</h3>
            <p>
              Grantor covenants to maintain adequate hazard and casualty insurance on the property, pay all real estate property taxes when due, and keep the premises in good state of repair.
            </p>
          </div>
        )}

        {docType === 'satisfaction' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
                CERTIFICATE OF LOAN SATISFACTION & FORGIVENESS
              </h1>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Formal Discharge of Note Ref: {loan.noteReference || 'NOTE-2026-001'}
              </div>
            </div>

            <p>
              The undersigned Lender(s), <strong>{loan.lenderName}</strong>, hereby acknowledge and certify that the intrafamily loan obligation executed by <strong>{loan.borrowerName}</strong> on <strong>{loan.fundingDate}</strong> in the original principal amount of <strong>{formatCents(loan.originalPrincipalCents)}</strong> is hereby:
            </p>

            <div style={{ margin: '1.5rem 0', padding: '1.25rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', color: '#065f46', fontWeight: 600 }}>
              {loan.status === 'forgiven' ? (
                <>
                  ✓ FULLY FORGIVEN & DISCHARGED AS AN ESTATE GIFT / SATISFACTION<br />
                  <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>
                    Doc Ref: {loan.forgivenDocReference || 'GIFT-DEED-2026'} • Reason: {loan.forgivenReason || 'Family Gift'}
                  </span>
                </>
              ) : (
                <>✓ ELIGIBLE FOR FORMAL DISCHARGE UPON FINAL PAYMENT OR FORGIVENESS</>
              )}
            </div>

            <p>
              Lender releases any and all liens, mortgages, and encumbrances securing said obligation and directs the Recorder of Deeds to mark the record satisfied.
            </p>
          </div>
        )}

        {docType === 'tax' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>
                ANNUAL INTRAFAMILY LOAN TAX RECORD
              </h1>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600, marginTop: '4px' }}>
                ⚠️ Official Record for CPA / Tax Preparer (Form 1098 & IRS AFR Compliance Reference)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <strong>Borrower(s):</strong> {loan.borrowerName}<br />
                <strong>Lender(s):</strong> {loan.lenderName}<br />
                <strong>Property:</strong> {loan.propertyAddress || 'Primary Residence'}
              </div>
              <div>
                <strong>Original Principal:</strong> {formatCents(loan.originalPrincipalCents)}<br />
                <strong>Applicable Rate:</strong> {formatBps(loan.annualRateBps)}<br />
                <strong>First Payment:</strong> {loan.firstPaymentDate}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Tax Year</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Interest Paid</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Principal Paid</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Extra Principal</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Total Paid</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Year-End Balance</th>
                </tr>
              </thead>
              <tbody>
                {taxSummaries.map(yr => (
                  <tr key={yr.year} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{yr.year}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#b45309', fontWeight: 600 }}>
                      {formatCents(yr.totalInterestCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#047857' }}>
                      {formatCents(yr.totalPrincipalCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#0284c7' }}>
                      {formatCents(yr.totalExtraPrincipalCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                      {formatCents(yr.totalPaidCents)}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCents(yr.endingBalanceCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
              * Note: For US federal income tax purposes, if the interest rate equals or exceeds the applicable federal rate (AFR), no below-market loan rules apply. Consult your qualified CPA or tax advisor for mortgage interest deductibility rules.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
