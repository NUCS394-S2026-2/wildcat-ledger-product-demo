import {
  BudgetAllocations,
  BudgetLine,
  BudgetLineSummaryData,
  OverallSummaryData,
  Transaction,
} from '../types';

export const BUDGET_LINES: BudgetLine[] = ['ASG', 'Operating', 'Gifts', 'Debit Card'];

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
    return { line, balance: allocations[line], inflow, outflow };
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
  const totalBalance = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  return { totalBalance, totalInflow, totalOutflow };
};

export const applyFilters = (
  transactions: Transaction[],
  selectedBudgetLine: BudgetLine | null,
): Transaction[] => {
  if (selectedBudgetLine === null) return transactions;
  return transactions.filter((t) => t.budgetLine === selectedBudgetLine);
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
