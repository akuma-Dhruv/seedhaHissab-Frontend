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
