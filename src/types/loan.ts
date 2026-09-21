export type LoanStatus = 'draft' | 'active' | 'paid_off' | 'forgiven';

export type LoanAmendment = {
  id: string;
  loanId?: string;
  effectiveDate: string;
  description: string;
  previousAnnualRateBps?: number;
  newAnnualRateBps?: number;
  previousScheduledPaymentCents?: number;
  newScheduledPaymentCents?: number;
  docReference?: string;
  createdAt: string;
};

export type Loan = {
  id: string;
  user_id?: string;
  title: string;                         // "Family home loan"
  borrowerName: string;
  lenderName: string;
  propertyAddress?: string;

  originalPrincipalCents: number;        // 44_000_000 = $440,000
  annualRateBps: number;                 // 512 = 5.12%
  termMonths: number;                    // 360
  fundingDate: string;                   // "2026-11-14"
  firstPaymentDate: string;              // "2026-12-01"
  paymentFrequency: 'monthly';

  scheduledPaymentCents: number;         // calculated, e.g. 239527
  paymentDueDay: number;                 // 1
  graceDays: number;                     // 15
  prepaymentPenalty: false;

  paymentApplication: 'interest_then_principal';
  status: LoanStatus;
  noteReference?: string;

  // Edge cases metadata
  forgivenDate?: string;
  forgivenDocReference?: string;
  forgivenReason?: string;
  refinanceNewLoanId?: string;
  amendments?: LoanAmendment[];

  created_at?: string;
  updated_at?: string;
};

export type PaymentStatus = 'upcoming' | 'partial' | 'paid' | 'late';

export type LoanPayment = {
  id: string;
  loanId: string;
  user_id?: string;
  paymentNumber?: number;
  dueDate: string;
  paidDate?: string;

  scheduledPaymentCents: number;
  paymentReceivedCents: number;

  interestCents: number;
  scheduledPrincipalCents: number;
  extraPrincipalCents: number;
  lateFeeCents: number;
  unpaidInterestCents?: number;

  balanceBeforeCents: number;
  balanceAfterCents: number;

  status: PaymentStatus;
  memo?: string;  // e.g. "Extra $500 principal-only"
  created_at?: string;
};

export type AmortizationRow = {
  paymentNumber: number;
  dueDate: string;
  beginningBalanceCents: number;
  scheduledPaymentCents: number;
  paymentReceivedCents?: number;
  interestCents: number;
  principalCents: number;
  extraPrincipalCents: number;
  endingBalanceCents: number;
  isActualPayment: boolean;
  actualPaidDate?: string;
  status: PaymentStatus;
  memo?: string;
  paymentId?: string;
  unpaidInterestCents?: number;
};

export type ScheduleSummary = {
  totalInterestCents: number;
  totalPrincipalCents: number;
  totalPaidCents: number;
  estimatedPayoffDate: string;
  monthsToPayoff: number;
  interestSavedCents: number;
  monthsSaved: number;
  currentBalanceCents: number;
  nextPaymentDueDate?: string;
  nextPaymentAmountCents?: number;
  progressPercent: number;
  totalActualInterestPaidCents: number;
  totalActualPrincipalPaidCents: number;
  totalActualPaidCents: number;
};

export type TaxYearSummary = {
  year: number;
  totalInterestCents: number;
  totalPrincipalCents: number;
  totalExtraPrincipalCents: number;
  totalPaidCents: number;
  endingBalanceCents: number;
  paymentCount: number;
};

export type WhatIfComparison = {
  label: string;
  monthlyPaymentCents: number;
  monthlyDifferenceCents: number;
  monthsToPayoff: number;
  monthsSaved: number;
  estimatedPayoffDate: string;
  totalInterestCents: number;
  interestSavedCents: number;
  totalCostCents: number;
};
