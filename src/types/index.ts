export type BudgetLine = 'ASG' | 'Operating' | 'Gifts' | 'Debit Card';

export type Funding = 'ASG' | 'Operating' | 'Gifts';

export type TransactionType =
  | 'Reimbursement'
  | 'Debit card purchase'
  | 'Direct payment'
  | 'Deposit';

export type TransactionDirection = 'Inflow' | 'Outflow';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  direction: TransactionDirection;
  type: TransactionType;
  funding?: Funding;
  budgetLine: BudgetLine;
  notes: string;
  // Reimbursement
  zelleInfo?: string;
  // Direct payment
  isIndividualVendor?: boolean;
  // Document filenames (stored when user attaches files)
  receiptFileName?: string;
  contractFileName?: string;
  w9FileName?: string;
  contractedServicesFileName?: string;
  conflictOfInterestFileName?: string;
}

export type AuditAction = 'create' | 'edit' | 'delete';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  performedBy: string;
  timestamp: number;
  transactionId: string;
  transactionTitle: string;
  before: Omit<Transaction, 'id'> | null;
  after: Omit<Transaction, 'id'> | null;
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
}

export type BudgetAllocations = Record<BudgetLine, number>;

export interface Organization {
  id: string;
  name: string;
  admins: string[];
  budgetAllocations: BudgetAllocations;
  isBudgetLinesSet: boolean;
  transactions: Transaction[];
}

export interface LedgerContextValue {
  auditLog: AuditEntry[];
  organizations: Organization[];
  addOrganization: (name: string, budgetAllocations: BudgetAllocations) => Promise<void>;
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
  activeOrganization: Organization | null;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudgetAllocations: (allocations: BudgetAllocations) => Promise<void>;
  initializeBudgetAllocations: (allocations: BudgetAllocations) => Promise<void>;
  selectedBudgetLine: BudgetLine | null;
  setSelectedBudgetLine: (line: BudgetLine | null) => void;
  filteredTransactions: Transaction[];
  budgetLineSummaries: BudgetLineSummaryData[];
  overallSummary: OverallSummaryData;
}
