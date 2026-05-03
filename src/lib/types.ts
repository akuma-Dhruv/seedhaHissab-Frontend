export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  projectId: string;
  name: string;
  sharePercentage: number;
}

export interface Vendor {
  id: string;
  projectId: string;
  name: string;
}

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'VENDOR_SUPPLY'
  | 'VENDOR_PAYMENT'
  | 'PARTNER_SETTLEMENT'
  | 'PROFIT_WITHDRAWAL'
  | 'LEND'
  | 'BORROW'
  | 'REPAYMENT_GIVEN'
  | 'REPAYMENT_RECEIVED';

export type PersonalTransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'LEND'
  | 'BORROW'
  | 'REPAYMENT_GIVEN'
  | 'REPAYMENT_RECEIVED';

export type TransactionStatus = 'ACTIVE' | 'OMITTED';

export interface Transaction {
  id: string;
  rootTransactionId: string;
  version: number;
  previousVersionId?: string;
  type: TransactionType;
  amount: number;
  projectId?: string;
  vendorId?: string;
  partnerId?: string;
  paidByPartnerId?: string;
  /** Set ONLY when type='INCOME' and an installment was attached. */
  linkedInstallmentId?: string;
  ownerUserId?: string;
  counterpartyName?: string;
  counterpartyUserId?: string;
  purpose?: string;
  transactionDate: string;
  status: TransactionStatus;
  createdBy: string;
  createdAt: string;
}

export interface PersonalSummaryResponse {
  ownerUserId: string;
  totalIncome: number;
  totalExpense: number;
  totalLent: number;
  totalBorrowed: number;
  totalReceivable: number;
  totalPayable: number;
  netBalance: number;
}

export type CounterpartyDirection = 'THEY_OWE_ME' | 'I_OWE_THEM' | 'SETTLED';

export interface CounterpartySummary {
  counterpartyName: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  direction: CounterpartyDirection;
}

export type ReminderStatus = 'PENDING' | 'COMPLETED' | 'SNOOZED' | 'ARCHIVED';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  /** ISO date string (YYYY-MM-DD) interpreted in Asia/Kolkata. */
  dueDate: string;
  status: ReminderStatus;
  /** Stored server-side as the transaction's stable root id. */
  linkedTransactionId?: string;
  linkedProjectId?: string;
  linkedCounterpartyName?: string;
  linkedInstallmentId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRequest {
  title: string;
  description?: string;
  dueDate: string;
  linkedTransactionId?: string;
  linkedProjectId?: string;
  linkedCounterpartyName?: string;
  linkedInstallmentId?: string;
}

export interface ReminderSnoozeRequest {
  newDueDate: string;
}

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Done',
  SNOOZED: 'Snoozed',
  ARCHIVED: 'Archived',
};

export interface PagedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectSummaryResponse {
  projectId: string;
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

export interface VendorLedgerResponse {
  vendorId: string;
  vendorName: string;
  projectId: string;
  totalSupply: number;
  totalPaid: number;
  balance: number;
}

export interface PartnerSettlementResponse {
  partnerId: string;
  partnerName: string;
  sharePercentage: number;
  expectedContribution: number;
  actualPaid: number;
  settlementGap: number;
  partnerProfitShare: number;
  withdrawn: number;
  netProfitDue: number;
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  VENDOR_SUPPLY: 'Material on Credit',
  VENDOR_PAYMENT: 'Vendor Payment',
  PARTNER_SETTLEMENT: 'Adjustment',
  PROFIT_WITHDRAWAL: 'Profit Withdrawal',
  LEND: 'Lent Money',
  BORROW: 'Borrowed Money',
  REPAYMENT_GIVEN: 'Repaid Someone',
  REPAYMENT_RECEIVED: 'Received Repayment',
};

export const PERSONAL_TYPE_OPTIONS: { value: PersonalTransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expense (I paid)' },
  { value: 'INCOME', label: 'Income (I received)' },
  { value: 'LEND', label: 'Lent Money' },
  { value: 'BORROW', label: 'Borrowed Money' },
  { value: 'REPAYMENT_GIVEN', label: 'Repaid Someone' },
  { value: 'REPAYMENT_RECEIVED', label: 'Received Repayment' },
];

export const COUNTERPARTY_REQUIRED_TYPES: PersonalTransactionType[] = [
  'LEND',
  'BORROW',
  'REPAYMENT_GIVEN',
  'REPAYMENT_RECEIVED',
];

/**
 * Returns a friendly helper line for the personal-transaction form,
 * mirroring the centralized backend sign convention.
 */
export function counterpartyHelperText(type: PersonalTransactionType, name: string): string | null {
  const cp = name.trim() || 'them';
  switch (type) {
    case 'LEND':
      return `${cp} now owes you`;
    case 'BORROW':
      return `You now owe ${cp}`;
    case 'REPAYMENT_GIVEN':
      return `Reduces what you owe ${cp}`;
    case 'REPAYMENT_RECEIVED':
      return `Reduces what ${cp} owes you`;
    case 'EXPENSE':
      return name.trim() ? `Counted as money you gave to ${cp}` : null;
    case 'INCOME':
      return name.trim() ? `Counted as money you received from ${cp}` : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Project Installment & Receivable Engine
//
// CRITICAL: receivedAmount, remainingAmount, overCollected, and status are
// produced by the BACKEND. The frontend renders them as-is and never
// recomputes. See InstallmentService on the server for the derivation rules.
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  phone?: string;
  notes?: string;
}

export type InstallmentDerivedStatus =
  | 'PENDING'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'OVERDUE'
  | 'CANCELLED';

export interface Installment {
  id: string;
  projectId: string;
  customerId: string;
  customerName?: string;
  title: string;
  description?: string;
  expectedAmount: number;
  dueDate: string;
  /** Backend-derived. Render as-is, never recompute. */
  receivedAmount: number;
  /** Backend-derived. max(0, expected - received). */
  remainingAmount: number;
  /** Backend-derived. True when received > expected. */
  overCollected: boolean;
  /** Backend-derived authoritative status. */
  status: InstallmentDerivedStatus;
  /** Populated only by the single-installment endpoint. */
  linkedPayments?: Transaction[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentRequest {
  customerId: string;
  title: string;
  description?: string;
  expectedAmount: number;
  dueDate: string;
}

export interface InstallmentSummaryResponse {
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  installmentCounts: Record<InstallmentDerivedStatus, number>;
}

// ---------------------------------------------------------------------------
// Hidden Partner & Internal Settlement Engine
//
// PRIVATE OVERLAY. These types describe a creator-only redistribution layer
// on top of an official partner's slice. They never appear in official
// project routes (summary, partners, settlements). The backend stamps
// `visibilityScope = "PRIVATE"` on every payload so the UI can mark it
// clearly as internal-only.
//
// CRITICAL: sharePercentage is a percentage of the OFFICIAL PARTNER'S SLICE,
// not of the project. Effective project ownership is officialShare * share/100.
// ---------------------------------------------------------------------------

export type FinancialVisibilityScope = 'OFFICIAL' | 'PRIVATE';

export interface HiddenPartnerAgreement {
  id: string;
  projectId: string;
  officialPartnerId: string;
  officialPartnerName: string;
  hiddenPartnerName: string;
  hiddenPartnerUserId?: string;
  /** Percentage of the official partner's slice (0-100). */
  sharePercentage: number;
  notes?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  visibilityScope: FinancialVisibilityScope;
}

export interface HiddenPartnerAgreementRequest {
  officialPartnerId: string;
  hiddenPartnerName: string;
  /** Percentage of the official partner's slice (0-100). */
  sharePercentage: number;
  notes?: string;
}

export interface HiddenPartnerAgreementUpdateRequest {
  sharePercentage?: number;
  notes?: string;
}

export interface HiddenSettlementRow {
  /** Null on the synthetic "self" row representing the partner's retained slice. */
  agreementId: string | null;
  hiddenPartnerName: string;
  selfRetained: boolean;
  /** % of the official partner's slice. */
  sharePercentage: number;
  /** % of total project (officialShare * sharePercentage / 100). */
  effectiveProjectShare: number;
  /** Backend-derived. May be negative if the project is at a loss. */
  expectedProfit: number;
  /** Always 0 in v1 (derived layer; no withdrawal tracking yet). */
  withdrawn: number;
  /** expectedProfit - withdrawn. */
  pendingSettlement: number;
  visibilityScope: FinancialVisibilityScope;
}

export interface HiddenSettlementGroup {
  officialPartnerId: string;
  officialPartnerName: string;
  /** Copied from official partner settlement. */
  officialSharePercentage: number;
  officialProfitShare: number;
  totalHiddenSharePercentage: number;
  selfRetainedSharePercentage: number;
  rows: HiddenSettlementRow[];
}

export interface HiddenSettlementResponse {
  groups: HiddenSettlementGroup[];
  visibilityScope: FinancialVisibilityScope;
}
