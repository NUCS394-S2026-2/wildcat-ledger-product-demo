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

export interface LedgerContextValue {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  selectedBudgetLine: BudgetLine | null;
  setSelectedBudgetLine: (line: BudgetLine | null) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filteredTransactions: Transaction[];
  budgetLineSummaries: BudgetLineSummaryData[];
  overallSummary: OverallSummaryData;
}
