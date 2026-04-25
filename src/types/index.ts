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
  date?: string; // stored as YYYY-MM-DD
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
  // Document URLs (Firebase Storage download URLs)
  receiptFileUrl?: string;
  contractFileUrl?: string;
  w9FileUrl?: string;
  contractedServicesFileUrl?: string;
  conflictOfInterestFileUrl?: string;
}

export type AuditAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'request_edit'
  | 'request_delete'
  | 'approve'
  | 'reject'
  | 'cancel';

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

export interface PendingChange {
  id: string;
  type: 'edit' | 'delete';
  transactionId: string;
  transactionTitle: string;
  requestedBy: string;
  requestedByRole: 'treasurer' | 'president';
  requestedAt: number;
  before: Omit<Transaction, 'id'>;
  after: Omit<Transaction, 'id'> | null;
}

export type UserRole = 'treasurer' | 'president' | 'officer';

export interface Organization {
  id: string;
  name: string;
  admins: string[];
  treasurer?: string[];
  president?: string[];
  officers?: string[];
  budgetAllocations: BudgetAllocations;
  isBudgetLinesSet: boolean;
  transactions: Transaction[];
}

export interface LedgerContextValue {
  auditLog: AuditEntry[];
  pendingChanges: PendingChange[];
  organizations: Organization[];
  addOrganization: (name: string, budgetAllocations: BudgetAllocations) => Promise<void>;
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
  activeOrganization: Organization | null;
  userRole: UserRole | null;
  generateTransactionId: () => string;
  addTransaction: (transaction: Omit<Transaction, 'id'>, id?: string) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  approvePendingChange: (pendingId: string) => Promise<void>;
  rejectPendingChange: (pendingId: string) => Promise<void>;
  cancelPendingChange: (pendingId: string) => Promise<void>;
  updateBudgetAllocations: (allocations: BudgetAllocations) => Promise<void>;
  initializeBudgetAllocations: (allocations: BudgetAllocations) => Promise<void>;
  selectedBudgetLine: BudgetLine | null;
  setSelectedBudgetLine: (line: BudgetLine | null) => void;
  filteredTransactions: Transaction[];
  budgetLineSummaries: BudgetLineSummaryData[];
  overallSummary: OverallSummaryData;
}
