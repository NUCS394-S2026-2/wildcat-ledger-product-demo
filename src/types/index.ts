export type BudgetLine = 'ASG' | 'Operating' | 'Gifts' | 'Debit Card';

export type TransactionType =
  | 'Reimbursement'
  | 'Fundraiser deposit'
  | 'Debit card purchase'
  | 'Transfer'
  | 'Direct payment'
  | 'Other';

export type FundingSource = 'SOFO' | 'ASG' | 'Gift' | 'Fundraiser' | 'Transfer';

export type TransactionStatus = 'Draft' | 'Ready' | 'Submitted';

export type TransactionDirection = 'Inflow' | 'Outflow';

export type FilterType = 'All' | 'Inflow' | 'Outflow' | 'Flagged' | 'Submitted';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  direction: TransactionDirection;
  type: TransactionType;
  fundingSource: FundingSource;
  budgetLine: BudgetLine;
  person: string;
  date: string;
  status: TransactionStatus;
  hasReceipt: boolean;
  hasSignature: boolean;
  notes: string;
}

export interface BudgetLineSummaryData {
  line: BudgetLine;
  balance: number;
  inflow: number;
  outflow: number;
}

export interface OverallSummaryData {
  totalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  flaggedCount: number;
}

export type BudgetAllocations = Record<BudgetLine, number>;

export interface Organization {
  id: string;
  name: string;
  budgetAllocations: BudgetAllocations;
  transactions: Transaction[];
}

export interface LedgerContextValue {
  organizations: Organization[];
  addOrganization: (name: string, budgetAllocations: BudgetAllocations) => Promise<void>;
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
  activeOrganization: Organization | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  selectedBudgetLine: BudgetLine | null;
  setSelectedBudgetLine: (line: BudgetLine | null) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filteredTransactions: Transaction[];
  budgetLineSummaries: BudgetLineSummaryData[];
  overallSummary: OverallSummaryData;
}
