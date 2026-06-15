import { addDays, addWeeks, addMonths, addYears } from 'date-fns'

export interface EventMetadata {
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    endCondition: 'never' | 'count' | 'date';
    endCount?: number;
    endDate?: string;
    seriesId: string;
    index: number;
    total: number;
  };
  cdRenewal?: {
    principal: number;
    apy: number;
    startDate: string;
    termValue: number;
    termUnit: 'days' | 'months' | 'years';
    interest: number;
    grandTotal: number;
  };
}

export const parseDescription = (desc: string | null | undefined): { text: string; metadata: EventMetadata } => {
  if (!desc) return { text: '', metadata: {} }
  const separator = '\n\n--- METADATA ---\n'
  const parts = desc.split(separator)
  if (parts.length > 1) {
    try {
      const metadata = JSON.parse(parts[1])
      return { text: parts[0], metadata }
    } catch (e) {
      // Ignore parse errors, treat as text
    }
  }
  return { text: desc, metadata: {} }
}

export const serializeDescription = (text: string, metadata: EventMetadata): string => {
  if (!metadata || Object.keys(metadata).length === 0) return text
  return `${text}\n\n--- METADATA ---\n${JSON.stringify(metadata)}`
}

export const calculateCdInterest = (principal: number, apy: number, termVal: number, termUnit: 'days' | 'months' | 'years') => {
  let t = termVal
  if (termUnit === 'months') {
    t = termVal / 12
  } else if (termUnit === 'days') {
    t = termVal / 365
  }
  const rate = apy / 100
  const grandTotal = principal * Math.pow(1 + rate, t)
  const interest = grandTotal - principal
  return {
    interest: parseFloat(interest.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  }
}

export const calculateMaturityDate = (startDateStr: string, termVal: number, termUnit: 'days' | 'months' | 'years'): Date => {
  const start = new Date(startDateStr + 'T12:00:00')
  if (termUnit === 'years') {
    return addYears(start, termVal)
  } else if (termUnit === 'days') {
    return addDays(start, termVal)
  } else {
    return addMonths(start, termVal)
  }
}

export const generateOccurrences = (
  start: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  endCondition: 'never' | 'count' | 'date',
  endCount?: number,
  endDate?: Date
): Date[] => {
  const dates = [start]
  let current = new Date(start)
  
  let maxCount = 50
  if (endCondition === 'count' && endCount) {
    maxCount = Math.min(endCount, 100)
  } else if (endCondition === 'never') {
    if (frequency === 'daily') maxCount = 30
    else if (frequency === 'weekly') maxCount = 52
    else if (frequency === 'monthly') maxCount = 12
    else if (frequency === 'yearly') maxCount = 5
  }

  const limitDate = endCondition === 'date' && endDate ? endDate : null

  while (dates.length < maxCount) {
    if (frequency === 'daily') {
      current = addDays(current, 1)
    } else if (frequency === 'weekly') {
      current = addWeeks(current, 1)
    } else if (frequency === 'monthly') {
      current = addMonths(current, 1)
    } else if (frequency === 'yearly') {
      current = addYears(current, 1)
    }

    if (limitDate && current > limitDate) {
      break
    }
    dates.push(new Date(current))
  }

  return dates
}
