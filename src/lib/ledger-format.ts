import type { TransactionType } from './types';

export function formatAmount(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Mirrors PersonalLedgerSign on the backend.
 * Positive ledger types contribute +amount to a counterparty balance
 * (counterparty owes me more). Negative types contribute -amount
 * (I owe counterparty more).
 */
export const POSITIVE_LEDGER_TYPES = new Set<TransactionType>([
  'LEND',
  'REPAYMENT_GIVEN',
  'EXPENSE',
]);

export const NEGATIVE_LEDGER_TYPES = new Set<TransactionType>([
  'BORROW',
  'REPAYMENT_RECEIVED',
  'INCOME',
]);

/**
 * Sign the personal-list view treats as "money in" (green).
 * Used only for the per-row visual cue on the dashboard list, where rows
 * are not yet grouped by counterparty.
 */
export const PERSONAL_LIST_INFLOW_TYPES = new Set<TransactionType>([
  'INCOME',
  'BORROW',
  'REPAYMENT_RECEIVED',
]);
