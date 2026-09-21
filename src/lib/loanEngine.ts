import Decimal from 'decimal.js';
import { addMonths, format, parseISO, isValid } from 'date-fns';
import {
  Loan,
  LoanPayment,
  AmortizationRow,
  ScheduleSummary,
  TaxYearSummary,
  WhatIfComparison,
} from '@/types/loan';

/**
 * Configure Decimal precision
 */
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Converts cents integer to formatted currency string (e.g., 239527 -> "$2,395.27")
 */
export function formatCents(cents: number | undefined | null, showDecimals = true): string {
  if (cents === undefined || cents === null || isNaN(cents)) return '$0.00';
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(dollars);
}

/**
 * Converts dollar number/input string to integer cents
 */
export function dollarsToCents(dollars: number | string): number {
  if (typeof dollars === 'string') {
    const cleaned = dollars.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return new Decimal(num).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  }
  if (isNaN(dollars)) return 0;
  return new Decimal(dollars).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Converts integer cents to dollar number
 */
export function centsToDollars(cents: number): number {
  return new Decimal(cents).div(100).toNumber();
}

/**
 * Formats basis points into percentage string (e.g., 512 -> "5.12%")
 */
export function formatBps(bps: number | undefined | null): string {
  if (bps === undefined || bps === null || isNaN(bps)) return '0.00%';
  const pct = bps / 100;
  return `${pct.toFixed(2)}%`;
}

/**
 * Converts percentage (e.g., 5.12) to basis points (512)
 */
export function percentToBps(percent: number | string): number {
  const num = typeof percent === 'string' ? parseFloat(percent) : percent;
  if (isNaN(num)) return 0;
  return new Decimal(num).mul(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Converts basis points (512) to percentage number (5.12)
 */
export function bpsToPercent(bps: number): number {
  return new Decimal(bps).div(100).toNumber();
}

/**
 * Calculate standard required monthly P&I payment in integer cents.
 * Handles zero-interest loans as an even division of principal.
 */
export function monthlyPayment(
  principalCents: number,
  annualRateBps: number,
  termMonths: number
): number {
  if (termMonths <= 0 || principalCents <= 0) return 0;

  const P = new Decimal(principalCents);
  const r = new Decimal(annualRateBps).div(10_000).div(12);

  // Zero-interest loan: pure even principal division
  if (r.eq(0)) {
    return P.div(termMonths).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
  }

  const factor = new Decimal(1).plus(r).pow(termMonths);
  const payment = P.mul(r).mul(factor).div(factor.minus(1));

  return payment.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Apply payment waterfall for a single cycle:
 * Order of application:
 * 1. Late fee (if applicable)
 * 2. Unpaid accrued interest carried from previous cycles
 * 3. Current period interest
 * 4. Scheduled principal
 * 5. Extra principal
 */
export function applyPayment({
  balanceBeforeCents,
  annualRateBps,
  paymentReceivedCents,
  extraPrincipalCents = 0,
  accruedUnpaidInterestCents = 0,
  lateFeeCents = 0,
}: {
  balanceBeforeCents: number;
  annualRateBps: number;
  paymentReceivedCents: number;
  extraPrincipalCents?: number;
  accruedUnpaidInterestCents?: number;
  lateFeeCents?: number;
}) {
  const balance = new Decimal(balanceBeforeCents);
  let remainingCash = new Decimal(paymentReceivedCents);

  // 1. Late fee deduction
  const lateFeeDue = new Decimal(lateFeeCents);
  const lateFeePaid = Decimal.min(remainingCash, lateFeeDue);
  remainingCash = remainingCash.minus(lateFeePaid);

  // 2. Interest calculation
  const monthlyRate = new Decimal(annualRateBps).div(10_000).div(12);
  const currentInterest = balance.mul(monthlyRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const totalInterestDue = currentInterest.plus(accruedUnpaidInterestCents);

  const interestPaid = Decimal.min(remainingCash, totalInterestDue);
  const unpaidInterestRemaining = totalInterestDue.minus(interestPaid);
  remainingCash = remainingCash.minus(interestPaid);

  // 3. Principal calculation
  const scheduledPrincipalPaid = Decimal.min(remainingCash, balance);
  remainingCash = remainingCash.minus(scheduledPrincipalPaid);

  // 4. Extra Principal
  const extraRequested = new Decimal(extraPrincipalCents);
  const extraFromRemaining = Decimal.min(remainingCash, balance.minus(scheduledPrincipalPaid));
  const totalExtraPrincipal = Decimal.min(
    balance.minus(scheduledPrincipalPaid),
    extraRequested.plus(extraFromRemaining)
  );

  const totalPrincipalPaid = scheduledPrincipalPaid.plus(totalExtraPrincipal);
  const balanceAfter = Decimal.max(0, balance.minus(totalPrincipalPaid));

  return {
    interestCents: interestPaid.toNumber(),
    currentInterestCents: currentInterest.toNumber(),
    unpaidInterestCents: unpaidInterestRemaining.toNumber(),
    scheduledPrincipalCents: scheduledPrincipalPaid.toNumber(),
    extraPrincipalCents: totalExtraPrincipal.toNumber(),
    totalPrincipalCents: totalPrincipalPaid.toNumber(),
    lateFeePaidCents: lateFeePaid.toNumber(),
    paymentAppliedCents: interestPaid.plus(totalPrincipalPaid).plus(lateFeePaid).toNumber(),
    balanceAfterCents: balanceAfter.toNumber(),
  };
}

/**
 * Safely compute a due date for payment cycle `paymentNumber` (1-indexed)
 */
export function getDueDate(firstPaymentDateStr: string, paymentNumber: number, dueDay = 1): string {
  try {
    const baseDate = parseISO(firstPaymentDateStr);
    if (!isValid(baseDate)) {
      const fallback = new Date();
      fallback.setDate(dueDay);
      return format(fallback, 'yyyy-MM-dd');
    }
    const targetDate = addMonths(baseDate, paymentNumber - 1);
    // Ensure the day of month matches paymentDueDay where possible
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const clampedDay = Math.min(dueDay, daysInMonth);
    targetDate.setDate(clampedDay);
    return format(targetDate, 'yyyy-MM-dd');
  } catch {
    return firstPaymentDateStr;
  }
}

/**
 * Generate complete dynamic schedule from original terms and any actual recorded payments.
 */
export function generateAmortizationSchedule(
  loan: Loan,
  actualPayments: LoanPayment[] = []
): { rows: AmortizationRow[]; summary: ScheduleSummary } {
  const rows: AmortizationRow[] = [];
  let runningBalance = new Decimal(loan.originalPrincipalCents);
  let carriedUnpaidInterest = 0;

  let totalInterestCents = 0;
  let totalPrincipalCents = 0;
  let totalPaidCents = 0;

  let totalActualInterest = 0;
  let totalActualPrincipal = 0;
  let totalActualPaid = 0;

  // Map recorded payments by paymentNumber or dueDate
  const paymentMap = new Map<number, LoanPayment>();
  const paymentByDateMap = new Map<string, LoanPayment>();
  actualPayments.forEach(p => {
    if (p.paymentNumber) {
      paymentMap.set(p.paymentNumber, p);
    }
    if (p.dueDate) {
      paymentByDateMap.set(p.dueDate, p);
    }
  });

  const maxMonths = Math.max(loan.termMonths, 600); // safety bound
  let paymentNum = 1;
  let estimatedPayoffDate = loan.firstPaymentDate;

  // Calculate baseline interest for comparison (standard schedule with 0 extra payments)
  let baselineTotalInterest = 0;
  {
    let bBalance = new Decimal(loan.originalPrincipalCents);
    const mRate = new Decimal(loan.annualRateBps).div(10_000).div(12);
    for (let i = 1; i <= loan.termMonths; i++) {
      if (bBalance.lte(0)) break;
      const bInt = bBalance.mul(mRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      let bPrinc = new Decimal(loan.scheduledPaymentCents).minus(bInt);
      if (bPrinc.gt(bBalance) || i === loan.termMonths) {
        bPrinc = bBalance;
      }
      baselineTotalInterest += bInt.toNumber();
      bBalance = bBalance.minus(bPrinc);
    }
  }

  while (paymentNum <= maxMonths && (runningBalance.gt(0) || paymentNum <= actualPayments.length)) {
    const dueDate = getDueDate(loan.firstPaymentDate, paymentNum, loan.paymentDueDay);
    const actualPayment = paymentMap.get(paymentNum) || paymentByDateMap.get(dueDate);
    const beginningBalance = runningBalance.toNumber();

    if (actualPayment) {
      // Use recorded payment data
      const interest = actualPayment.interestCents;
      const principal = actualPayment.scheduledPrincipalCents;
      const extraPrinc = actualPayment.extraPrincipalCents;
      const totalPrinc = principal + extraPrinc;
      const endingBalance = actualPayment.balanceAfterCents;

      rows.push({
        paymentNumber: paymentNum,
        dueDate: actualPayment.dueDate || dueDate,
        beginningBalanceCents: actualPayment.balanceBeforeCents,
        scheduledPaymentCents: actualPayment.scheduledPaymentCents,
        paymentReceivedCents: actualPayment.paymentReceivedCents,
        interestCents: interest,
        principalCents: principal,
        extraPrincipalCents: extraPrinc,
        endingBalanceCents: endingBalance,
        isActualPayment: true,
        actualPaidDate: actualPayment.paidDate,
        status: actualPayment.status,
        memo: actualPayment.memo,
        paymentId: actualPayment.id,
        unpaidInterestCents: actualPayment.unpaidInterestCents || 0,
      });

      carriedUnpaidInterest = actualPayment.unpaidInterestCents || 0;
      runningBalance = new Decimal(endingBalance);

      totalInterestCents += interest;
      totalPrincipalCents += totalPrinc;
      totalPaidCents += actualPayment.paymentReceivedCents;

      totalActualInterest += interest;
      totalActualPrincipal += totalPrinc;
      totalActualPaid += actualPayment.paymentReceivedCents;

      estimatedPayoffDate = actualPayment.paidDate || dueDate;
    } else {
      // Future / projected row
      if (runningBalance.lte(0)) {
        break;
      }

      const monthlyRate = new Decimal(loan.annualRateBps).div(10_000).div(12);
      const interest = runningBalance.mul(monthlyRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      const totalInterestDue = interest.plus(carriedUnpaidInterest);

      let scheduledPrinc = new Decimal(loan.scheduledPaymentCents).minus(totalInterestDue);
      if (scheduledPrinc.lt(0)) {
        scheduledPrinc = new Decimal(0);
      }

      // Final payment capping
      if (scheduledPrinc.gte(runningBalance)) {
        scheduledPrinc = runningBalance;
      }

      const totalPrinc = scheduledPrinc.toNumber();
      const endingBalance = runningBalance.minus(scheduledPrinc).toNumber();

      const scheduledPayment = totalInterestDue.plus(scheduledPrinc).toNumber();

      rows.push({
        paymentNumber: paymentNum,
        dueDate,
        beginningBalanceCents: beginningBalance,
        scheduledPaymentCents: scheduledPayment,
        interestCents: totalInterestDue.toNumber(),
        principalCents: totalPrinc,
        extraPrincipalCents: 0,
        endingBalanceCents: endingBalance,
        isActualPayment: false,
        status: 'upcoming',
      });

      carriedUnpaidInterest = 0;
      runningBalance = new Decimal(endingBalance);

      totalInterestCents += totalInterestDue.toNumber();
      totalPrincipalCents += totalPrinc;
      totalPaidCents += scheduledPayment;

      estimatedPayoffDate = dueDate;
    }

    paymentNum++;
  }

  const currentBalanceCents = rows.length > 0 ? rows[rows.length - 1].endingBalanceCents : loan.originalPrincipalCents;
  
  // Find current/next upcoming payment
  const nextPayment = rows.find(r => !r.isActualPayment || r.status === 'upcoming' || r.status === 'late');

  const monthsToPayoff = rows.length;
  const monthsSaved = Math.max(0, loan.termMonths - monthsToPayoff);
  const interestSavedCents = Math.max(0, baselineTotalInterest - totalInterestCents);

  const progressPercent = loan.originalPrincipalCents > 0
    ? Math.min(100, Math.max(0, ((loan.originalPrincipalCents - (rows.filter(r => r.isActualPayment).pop()?.endingBalanceCents ?? loan.originalPrincipalCents)) / loan.originalPrincipalCents) * 100))
    : 100;

  const summary: ScheduleSummary = {
    totalInterestCents,
    totalPrincipalCents,
    totalPaidCents,
    estimatedPayoffDate,
    monthsToPayoff,
    interestSavedCents,
    monthsSaved,
    currentBalanceCents: rows.filter(r => r.isActualPayment).pop()?.endingBalanceCents ?? loan.originalPrincipalCents,
    nextPaymentDueDate: nextPayment?.dueDate,
    nextPaymentAmountCents: nextPayment?.scheduledPaymentCents ?? loan.scheduledPaymentCents,
    progressPercent,
    totalActualInterestPaidCents: totalActualInterest,
    totalActualPrincipalPaidCents: totalActualPrincipal,
    totalActualPaidCents: totalActualPaid,
  };

  return { rows, summary };
}

/**
 * Aggregate amortization rows into calendar-year summary for CPA / Tax purposes.
 */
export function calculateTaxSummary(rows: AmortizationRow[]): TaxYearSummary[] {
  const yearMap = new Map<number, TaxYearSummary>();

  for (const row of rows) {
    const dateStr = row.actualPaidDate || row.dueDate;
    const year = parseInt(dateStr.substring(0, 4), 10);
    if (isNaN(year)) continue;

    const existing = yearMap.get(year) || {
      year,
      totalInterestCents: 0,
      totalPrincipalCents: 0,
      totalExtraPrincipalCents: 0,
      totalPaidCents: 0,
      endingBalanceCents: row.endingBalanceCents,
      paymentCount: 0,
    };

    existing.totalInterestCents += row.interestCents;
    existing.totalPrincipalCents += row.principalCents;
    existing.totalExtraPrincipalCents += row.extraPrincipalCents;
    existing.totalPaidCents += (row.interestCents + row.principalCents + row.extraPrincipalCents);
    existing.endingBalanceCents = row.endingBalanceCents;
    existing.paymentCount += 1;

    yearMap.set(year, existing);
  }

  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
}

/**
 * What-If Simulator: compare standard payment against custom higher monthly payments.
 */
export function calculateWhatIf(loan: Loan, customMonthlyPaymentsCents: { label: string; amountCents: number }[]): WhatIfComparison[] {
  const baseMonthly = loan.scheduledPaymentCents;
  const mRate = new Decimal(loan.annualRateBps).div(10_000).div(12);

  // Baseline schedule
  let baselineTotalInterest = 0;
  let baselineMonths = 0;
  let baselinePayoffDate = loan.firstPaymentDate;
  {
    let bal = new Decimal(loan.originalPrincipalCents);
    for (let m = 1; m <= 600; m++) {
      if (bal.lte(0)) break;
      const interest = bal.mul(mRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      let princ = new Decimal(baseMonthly).minus(interest);
      if (princ.gt(bal) || m === loan.termMonths) {
        princ = bal;
      }
      baselineTotalInterest += interest.toNumber();
      bal = bal.minus(princ);
      baselineMonths = m;
      baselinePayoffDate = getDueDate(loan.firstPaymentDate, m, loan.paymentDueDay);
    }
  }

  const results: WhatIfComparison[] = [
    {
      label: 'Scheduled Payment (Baseline)',
      monthlyPaymentCents: baseMonthly,
      monthlyDifferenceCents: 0,
      monthsToPayoff: baselineMonths,
      monthsSaved: 0,
      estimatedPayoffDate: baselinePayoffDate,
      totalInterestCents: baselineTotalInterest,
      interestSavedCents: 0,
      totalCostCents: loan.originalPrincipalCents + baselineTotalInterest,
    },
  ];

  for (const item of customMonthlyPaymentsCents) {
    if (item.amountCents <= 0) continue;
    let bal = new Decimal(loan.originalPrincipalCents);
    let simInterest = 0;
    let simMonths = 0;
    let simPayoffDate = loan.firstPaymentDate;

    for (let m = 1; m <= 600; m++) {
      if (bal.lte(0)) break;
      const interest = bal.mul(mRate).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
      let princ = new Decimal(item.amountCents).minus(interest);
      if (princ.lte(0)) {
        // Payment doesn't even cover interest
        simMonths = 600;
        break;
      }
      if (princ.gt(bal)) {
        princ = bal;
      }
      simInterest += interest.toNumber();
      bal = bal.minus(princ);
      simMonths = m;
      simPayoffDate = getDueDate(loan.firstPaymentDate, m, loan.paymentDueDay);
    }

    const monthsSaved = Math.max(0, baselineMonths - simMonths);
    const interestSaved = Math.max(0, baselineTotalInterest - simInterest);

    results.push({
      label: item.label,
      monthlyPaymentCents: item.amountCents,
      monthlyDifferenceCents: item.amountCents - baseMonthly,
      monthsToPayoff: simMonths,
      monthsSaved,
      estimatedPayoffDate: simPayoffDate,
      totalInterestCents: simInterest,
      interestSavedCents: interestSaved,
      totalCostCents: loan.originalPrincipalCents + simInterest,
    });
  }

  return results;
}
