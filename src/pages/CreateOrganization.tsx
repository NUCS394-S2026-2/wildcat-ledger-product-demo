import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TopNav } from '../components/TopNav';
import { useLedger } from '../hooks/useLedger';
import { BudgetAllocations } from '../types';
import { formatCurrency } from '../utilities/calculations';
import { parseBudgetAllocation } from '../utilities/parseBudgetAllocation';

const EMPTY_ALLOCATIONS: BudgetAllocations = {
  ASG: 0,
  Operating: 0,
  Gifts: 0,
  'Debit Card': 0,
};

type ScanState = 'idle' | 'scanning' | 'done' | 'error';

export const CreateOrganization = () => {
  const { activeOrganization, initializeBudgetAllocations } = useLedger();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allocations, setAllocations] = useState<BudgetAllocations>(EMPTY_ALLOCATIONS);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeOrganization) {
      navigate('/organizations', { replace: true });
      return;
    }
    if (activeOrganization.isBudgetLinesSet) {
      navigate('/dashboard', { replace: true });
    }
  }, [activeOrganization, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const pdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsPdf(pdf);
    setUploadedFileName(file.name);
    setPreviewUrl(pdf ? null : URL.createObjectURL(file));
    setScanState('scanning');
    setScanError(null);
    setError(null);

    try {
      const result = await parseBudgetAllocation(file);
      setAllocations({
        ASG: result.ASG,
        Operating: result.Operating,
        Gifts: result.Gifts,
        'Debit Card': 0,
      });
      setScanState('done');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
      setScanState('error');
    }
  };

  const updateLine = (line: keyof Omit<BudgetAllocations, 'Debit Card'>, raw: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    const val = parseFloat(raw);
    setAllocations((prev) => ({ ...prev, [line]: isNaN(val) ? 0 : val }));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await initializeBudgetAllocations(allocations);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Failed to save budget allocations. Please try again.');
      setSubmitting(false);
    }
  };

  if (!activeOrganization) return null;

  const editableLines = ['ASG', 'Operating', 'Gifts'] as const;

  return (
    <div className="wl-register-root wl-topnav-offset">
      <TopNav />
      <div className="wl-register-card">
        <h1 className="wl-register-title">{activeOrganization.name}</h1>
        <p className="wl-register-subtitle">
          Upload your budget allocation document to get started.
        </p>

        {/* ── Upload area ── */}
        <div
          className={`wl-budget-upload-area ${scanState === 'scanning' ? 'wl-budget-upload-scanning' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {scanState === 'scanning' ? (
            <div className="wl-budget-upload-placeholder">
              <span className="wl-budget-upload-icon">⏳</span>
              <span className="wl-ocr-scanning">Scanning document…</span>
            </div>
          ) : previewUrl && !isPdf ? (
            <img
              src={previewUrl}
              alt="Budget document"
              className="wl-budget-upload-preview"
            />
          ) : isPdf && uploadedFileName && scanState !== 'idle' ? (
            <div className="wl-budget-upload-placeholder">
              <span className="wl-budget-upload-icon">📑</span>
              <span className="wl-budget-upload-filename">{uploadedFileName}</span>
            </div>
          ) : (
            <div className="wl-budget-upload-placeholder">
              <span className="wl-budget-upload-icon">📄</span>
              <span>Click to upload budget document</span>
              <span className="wl-budget-upload-hint">Image or PDF</span>
            </div>
          )}
        </div>

        {scanState === 'error' && (
          <div className="wl-form-error" style={{ marginTop: 8 }}>
            {scanError} — you can enter amounts manually below.
          </div>
        )}

        {/* ── Extracted values (editable) ── */}
        {(scanState === 'done' || scanState === 'error') && (
          <div className="wl-budget-allocation-form" style={{ marginTop: 20 }}>
            <p className="wl-budget-scan-label">
              {scanState === 'done'
                ? '✅ Review and confirm extracted amounts:'
                : 'Enter amounts manually:'}
            </p>
            {editableLines.map((line) => (
              <div key={line} className="wl-budget-allocation-row">
                <label className="wl-budget-allocation-label" htmlFor={`budget-${line}`}>
                  {line}
                </label>
                <div className="wl-budget-allocation-input-wrap">
                  <span className="wl-budget-allocation-prefix">$</span>
                  <input
                    id={`budget-${line}`}
                    type="text"
                    inputMode="decimal"
                    className="wl-form-input wl-budget-allocation-input"
                    value={
                      allocations[line] === 0
                        ? ''
                        : scanState === 'done'
                          ? allocations[line].toFixed(2)
                          : String(allocations[line])
                    }
                    placeholder="0.00"
                    disabled={scanState === 'done'}
                    onChange={(e) => updateLine(line, e.target.value)}
                  />
                </div>
                <span className="wl-budget-allocation-preview">
                  {formatCurrency(allocations[line])}
                </span>
              </div>
            ))}

            {/* Debit Card always $0 */}
            <div className="wl-budget-allocation-row wl-budget-allocation-fixed">
              <label className="wl-budget-allocation-label" htmlFor="budget-debit">
                Debit Card
              </label>
              <div className="wl-budget-allocation-input-wrap">
                <span className="wl-budget-allocation-prefix">$</span>
                <input
                  id="budget-debit"
                  type="text"
                  className="wl-form-input wl-budget-allocation-input"
                  value="0.00"
                  disabled
                />
              </div>
              <span className="wl-budget-allocation-preview wl-budget-allocation-fixed-label">
                Always $0.00
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="wl-form-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {(scanState === 'done' || scanState === 'error') && (
          <button
            type="button"
            className="wl-btn-primary wl-register-done"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving…' : 'Save & Continue'}
          </button>
        )}

        {(scanState === 'done' || scanState === 'error') && (
          <button
            type="button"
            className="wl-btn-secondary"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => {
              setPreviewUrl(null);
              setUploadedFileName(null);
              setIsPdf(false);
              setScanState('idle');
              setAllocations(EMPTY_ALLOCATIONS);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          >
            Upload a different image
          </button>
        )}
      </div>
    </div>
  );
};
