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
  | 'PROFIT_WITHDRAWAL';

export type TransactionStatus = 'ACTIVE' | 'OMITTED';

export interface Transaction {
  id: string;
  rootTransactionId: string;
  version: number;
  previousVersionId?: string;
  type: TransactionType;
  amount: number;
  projectId: string;
  vendorId?: string;
  partnerId?: string;
  paidByPartnerId?: string;
  purpose?: string;
  transactionDate: string;
  status: TransactionStatus;
  createdBy: string;
  createdAt: string;
}

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
};
