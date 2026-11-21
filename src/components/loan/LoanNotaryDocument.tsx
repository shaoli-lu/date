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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Print Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>🏛️</span>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: 700 }}>
              Official Loan Documentation & Notary Acknowledgment
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '4px' }}>
            Official legal documentation prepared for Notary Public acknowledgment. Signer is exclusively designated as{' '}
            <strong style={{ color: 'var(--primary-color)' }}>Shaoli Lu (Lender)</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Optional Jurisdiction state/county quick setup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>State:</label>
            <input
              type="text"
              placeholder="e.g. Illinois"
              value={jurisdictionState}
              onChange={e => setJurisdictionState(e.target.value)}
              style={{ width: '110px', padding: '6px 8px', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>County:</label>
            <input
              type="text"
              placeholder="e.g. Cook"
              value={jurisdictionCounty}
              onChange={e => setJurisdictionCounty(e.target.value)}
              style={{ width: '110px', padding: '6px 8px', fontSize: '0.8rem' }}
            />
          </div>

          <button
            type="button"
            onClick={() => printElement(docRef.current)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Official Legal Document Sheet (Printable bond layout) */}
      <div
        ref={docRef}
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '12px',
          padding: '3rem',
          maxWidth: '850px',
          width: '100%',
          margin: '0 auto',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
          fontFamily: '"Times New Roman", Times, Georgia, serif',
          lineHeight: 1.65,
          fontSize: '0.98rem',
        }}
      >
        {/* Document Header */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #0f172a', paddingBottom: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
            Official Legal Credit Instrument & Promissory Record
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0', letterSpacing: '0.04em' }}>
            OFFICIAL LOAN AGREEMENT AND NOTARIAL INDEBTEDNESS RECORD
          </h1>
          <div style={{ fontSize: '0.88rem', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
            With Formal Notary Public Certificate of Acknowledgment
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
            <span><strong>Document Ref:</strong> {loan.noteReference || 'LOAN-NOTARY-2026-001'}</span>
            <span><strong>Execution Date:</strong> {loan.fundingDate}</span>
            <span><strong>Principal Obligation:</strong> {formatCents(loan.originalPrincipalCents)}</span>
          </div>
        </div>

        {/* Recital / Parties Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ textAlign: 'justify', marginBottom: '1rem' }}>
            This <strong>Official Loan Agreement & Indebtedness Record</strong> (the &ldquo;Agreement&rdquo;) is executed and confirmed as of{' '}
            <strong>{loan.fundingDate}</strong>, by and between the following parties:
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem', margin: '0.75rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.92rem' }}>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                Lender / Creditor (Sole Signer):
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                SHAOLI LU
              </div>
              <div style={{ color: '#475569', fontSize: '0.85rem' }}>Designation: Sole Lender & Beneficiary</div>
            </div>
            <div>
              <div style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em' }}>
                Borrower / Debtor:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {loan.borrowerName || 'Alex & Jordan Smith'}
              </div>
              <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                Secured Property: {loan.propertyAddress || '742 Evergreen Terrace, Springfield, IL'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Financial Terms Summary Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '3px', marginBottom: '8px' }}>
            1. Principle Loan Terms & Financial Schedule
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', width: '38%', fontWeight: 700 }}>Original Principal Sum:</td>
                <td style={{ padding: '6px 8px' }}>
                  <strong>{formatCents(loan.originalPrincipalCents)}</strong> ({centsToWords(loan.originalPrincipalCents)})
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Annual Interest Rate:</td>
                <td style={{ padding: '6px 8px' }}>
                  <strong>{formatBps(loan.annualRateBps)}</strong> fixed per annum (compounded monthly pursuant to IRS AFR rules)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Amortization Term:</td>
                <td style={{ padding: '6px 8px' }}>
                  {loan.termMonths} consecutive monthly installments ({loan.termMonths / 12} years)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Scheduled Monthly Payment:</td>
                <td style={{ padding: '6px 8px' }}>
                  <strong>{formatCents(loan.scheduledPaymentCents)}</strong> due on day <strong>{loan.paymentDueDay}st/th</strong> of each month
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>First Payment Due Date:</td>
                <td style={{ padding: '6px 8px' }}>{loan.firstPaymentDate}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Collateral / Property Address:</td>
                <td style={{ padding: '6px 8px' }}>
                  {loan.propertyAddress || 'Real property referenced under County Land Records'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>Prepayment Rights:</td>
                <td style={{ padding: '6px 8px' }}>
                  Permitted in full or in part at any time without penalty or premium
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Statutory & Legal Covenants */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'justify' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #0f172a', paddingBottom: '3px', marginBottom: '8px' }}>
            2. Terms of Indebtedness & Security Covenants
          </h2>

          <p style={{ marginBottom: '0.75rem' }}>
            <strong>2.1 Promise to Pay:</strong> For valuable consideration received, the debt evidenced herein is established as an enforceable, bona fide credit obligation. The Borrower is obligated to repay the principal together with accrued interest in strict adherence to the monthly installment schedule established above.
          </p>

          <p style={{ marginBottom: '0.75rem' }}>
            <strong>2.2 Tax & IRS AFR Compliance:</strong> The annual interest rate of {formatBps(loan.annualRateBps)} is confirmed to meet or exceed the applicable statutory rate prescribed under Internal Revenue Code § 7872 and § 1274(d). Both Lender and Borrower acknowledge that the transaction represents an authentic debtor-creditor relationship and not an uncharacterized gift or below-market advance.
          </p>

          <p style={{ marginBottom: '0.75rem' }}>
            <strong>2.3 Application of Payments:</strong> All payments made by Borrower shall be applied first to any accrued and unpaid interest, second to scheduled principal reduction, and third to optional accelerated principal reductions.
          </p>

          <p style={{ marginBottom: '0.75rem' }}>
            <strong>2.4 Security & Lien:</strong> This Agreement is secured by a first or designated mortgage lien / deed of trust on the real property commonly known as <em>{loan.propertyAddress || 'the subject property'}</em>.
          </p>
        </div>

        {/* Section 3: Lender Declaration / Certification */}
        <div style={{ marginBottom: '1.75rem', textAlign: 'justify', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '6px' }}>
            3. Lender Declaration & Official Affirmation
          </h2>
          <p style={{ fontSize: '0.92rem', margin: 0 }}>
            I, <strong>SHAOLI LU</strong>, being duly sworn, depose and state that I am the Lender in the above-referenced loan transaction; that the financial terms, principal balance, interest rate, and security provisions set forth in this document accurately represent the true agreement and indebtedness of the parties; and that I execute this document freely for recording and notarial acknowledgment.
          </p>
        </div>

        {/* Section 4: LENDER EXECUTION BLOCK (ONLY SHAOLI LU AS SIGNER) */}
        <div style={{ marginTop: '2rem', marginBottom: '2.5rem', pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            IN WITNESS WHEREOF, the undersigned Lender has executed this Official Loan Document on the date set forth below.
          </div>

          <div style={{ maxWidth: '420px', marginTop: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
              LENDER (SOLE SIGNER):
            </div>
            <div style={{ borderBottom: '2px solid #0f172a', width: '100%', marginBottom: '6px' }}></div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
              SHAOLI LU
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569' }}>
              Title / Capacity: <strong>Lender & Creditor</strong>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '8px' }}>
              Date Signed: _____________________________________________
            </div>
          </div>
        </div>

        {/* Section 5: OFFICIAL NOTARY PUBLIC ACKNOWLEDGMENT CERTIFICATE */}
        <div
          style={{
            border: '2px solid #0f172a',
            borderRadius: '8px',
            padding: '1.5rem',
            background: '#ffffff',
            pageBreakInside: 'avoid',
            marginTop: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              STATE NOTARIAL CERTIFICATE OF ACKNOWLEDGMENT
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
              (To be completed and sealed by a commissioned Notary Public)
            </div>
          </div>

          {/* Jurisdiction Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.92rem' }}>
            <div>
              <strong>STATE OF:</strong> {jurisdictionState || '_____________________________________'}
            </div>
            <div>
              <strong>COUNTY OF:</strong> {jurisdictionCounty || '_____________________________________'}
            </div>
          </div>

          {/* Acknowledgment Text */}
          <p style={{ textAlign: 'justify', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            On this ______ day of ________________________, 20____, before me, the undersigned Notary Public in and for said County and State, personally appeared <strong>SHAOLI LU</strong>, who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed to the within instrument as <strong>Lender</strong>, and acknowledged to me that she/he executed the same in her/his authorized capacity, and that by her/his signature on the instrument, executed this instrument voluntarily for the purposes therein expressed.
          </p>

          <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2rem' }}>
            WITNESS my hand and official seal.
          </p>

          {/* Notary Signature & Seal Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Signature & Credentials */}
            <div>
              <div style={{ borderBottom: '1px solid #0f172a', height: '36px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>Signature of Notary Public</div>

              <div style={{ borderBottom: '1px solid #0f172a', height: '30px', marginTop: '12px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>Printed / Typed Name of Notary Public</div>

              <div style={{ marginTop: '12px', fontSize: '0.88rem' }}>
                <strong>My Commission Expires:</strong> ____________________________
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.88rem' }}>
                <strong>Notary Commission #:</strong> ____________________________
              </div>
            </div>

            {/* Notary Seal Box */}
            <div
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: '8px',
                height: '160px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏛️</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                [ PLACE OFFICIAL NOTARY SEAL / STAMP HERE ]
              </div>
              <div style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                State of {jurisdictionState || '________________'}
              </div>
            </div>
          </div>
        </div>

        {/* Legal Footer */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.72rem', color: '#64748b', textAlign: 'center' }}>
          Official Loan & Indebtedness Document • Form 2026-NOTARY-01 • Lender Signer: Shaoli Lu • Page 1 of 1
        </div>
      </div>
    </div>
  );
}
