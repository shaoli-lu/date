import { supabase } from './supabase';
import { Loan, LoanPayment, LoanAmendment } from '@/types/loan';
import { monthlyPayment } from './loanEngine';

const LOCAL_LOANS_KEY = 'date_app_loans_v1';
const LOCAL_PAYMENTS_KEY = 'date_app_loan_payments_v1';

/**
 * Creates default sample intrafamily home mortgage
 */
export function getSampleLoan(userId = 'demo-user'): Loan {
  const principalCents = 44_000_000; // $440,000
  const rateBps = 512;               // 5.12%
  const termMonths = 360;            // 30 years
  const scheduledPmt = monthlyPayment(principalCents, rateBps, termMonths);

  return {
    id: 'loan-sample-family-home',
    user_id: userId,
    title: 'Family Home Loan',
    borrowerName: 'Alex & Jordan Smith',
    lenderName: 'Robert & Margaret Smith',
    propertyAddress: '742 Evergreen Terrace, Springfield, IL 62704',
    originalPrincipalCents: principalCents,
    annualRateBps: rateBps,
    termMonths: termMonths,
    fundingDate: '2026-11-14',
    firstPaymentDate: '2026-12-01',
    paymentFrequency: 'monthly',
    scheduledPaymentCents: scheduledPmt,
    paymentDueDay: 1,
    graceDays: 15,
    prepaymentPenalty: false,
    paymentApplication: 'interest_then_principal',
    status: 'active',
    noteReference: 'PROMISSORY-NOTE-2026-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * LocalStorage Fallback Helpers
 */
function getLocalLoans(): Loan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_LOANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading local loans', e);
    return [];
  }
}

function setLocalLoans(loans: Loan[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_LOANS_KEY, JSON.stringify(loans));
  } catch (e) {
    console.error('Failed storing local loans', e);
  }
}

function getLocalPayments(loanId?: string): LoanPayment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PAYMENTS_KEY);
    if (!raw) return [];
    const all: LoanPayment[] = JSON.parse(raw);
    return loanId ? all.filter(p => p.loanId === loanId) : all;
  } catch (e) {
    console.error('Failed reading local payments', e);
    return [];
  }
}

function setLocalPayments(payments: LoanPayment[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (e) {
    console.error('Failed storing local payments', e);
  }
}

/**
 * Loan Repository Functions (Supabase with LocalStorage sync)
 */
export async function fetchLoans(userId?: string): Promise<Loan[]> {
  try {
    if (supabase) {
      let query = supabase.from('loans').select('*').order('created_at', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // Map database columns if needed, or if stored as JSON
        const mapped: Loan[] = data.map((d: any) => ({
          ...d,
          originalPrincipalCents: Number(d.original_principal_cents || d.originalPrincipalCents),
          annualRateBps: Number(d.annual_rate_bps || d.annualRateBps),
          termMonths: Number(d.term_months || d.termMonths),
          fundingDate: d.funding_date || d.fundingDate,
          firstPaymentDate: d.first_payment_date || d.firstPaymentDate,
          scheduledPaymentCents: Number(d.scheduled_payment_cents || d.scheduledPaymentCents),
          paymentDueDay: Number(d.payment_due_day || d.paymentDueDay || 1),
          graceDays: Number(d.grace_days || d.graceDays || 15),
          borrowerName: d.borrower_name || d.borrowerName,
          lenderName: d.lender_name || d.lenderName,
          propertyAddress: d.property_address || d.propertyAddress,
          noteReference: d.note_reference || d.noteReference,
          forgivenDate: d.forgiven_date || d.forgivenDate,
          forgivenDocReference: d.forgiven_doc_reference || d.forgivenDocReference,
          forgivenReason: d.forgiven_reason || d.forgivenReason,
          amendments: d.amendments || [],
        }));
        setLocalLoans(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch loans warning, falling back to local storage:', err);
  }

  // Fallback to local storage
  const local = getLocalLoans();
  if (local.length === 0 && userId) {
    const sample = getSampleLoan(userId);
    setLocalLoans([sample]);
    return [sample];
  }
  return local;
}

export async function saveLoan(loan: Loan): Promise<Loan> {
  const updatedLoan: Loan = {
    ...loan,
    updated_at: new Date().toISOString(),
    created_at: loan.created_at || new Date().toISOString(),
  };

  // 1. Always update local storage
  const local = getLocalLoans();
  const index = local.findIndex(l => l.id === loan.id);
  if (index >= 0) {
    local[index] = updatedLoan;
  } else {
    local.unshift(updatedLoan);
  }
  setLocalLoans(local);

  // 2. Try Supabase
  try {
    if (supabase) {
      const payload = {
        id: updatedLoan.id,
        user_id: updatedLoan.user_id,
        title: updatedLoan.title,
        borrower_name: updatedLoan.borrowerName,
        lender_name: updatedLoan.lenderName,
        property_address: updatedLoan.propertyAddress,
        original_principal_cents: updatedLoan.originalPrincipalCents,
        annual_rate_bps: updatedLoan.annualRateBps,
        term_months: updatedLoan.termMonths,
        funding_date: updatedLoan.fundingDate,
        first_payment_date: updatedLoan.firstPaymentDate,
        payment_frequency: updatedLoan.paymentFrequency,
        scheduled_payment_cents: updatedLoan.scheduledPaymentCents,
        payment_due_day: updatedLoan.paymentDueDay,
        grace_days: updatedLoan.graceDays,
        prepayment_penalty: false,
        payment_application: updatedLoan.paymentApplication,
        status: updatedLoan.status,
        note_reference: updatedLoan.noteReference,
        forgiven_date: updatedLoan.forgivenDate,
        forgiven_doc_reference: updatedLoan.forgivenDocReference,
        forgiven_reason: updatedLoan.forgivenReason,
        amendments: updatedLoan.amendments,
        updated_at: updatedLoan.updated_at,
      };

      await supabase.from('loans').upsert(payload);
    }
  } catch (e) {
    console.warn('Supabase saveLoan error, saved locally:', e);
  }

  return updatedLoan;
}

export async function deleteLoan(loanId: string): Promise<boolean> {
  const local = getLocalLoans().filter(l => l.id !== loanId);
  setLocalLoans(local);

  const localPayments = getLocalPayments().filter(p => p.loanId !== loanId);
  setLocalPayments(localPayments);

  try {
    if (supabase) {
      await supabase.from('loan_payments').delete().eq('loan_id', loanId);
      await supabase.from('loans').delete().eq('id', loanId);
    }
  } catch (e) {
    console.warn('Supabase deleteLoan error:', e);
  }

  return true;
}

/**
 * Payment Repository Functions
 */
export async function fetchPayments(loanId: string): Promise<LoanPayment[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('due_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: LoanPayment[] = data.map((d: any) => ({
          id: d.id,
          loanId: d.loan_id || d.loanId,
          user_id: d.user_id,
          paymentNumber: d.payment_number ? Number(d.payment_number) : undefined,
          dueDate: d.due_date || d.dueDate,
          paidDate: d.paid_date || d.paidDate,
          scheduledPaymentCents: Number(d.scheduled_payment_cents || d.scheduledPaymentCents),
          paymentReceivedCents: Number(d.payment_received_cents || d.paymentReceivedCents),
          interestCents: Number(d.interest_cents || d.interestCents),
          scheduledPrincipalCents: Number(d.scheduled_principal_cents || d.scheduledPrincipalCents),
          extraPrincipalCents: Number(d.extra_principal_cents || d.extraPrincipalCents || 0),
          lateFeeCents: Number(d.late_fee_cents || d.lateFeeCents || 0),
          unpaidInterestCents: Number(d.unpaid_interest_cents || d.unpaidInterestCents || 0),
          balanceBeforeCents: Number(d.balance_before_cents || d.balanceBeforeCents),
          balanceAfterCents: Number(d.balance_after_cents || d.balanceAfterCents),
          status: d.status,
          memo: d.memo,
          created_at: d.created_at,
        }));
        // Update local cache
        const allLocal = getLocalPayments().filter(p => p.loanId !== loanId);
        setLocalPayments([...allLocal, ...mapped]);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetch payments warning, falling back to local storage:', err);
  }

  return getLocalPayments(loanId).sort((a, b) => (a.paymentNumber || 0) - (b.paymentNumber || 0));
}

export async function savePayment(payment: LoanPayment): Promise<LoanPayment> {
  const updated: LoanPayment = {
    ...payment,
    created_at: payment.created_at || new Date().toISOString(),
  };

  // Local storage save
  const allLocal = getLocalPayments();
  const idx = allLocal.findIndex(p => p.id === payment.id);
  if (idx >= 0) {
    allLocal[idx] = updated;
  } else {
    allLocal.push(updated);
  }
  setLocalPayments(allLocal);

  // Supabase save
  try {
    if (supabase) {
      const payload = {
        id: updated.id,
        loan_id: updated.loanId,
        user_id: updated.user_id,
        payment_number: updated.paymentNumber,
        due_date: updated.dueDate,
        paid_date: updated.paidDate,
        scheduled_payment_cents: updated.scheduledPaymentCents,
        payment_received_cents: updated.paymentReceivedCents,
        interest_cents: updated.interestCents,
        scheduled_principal_cents: updated.scheduledPrincipalCents,
        extra_principal_cents: updated.extraPrincipalCents,
        late_fee_cents: updated.lateFeeCents,
        unpaid_interest_cents: updated.unpaidInterestCents,
        balance_before_cents: updated.balanceBeforeCents,
        balance_after_cents: updated.balanceAfterCents,
        status: updated.status,
        memo: updated.memo,
      };
      await supabase.from('loan_payments').upsert(payload);
    }
  } catch (e) {
    console.warn('Supabase savePayment error:', e);
  }

  return updated;
}

export async function deletePayment(paymentId: string, loanId: string): Promise<boolean> {
  const all = getLocalPayments().filter(p => p.id !== paymentId);
  setLocalPayments(all);

  try {
    if (supabase) {
      await supabase.from('loan_payments').delete().eq('id', paymentId);
    }
  } catch (e) {
    console.warn('Supabase deletePayment error:', e);
  }

  return true;
}
