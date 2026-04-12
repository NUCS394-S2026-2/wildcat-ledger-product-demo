import React, { useState } from 'react';

import { useLedger } from '../hooks/useLedger';
import { BudgetLine, Transaction, TransactionType } from '../types';

type SupportedType = Extract<
  TransactionType,
  'Debit card purchase' | 'Direct payment' | 'Reimbursement' | 'Deposit'
>;

type FundingOption = 'ASG' | 'Operating' | 'Gifts';

interface AddTransactionFormProps {
  onSuccess?: () => void;
  existingTransaction?: Transaction;
}

interface FormState {
  title: string;
  amount: string;
  type: SupportedType;
  funding: FundingOption;
  // Debit card purchase
  receiptFile: File | null;
  // Direct payment
  contractFile: File | null;
  w9File: File | null;
  isIndividualVendor: boolean;
  contractedServicesFile: File | null;
  conflictOfInterestFile: File | null;
  // Reimbursement
  zelleInfo: string;
  notes: string;
}

const initialForm: FormState = {
  title: '',
  amount: '',
  type: 'Debit card purchase',
  funding: 'ASG',
  receiptFile: null,
  contractFile: null,
  w9File: null,
  isIndividualVendor: false,
  contractedServicesFile: null,
  conflictOfInterestFile: null,
  zelleInfo: '',
  notes: '',
};

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

const ZELLE_REGEX =
  /^([^\s@]+@[^\s@]+\.[^\s@]+|\+?1?\s*[-.]?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})$/;

const deriveBudgetLine = (type: SupportedType, funding: FundingOption): BudgetLine => {
  if (type === 'Debit card purchase') return 'Debit Card';
  return funding;
};

const deriveDirection = (type: SupportedType): 'Inflow' | 'Outflow' =>
  type === 'Deposit' ? 'Inflow' : 'Outflow';

export const AddTransactionForm = ({
  onSuccess,
  existingTransaction,
}: AddTransactionFormProps) => {
  const { addTransaction, updateTransaction, budgetLineSummaries } = useLedger();
  const isEditing = !!existingTransaction;

  const [form, setForm] = useState<FormState>(() => {
    if (existingTransaction) {
      const t = existingTransaction;
      const isSupportedType = (
        ['Debit card purchase', 'Direct payment', 'Reimbursement', 'Deposit'] as string[]
      ).includes(t.type);
      return {
        title: t.title,
        amount: String(t.amount),
        type: isSupportedType ? (t.type as SupportedType) : 'Debit card purchase',
        funding: (t.budgetLine === 'Debit Card' ? 'ASG' : t.budgetLine) as FundingOption,
        receiptFile: null,
        contractFile: null,
        w9File: null,
        isIndividualVendor: t.isIndividualVendor ?? false,
        contractedServicesFile: null,
        conflictOfInterestFile: null,
        zelleInfo: t.zelleInfo ?? '',
        notes: t.notes ?? '',
      };
    }
    return initialForm;
  });

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
    } else if (target instanceof HTMLInputElement && target.type === 'file') {
      setForm((prev) => ({ ...prev, [name]: target.files?.[0] ?? null }));
    } else if (name === 'amount') {
      // Strip everything that isn't a digit or decimal point, then enforce
      // at most one decimal point with at most 2 digits after it.
      const raw = target.value.replace(/[^\d.]/g, '');
      const parts = raw.split('.');
      const sanitized =
        parts.length > 2
          ? parts[0] + '.' + parts.slice(1).join('')
          : parts.length === 2
            ? parts[0] + '.' + parts[1].slice(0, 2)
            : parts[0];
      setForm((prev) => ({ ...prev, amount: sanitized }));
    } else {
      setForm((prev) => ({ ...prev, [name]: target.value }));
    }
    setError(null);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as SupportedType;
    setForm((prev) => ({
      ...prev,
      type: newType,
      // Reset deposit funding to a valid option (no ASG for Deposit)
      funding:
        newType === 'Deposit' && prev.funding === 'ASG' ? 'Operating' : prev.funding,
      // Clear files when type changes
      receiptFile: null,
      contractFile: null,
      w9File: null,
      isIndividualVendor: false,
      contractedServicesFile: null,
      conflictOfInterestFile: null,
      zelleInfo: '',
    }));
    setError(null);
  };

  const submitTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (isEditing && existingTransaction) {
      await updateTransaction(existingTransaction.id, transaction);
    } else {
      await addTransaction(transaction);
    }
    setForm(initialForm);
    setPendingTransaction(null);
    setOverdraftWarning(null);
    onSuccess?.();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!AMOUNT_REGEX.test(form.amount) || amount <= 0) {
      setError(
        'Enter a valid dollar amount (e.g. 12.50). No negative values or scientific notation.',
      );
      return;
    }

    // Type-specific validation
    if (form.type === 'Debit card purchase') {
      if (!form.receiptFile && !isEditing) {
        setError('A photo of the receipt is required.');
        return;
      }
    }

    if (form.type === 'Direct payment') {
      if (!form.contractFile && !isEditing) {
        setError('A photo of the contract is required.');
        return;
      }
      if (!form.w9File && !isEditing) {
        setError('A photo of the W-9 is required.');
        return;
      }
      if (form.isIndividualVendor) {
        if (!form.contractedServicesFile && !isEditing) {
          setError(
            'A photo of the Contracted Services Form is required for individual vendors.',
          );
          return;
        }
        if (!form.conflictOfInterestFile && !isEditing) {
          setError(
            'A photo of the Conflict of Interest Form is required for individual vendors.',
          );
          return;
        }
      }
    }

    if (form.type === 'Reimbursement') {
      if (!form.receiptFile && !isEditing) {
        setError('A photo of the receipt is required.');
        return;
      }
      if (!form.zelleInfo.trim()) {
        setError('Zelle information (email or phone number) is required.');
        return;
      }
      if (!ZELLE_REGEX.test(form.zelleInfo.trim())) {
        setError('Enter a valid Zelle email address or US phone number.');
        return;
      }
    }

    const budgetLine = deriveBudgetLine(form.type, form.funding);
    const direction = deriveDirection(form.type);

    const newTransaction: Omit<Transaction, 'id'> = {
      title: form.title.trim(),
      amount,
      direction,
      type: form.type,
      funding: form.type !== 'Debit card purchase' ? form.funding : undefined,
      budgetLine,
      notes: form.notes.trim(),
      zelleInfo: form.type === 'Reimbursement' ? form.zelleInfo.trim() : undefined,
      isIndividualVendor:
        form.type === 'Direct payment' ? form.isIndividualVendor : undefined,
      receiptFileName: form.receiptFile?.name,
      contractFileName: form.contractFile?.name,
      w9FileName: form.w9File?.name,
      contractedServicesFileName: form.contractedServicesFile?.name,
      conflictOfInterestFileName: form.conflictOfInterestFile?.name,
    };

    if (direction === 'Outflow') {
      const lineSummary = budgetLineSummaries.find((s) => s.line === budgetLine);
      if (lineSummary && amount > lineSummary.balance) {
        setPendingTransaction(newTransaction);
        setOverdraftWarning(
          `This outflow of $${amount.toFixed(2)} exceeds the current ${budgetLine} balance of $${lineSummary.balance.toFixed(2)}. The account will go negative. Do you want to proceed anyway?`,
        );
        return;
      }
    }

    await submitTransaction(newTransaction);
  };

  const showFunding =
    form.type === 'Direct payment' ||
    form.type === 'Reimbursement' ||
    form.type === 'Deposit';

  const fundingOptions: { value: FundingOption; label: string }[] =
    form.type === 'Deposit'
      ? [
          { value: 'Operating', label: 'Operations' },
          { value: 'Gifts', label: 'Gifts' },
        ]
      : [
          { value: 'ASG', label: 'ASG' },
          { value: 'Operating', label: 'Operations' },
          { value: 'Gifts', label: 'Gifts' },
        ];

  return (
    <form onSubmit={handleSubmit} className="wl-form" noValidate>
      {/* ── Always-visible fields ── */}
      <div className="wl-form-group">
        <label className="wl-form-label" htmlFor="title">
          Title <span className="wl-form-required">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="wl-form-input"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. DJ equipment rental"
        />
      </div>

      <div className="wl-form-group">
        <label className="wl-form-label" htmlFor="amount">
          Amount ($) <span className="wl-form-required">*</span>
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          className="wl-form-input"
          value={form.amount}
          onChange={handleChange}
          placeholder="0.00"
        />
      </div>

      <div className="wl-form-group">
        <label className="wl-form-label" htmlFor="type">
          Transaction Type <span className="wl-form-required">*</span>
        </label>
        <select
          id="type"
          name="type"
          className="wl-form-select"
          value={form.type}
          onChange={handleTypeChange}
        >
          <option value="Debit card purchase">Debit Card Purchase</option>
          <option value="Direct payment">Direct Payment</option>
          <option value="Reimbursement">Reimbursement</option>
          <option value="Deposit">Deposit</option>
        </select>
      </div>

      {/* ── Conditional expanded section ── */}
      <div className="wl-form-section">
        {/* Funding source (all types except Debit card purchase) */}
        {showFunding && (
          <div className="wl-form-group">
            <label className="wl-form-label" htmlFor="funding">
              Funding <span className="wl-form-required">*</span>
            </label>
            <select
              id="funding"
              name="funding"
              className="wl-form-select"
              value={form.funding}
              onChange={handleChange}
            >
              {fundingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Debit card purchase: receipt photo */}
        {form.type === 'Debit card purchase' && (
          <div className="wl-form-group">
            <label className="wl-form-label" htmlFor="receiptFile">
              Receipt Photo {!isEditing && <span className="wl-form-required">*</span>}
            </label>
            <input
              id="receiptFile"
              name="receiptFile"
              type="file"
              accept="image/*,application/pdf"
              className="wl-form-file"
              onChange={handleChange}
            />
            {isEditing && existingTransaction?.receiptFileName && (
              <span className="wl-form-file-existing">
                Current: {existingTransaction.receiptFileName}
              </span>
            )}
          </div>
        )}

        {/* Direct payment fields */}
        {form.type === 'Direct payment' && (
          <>
            <div className="wl-form-group">
              <label className="wl-form-label" htmlFor="contractFile">
                Contract Photo {!isEditing && <span className="wl-form-required">*</span>}
              </label>
              <input
                id="contractFile"
                name="contractFile"
                type="file"
                accept="image/*,application/pdf"
                className="wl-form-file"
                onChange={handleChange}
              />
              {isEditing && existingTransaction?.contractFileName && (
                <span className="wl-form-file-existing">
                  Current: {existingTransaction.contractFileName}
                </span>
              )}
            </div>

            <div className="wl-form-group">
              <label className="wl-form-label" htmlFor="w9File">
                W-9 Photo {!isEditing && <span className="wl-form-required">*</span>}
              </label>
              <input
                id="w9File"
                name="w9File"
                type="file"
                accept="image/*,application/pdf"
                className="wl-form-file"
                onChange={handleChange}
              />
              {isEditing && existingTransaction?.w9FileName && (
                <span className="wl-form-file-existing">
                  Current: {existingTransaction.w9FileName}
                </span>
              )}
            </div>

            <label className="wl-form-checkbox">
              <input
                type="checkbox"
                name="isIndividualVendor"
                checked={form.isIndividualVendor}
                onChange={handleChange}
              />
              <span>Is this an individual vendor?</span>
            </label>

            {form.isIndividualVendor && (
              <>
                <div className="wl-form-group">
                  <label className="wl-form-label" htmlFor="contractedServicesFile">
                    Contracted Services Form{' '}
                    {!isEditing && <span className="wl-form-required">*</span>}
                  </label>
                  <input
                    id="contractedServicesFile"
                    name="contractedServicesFile"
                    type="file"
                    accept="image/*,application/pdf"
                    className="wl-form-file"
                    onChange={handleChange}
                  />
                  {isEditing && existingTransaction?.contractedServicesFileName && (
                    <span className="wl-form-file-existing">
                      Current: {existingTransaction.contractedServicesFileName}
                    </span>
                  )}
                </div>

                <div className="wl-form-group">
                  <label className="wl-form-label" htmlFor="conflictOfInterestFile">
                    Conflict of Interest Form{' '}
                    {!isEditing && <span className="wl-form-required">*</span>}
                  </label>
                  <input
                    id="conflictOfInterestFile"
                    name="conflictOfInterestFile"
                    type="file"
                    accept="image/*,application/pdf"
                    className="wl-form-file"
                    onChange={handleChange}
                  />
                  {isEditing && existingTransaction?.conflictOfInterestFileName && (
                    <span className="wl-form-file-existing">
                      Current: {existingTransaction.conflictOfInterestFileName}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Reimbursement fields */}
        {form.type === 'Reimbursement' && (
          <>
            <div className="wl-form-group">
              <label className="wl-form-label" htmlFor="receiptFile">
                Receipt Photo {!isEditing && <span className="wl-form-required">*</span>}
              </label>
              <input
                id="receiptFile"
                name="receiptFile"
                type="file"
                accept="image/*,application/pdf"
                className="wl-form-file"
                onChange={handleChange}
              />
              {isEditing && existingTransaction?.receiptFileName && (
                <span className="wl-form-file-existing">
                  Current: {existingTransaction.receiptFileName}
                </span>
              )}
            </div>

            <div className="wl-form-group">
              <label className="wl-form-label" htmlFor="zelleInfo">
                Zelle Email or Phone Number <span className="wl-form-required">*</span>
              </label>
              <input
                id="zelleInfo"
                name="zelleInfo"
                type="text"
                className="wl-form-input"
                value={form.zelleInfo}
                onChange={handleChange}
                placeholder="e.g. vendor@email.com or (555) 123-4567"
              />
            </div>
          </>
        )}
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
          {isEditing ? 'Save Changes' : 'Add Transaction'}
        </button>
      )}
    </form>
  );
};
