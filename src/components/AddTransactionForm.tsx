import React, { useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import {
  BudgetLine,
  FundingSource,
  Transaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from '../types';

interface AddTransactionFormProps {
  onSuccess?: () => void;
}

interface FormState {
  title: string;
  amount: string;
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

const today = new Date().toISOString().split('T')[0];

const initialForm: FormState = {
  title: '',
  amount: '',
  direction: 'Outflow',
  type: 'Reimbursement',
  fundingSource: 'SOFO',
  budgetLine: 'ASG',
  person: '',
  date: today,
  status: 'Draft',
  hasReceipt: false,
  hasSignature: false,
  notes: '',
};

export const AddTransactionForm = ({ onSuccess }: AddTransactionFormProps) => {
  const { addTransaction, budgetLineSummaries } = useLedger();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [overdraftWarning, setOverdraftWarning] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<Omit<
    Transaction,
    'id'
  > | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    const { name } = target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: target.value }));
    }
    setError(null);
  };

  const submitTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    await addTransaction(transaction);
    setForm(initialForm);
    setPendingTransaction(null);
    setOverdraftWarning(null);
    onSuccess?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    if (!form.person.trim()) {
      setError('Person responsible is required.');
      return;
    }

    const newTransaction: Omit<Transaction, 'id'> = {
      title: form.title.trim(),
      amount,
      direction: form.direction,
      type: form.type,
      fundingSource: form.fundingSource,
      budgetLine: form.budgetLine,
      person: form.person.trim(),
      date: form.date,
      status: form.status,
      hasReceipt: form.hasReceipt,
      hasSignature: form.hasSignature,
      notes: form.notes.trim(),
    };

    if (form.direction === 'Outflow') {
      const lineSummary = budgetLineSummaries.find((s) => s.line === form.budgetLine);
      if (lineSummary && amount > lineSummary.balance) {
        setPendingTransaction(newTransaction);
        setOverdraftWarning(
          `This outflow of $${amount.toFixed(2)} exceeds the current ${form.budgetLine} balance of $${lineSummary.balance.toFixed(2)}. The account will go negative. Do you want to proceed anyway?`,
        );
        return;
      }
    }

    await submitTransaction(newTransaction);
  };

  return (
    <form onSubmit={handleSubmit} className="wl-form" noValidate>
      <div className="wl-form-group">
        <label className="wl-form-label" htmlFor="title">
          Title / Description
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="wl-form-input"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Fundraiser deposit"
        />
      </div>

      <div className="wl-form-row">
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="amount">
            Amount ($)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            className="wl-form-input"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
          />
        </div>
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="direction">
            Direction
          </label>
          <select
            id="direction"
            name="direction"
            className="wl-form-select"
            value={form.direction}
            onChange={handleChange}
          >
            <option value="Inflow">Inflow</option>
            <option value="Outflow">Outflow</option>
          </select>
        </div>
      </div>

      <div className="wl-form-row">
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="type">
            Transaction Type
          </label>
          <select
            id="type"
            name="type"
            className="wl-form-select"
            value={form.type}
            onChange={handleChange}
          >
            <option value="Reimbursement">Reimbursement</option>
            <option value="Fundraiser deposit">Fundraiser deposit</option>
            <option value="Debit card purchase">Debit card purchase</option>
            <option value="Transfer">Transfer</option>
            <option value="Direct payment">Direct payment</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="fundingSource">
            Funding Source
          </label>
          <select
            id="fundingSource"
            name="fundingSource"
            className="wl-form-select"
            value={form.fundingSource}
            onChange={handleChange}
          >
            <option value="SOFO">SOFO</option>
            <option value="ASG">ASG</option>
            <option value="Gift">Gift</option>
            <option value="Fundraiser">Fundraiser</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      </div>

      <div className="wl-form-row">
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="budgetLine">
            Budget Line
          </label>
          <select
            id="budgetLine"
            name="budgetLine"
            className="wl-form-select"
            value={form.budgetLine}
            onChange={handleChange}
          >
            <option value="ASG">ASG</option>
            <option value="Operating">Operating</option>
            <option value="Gifts">Gifts</option>
            <option value="Debit Card">Debit Card</option>
          </select>
        </div>
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="wl-form-select"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Draft">Draft</option>
            <option value="Ready">Ready</option>
            <option value="Submitted">Submitted</option>
          </select>
        </div>
      </div>

      <div className="wl-form-row">
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="person">
            Person Responsible
          </label>
          <input
            id="person"
            name="person"
            type="text"
            className="wl-form-input"
            value={form.person}
            onChange={handleChange}
            placeholder="e.g. Alex Rivera"
          />
        </div>
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className="wl-form-input"
            value={form.date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="wl-form-checkboxes">
        <label className="wl-form-checkbox">
          <input
            type="checkbox"
            name="hasReceipt"
            checked={form.hasReceipt}
            onChange={handleChange}
          />
          <span>Receipt present</span>
        </label>
        <label className="wl-form-checkbox">
          <input
            type="checkbox"
            name="hasSignature"
            checked={form.hasSignature}
            onChange={handleChange}
          />
          <span>Signature present</span>
        </label>
      </div>

      <div className="wl-form-group">
        <label className="wl-form-label" htmlFor="notes">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          className="wl-form-textarea"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Any additional context..."
        />
      </div>

      {error && (
        <div className="wl-form-error" role="alert">
          {error}
        </div>
      )}

      {overdraftWarning && pendingTransaction && (
        <div className="wl-overdraft-warning" role="alert">
          <p>{overdraftWarning}</p>
          <div className="wl-overdraft-actions">
            <button
              type="button"
              className="wl-btn-warning"
              onClick={() => submitTransaction(pendingTransaction)}
            >
              Proceed anyway
            </button>
            <button
              type="button"
              className="wl-btn-cancel"
              onClick={() => {
                setOverdraftWarning(null);
                setPendingTransaction(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!overdraftWarning && (
        <button type="submit" className="wl-btn-primary">
          Add Transaction
        </button>
      )}
    </form>
  );
};
