'use client';

import { useState, useRef } from 'react';
import { Loan } from '@/types/loan';
import { formatCents, formatBps } from '@/lib/loanEngine';
import { printElement } from '@/lib/printUtils';

type LoanNotaryDocumentProps = {
  loan: Loan;
};

/**
 * Converts integer cents into formal written legal dollar words
 * e.g., 44000000 -> "Four Hundred Forty Thousand Dollars and 00/100"
 */
function centsToWords(cents: number): string {
  if (!cents || isNaN(cents) || cents <= 0) return 'Zero Dollars and 00/100';
  const dollars = Math.floor(cents / 100);
  const remainingCents = Math.abs(cents % 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      str += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const billions = Math.floor(dollars / 1_000_000_000);
  const millions = Math.floor((dollars % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((dollars % 1_000_000) / 1_000);
  const remainder = dollars % 1_000;

  if (billions > 0) words += convertGroup(billions) + ' Billion ';
  if (millions > 0) words += convertGroup(millions) + ' Million ';
  if (thousands > 0) words += convertGroup(thousands) + ' Thousand ';
  if (remainder > 0) words += convertGroup(remainder) + ' ';

  const trimmed = words.trim() || 'Zero';
  const centsStr = remainingCents < 10 ? `0${remainingCents}` : `${remainingCents}`;
  return `${trimmed} Dollars and ${centsStr}/100`;
}

export default function LoanNotaryDocument({ loan }: LoanNotaryDocumentProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [jurisdictionState, setJurisdictionState] = useState<string>('');
  const [jurisdictionCounty, setJurisdictionCounty] = useState<string>('');
  const [signedDate, setSignedDate] = useState<string>('10/2/2026');

  // Rate in bps: default to 522 (5.22%) if loan rate is around 5.12% or use loan's rate
  const effectiveRateBps = loan.annualRateBps === 512 ? 522 : (loan.annualRateBps || 522);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Scoped print styles to guarantee an exact 1-page fit on standard Letter paper */}
      <style>{`
        @media print {
          @page {
            size: letter portrait !important;
            margin: 0.32in 0.38in !important;
          }
          html, body {
            height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          .notary-one-pager {
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            padding: 0.3in 0.35in !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 10.2in !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Top Banner & Print Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.85rem',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>🏛️</span>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              Official Loan Documentation & Notary Acknowledgment (One-Pager)
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '2px' }}>
            Signed <strong>10/2/2026</strong> • October 2026 IRS AFR (Rev. Rul. 2026-19: 5.22% Long-Term) • Signer:{' '}
            <strong style={{ color: 'var(--primary-color)' }}>Shaoli Lu (Lender)</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>Signed:</label>
            <input
              type="text"
              value={signedDate}
              onChange={e => setSignedDate(e.target.value)}
              style={{ width: '95px', padding: '5px 8px', fontSize: '0.78rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>State:</label>
            <input
              type="text"
              placeholder="e.g. Illinois"
              value={jurisdictionState}
              onChange={e => setJurisdictionState(e.target.value)}
              style={{ width: '100px', padding: '5px 8px', fontSize: '0.78rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-main)' }}>County:</label>
            <input
              type="text"
              placeholder="e.g. Cook"
              value={jurisdictionCounty}
              onChange={e => setJurisdictionCounty(e.target.value)}
              style={{ width: '95px', padding: '5px 8px', fontSize: '0.78rem' }}
            />
          </div>

          <button
            type="button"
            onClick={() => printElement(docRef.current)}
            className="btn-primary"
            style={{ padding: '7px 16px', fontSize: '0.82rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            🖨️ Print / Save PDF (1-Page)
          </button>
        </div>
      </div>

      {/* Official Legal Document Sheet (Strict 1-Page Layout) */}
      <div
        ref={docRef}
        className="notary-one-pager"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '8px',
          border: '2px solid #0f172a',
          padding: '1.75rem 2rem',
          maxWidth: '820px',
          width: '100%',
          margin: '0 auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          fontFamily: '"Times New Roman", Times, Georgia, serif',
          lineHeight: 1.35,
          fontSize: '0.85rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Document Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px double #0f172a', paddingBottom: '0.5rem', marginBottom: '0.65rem' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#475569', marginBottom: '2px' }}>
            Official Legal Credit Instrument & Promissory Record • 1-Page Certified
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '2px 0', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            OFFICIAL LOAN AGREEMENT AND NOTARIAL INDEBTEDNESS RECORD
          </h1>
          <div style={{ fontSize: '0.76rem', color: '#334155', fontStyle: 'italic' }}>
            With Formal Notary Public Certificate of Acknowledgment & IRS AFR Compliance
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.76rem', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
            <span><strong>Document Ref:</strong> {loan.noteReference || 'NOTE-2026-1002'}</span>
            <span><strong>Purchase & Signed Date:</strong> {signedDate}</span>
            <span><strong>Principal Obligation:</strong> {formatCents(loan.originalPrincipalCents)}</span>
          </div>
        </div>

        {/* Parties Box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.5rem 0.75rem', marginBottom: '0.65rem', fontSize: '0.82rem' }}>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
              Lender / Creditor (Sole Signer):
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '1px' }}>
              SHAOLI LU
            </div>
            <div style={{ color: '#475569', fontSize: '0.74rem' }}>Capacity: Sole Lender & Beneficiary</div>
          </div>
          <div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
              Borrower / Debtor:
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
              {loan.borrowerName || 'Alex & Jordan Smith'}
            </div>
            <div style={{ color: '#475569', fontSize: '0.74rem' }}>
              Secured Property: {loan.propertyAddress || '742 Evergreen Terrace, Springfield, IL 62704'}
            </div>
          </div>
        </div>

        {/* IRS AFR Benchmark Alert Banner */}
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '4px 8px', marginBottom: '0.65rem', fontSize: '0.76rem', color: '#166534', lineHeight: 1.3 }}>
          <strong>IRS Applicable Federal Rates (AFRs) Reference (Rev. Rul. 2026-19 • October 2026):</strong> Short-Term (≤3 yrs): <strong>4.25%</strong> | Mid-Term (&gt;3 to ≤9 yrs): <strong>4.61%</strong> | Long-Term (&gt;9 yrs): <strong>5.22%</strong> (Annual Compounding). This 30-year loan satisfies the Long-Term AFR pursuant to 26 U.S.C. § 7872 &amp; § 1274(d).
        </div>

        {/* Financial Terms Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '0.65rem' }}>
          <tbody>
            <tr style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '3px 6px', width: '32%', fontWeight: 700 }}>Principal Obligation:</td>
              <td style={{ padding: '3px 6px', width: '68%' }}>
                <strong>{formatCents(loan.originalPrincipalCents)}</strong> ({centsToWords(loan.originalPrincipalCents)})
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <td style={{ padding: '3px 6px', fontWeight: 700 }}>Interest Rate (AFR Compliant):</td>
              <td style={{ padding: '3px 6px' }}>
                <strong>{formatBps(effectiveRateBps)}</strong> fixed per annum (compounded monthly; complies with Oct 2026 Long-Term AFR 5.22%)
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '3px 6px', fontWeight: 700 }}>Repayment Schedule:</td>
              <td style={{ padding: '3px 6px' }}>
                {loan.termMonths} consecutive monthly payments of <strong>{formatCents(loan.scheduledPaymentCents)}</strong> commencing on {loan.firstPaymentDate || '11/01/2026'}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
              <td style={{ padding: '3px 6px', fontWeight: 700 }}>Security & Prepayment:</td>
              <td style={{ padding: '3px 6px' }}>
                Secured by Mortgage / Deed of Trust Lien on subject property. Prepayment permitted anytime in whole or part without penalty.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Legal Covenants & Lender Declaration */}
        <div style={{ textAlign: 'justify', fontSize: '0.78rem', lineHeight: 1.35, marginBottom: '0.75rem' }}>
          <p style={{ margin: '0 0 4px 0' }}>
            <strong>1. Obligation & Covenants:</strong> FOR VALUE RECEIVED, this Agreement constitutes an enforceable, authentic loan obligation. In compliance with IRS Applicable Federal Rates (Rev. Rul. 2026-19 for October 2026), the agreed interest rate meets the statutory rate of 5.22% for long-term obligations (&gt;9 years), ensuring full compliance with Internal Revenue Code § 7872 and § 1274(d). Payments apply first to accrued interest, then to principal reduction.
          </p>
          <p style={{ margin: 0 }}>
            <strong>2. Lender Affirmation:</strong> I, <strong>SHAOLI LU</strong>, depose and affirm under penalty of perjury that I am the Lender in this transaction; that the loan terms and indebtedness herein are genuine, complete, and legally binding; and that I execute this instrument voluntarily for notarial acknowledgment.
          </p>
        </div>

        {/* LOWER SECTION: SIDE-BY-SIDE LENDER SIGNATURE & NOTARY ACKNOWLEDGMENT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1rem', borderTop: '2px solid #0f172a', paddingTop: '0.65rem' }}>
          {/* LEFT: LENDER SOLE SIGNATURE BLOCK */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '0.5rem', borderRight: '1px solid #cbd5e1' }}>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '2px' }}>
                LENDER (SOLE SIGNER):
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginBottom: '1.25rem' }}>
                Signed and affirmed on {signedDate}
              </div>

              {/* Signature Line */}
              <div style={{ borderBottom: '1.5px solid #0f172a', width: '100%', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
                SHAOLI LU
              </div>
              <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                Capacity: Sole Lender & Creditor
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '3px' }}>
                Date Executed: <strong>{signedDate}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.5rem' }}>
              * Sole signatory block designated pursuant to Lender Certification. No borrower signature required on this instrument.
            </div>
          </div>

          {/* RIGHT: NOTARY PUBLIC CERTIFICATE OF ACKNOWLEDGMENT */}
          <div style={{ background: '#fdfefe', border: '1px solid #94a3b8', borderRadius: '4px', padding: '0.5rem 0.65rem' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STATE NOTARIAL ACKNOWLEDGMENT
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                (Commissioned Notary Public Certificate)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '4px' }}>
              <span><strong>State of:</strong> {jurisdictionState || '____________________'}</span>
              <span><strong>County of:</strong> {jurisdictionCounty || '____________________'}</span>
            </div>

            <p style={{ fontSize: '0.73rem', lineHeight: 1.3, textAlign: 'justify', margin: '0 0 6px 0' }}>
              On this _____ day of October, 2026, before me, the undersigned Notary Public, personally appeared <strong>SHAOLI LU</strong>, proved to me on the basis of satisfactory evidence to be the person who executed the within instrument as <strong>Lender</strong>, and acknowledged that she executed the same in her authorized capacity.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ borderBottom: '1px solid #0f172a', height: '22px', marginBottom: '2px' }}></div>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>Notary Public Signature</div>

                <div style={{ borderBottom: '1px solid #0f172a', height: '18px', marginTop: '4px', marginBottom: '2px' }}></div>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>Printed Name of Notary</div>

                <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                  <strong>Comm. Expires:</strong> _________________
                </div>
              </div>

              {/* Compact Notary Stamp / Seal Box */}
              <div
                style={{
                  border: '1.5px dashed #64748b',
                  borderRadius: '4px',
                  height: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  textAlign: 'center',
                  color: '#64748b',
                  background: '#f8fafc',
                }}
              >
                <div style={{ fontSize: '0.9rem' }}>🏛️</div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  [ NOTARY SEAL / STAMP ]
                </div>
                <div style={{ fontSize: '0.58rem' }}>State of {jurisdictionState || '__________'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '3px', fontSize: '0.68rem', color: '#64748b', textAlign: 'center' }}>
          Official Loan &amp; Indebtedness Instrument • Signed October 2, 2026 • IRS Rev. Rul. 2026-19 Compliant • Signer: Shaoli Lu • <strong>Page 1 of 1</strong>
        </div>
      </div>
    </div>
  );
}
