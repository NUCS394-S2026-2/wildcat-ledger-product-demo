import {
  BudgetAllocations,
  BudgetLine,
  BudgetLineSummaryData,
  FilterType,
  OverallSummaryData,
  Transaction,
} from '../types';

export const BUDGET_LINES: BudgetLine[] = ['ASG', 'Operating', 'Gifts', 'Debit Card'];

export const isTransactionFlagged = (t: Transaction): boolean => {
  if (t.status === 'Draft') return true;
  if (t.direction === 'Outflow' && !t.hasReceipt) return true;
  if (t.direction === 'Outflow' && !t.hasSignature) return true;
  return false;
};

export const getMissingRequirements = (t: Transaction): string[] => {
  const missing: string[] = [];
  if (t.status === 'Draft') missing.push('Draft');
  if (t.direction === 'Outflow' && !t.hasReceipt) missing.push('No receipt');
  if (t.direction === 'Outflow' && !t.hasSignature) missing.push('No signature');
  return missing;
};

export const calculateBudgetLineSummaries = (
  transactions: Transaction[],
  allocations: BudgetAllocations,
): BudgetLineSummaryData[] =>
  BUDGET_LINES.map((line) => {
    const lineTransactions = transactions.filter((t) => t.budgetLine === line);
    const inflow = lineTransactions
      .filter((t) => t.direction === 'Inflow')
      .reduce((sum, t) => sum + t.amount, 0);
    const outflow = lineTransactions
      .filter((t) => t.direction === 'Outflow')
      .reduce((sum, t) => sum + t.amount, 0);
    return { line, balance: allocations[line] - outflow, inflow, outflow };
  });

export const calculateOverallSummary = (
  transactions: Transaction[],
  allocations: BudgetAllocations,
): OverallSummaryData => {
  const totalInflow = transactions
    .filter((t) => t.direction === 'Inflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutflow = transactions
    .filter((t) => t.direction === 'Outflow')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const flaggedCount = transactions.filter(isTransactionFlagged).length;
  return {
    totalBalance: totalAllocated - totalOutflow,
    totalInflow,
    totalOutflow,
    flaggedCount,
  };
};

export const applyFilters = (
  transactions: Transaction[],
  selectedBudgetLine: BudgetLine | null,
  activeFilter: FilterType,
): Transaction[] => {
  let filtered = [...transactions];

  if (selectedBudgetLine !== null) {
    filtered = filtered.filter((t) => t.budgetLine === selectedBudgetLine);
  }

  switch (activeFilter) {
    case 'Inflow':
      filtered = filtered.filter((t) => t.direction === 'Inflow');
      break;
    case 'Outflow':
      filtered = filtered.filter((t) => t.direction === 'Outflow');
      break;
    case 'Flagged':
      filtered = filtered.filter(isTransactionFlagged);
      break;
    case 'Submitted':
      filtered = filtered.filter((t) => t.status === 'Submitted');
      break;
    default:
      break;
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
