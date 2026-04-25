import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { db, storage } from '../config/firebase';

const FILE_TYPE_MAP: Record<string, { field: string; label: string }> = {
  receipt: { field: 'receiptFileUrl', label: 'Receipt' },
  contract: { field: 'contractFileUrl', label: 'RSO Agreement' },
  w9: { field: 'w9FileUrl', label: 'W-9' },
  contractedServices: {
    field: 'contractedServicesFileUrl',
    label: 'Contracted Services Form',
  },
  conflictOfInterest: {
    field: 'conflictOfInterestFileUrl',
    label: 'Conflict of Interest Form',
  },
};

export const UploadReceiptPage = () => {
  const [searchParams] = useSearchParams();
  const transactionId = searchParams.get('transactionId');
  const orgId = searchParams.get('orgId');
  const rawFileType = searchParams.get('fileType') ?? 'receipt';
  const fileType = rawFileType in FILE_TYPE_MAP ? rawFileType : 'receipt';
  const { field: firestoreField, label: docLabel } = FILE_TYPE_MAP[fileType];

  const [txnTitle, setTxnTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!transactionId || !orgId) {
      setLoadError('Invalid link — missing transaction or organization ID.');
      setLoading(false);
      return;
    }
    const txnRef = doc(db, 'clubs', orgId, 'transactions', transactionId);
    getDoc(txnRef)
      .then((snap) => {
        if (!snap.exists()) {
          setLoadError('Transaction not found.');
        } else {
          setTxnTitle((snap.data().title as string) ?? 'Unknown transaction');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError('Failed to load transaction details.');
        setLoading(false);
      });
  }, [transactionId, orgId]);

  const handleUpload = async () => {
    if (!file || !transactionId || !orgId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const path = `clubs/${orgId}/transactions/${transactionId}/${fileType}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const txnRef = doc(db, 'clubs', orgId, 'transactions', transactionId);
      await updateDoc(txnRef, { [firestoreField]: url });
      setSuccess(true);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="wl-upload-receipt-root">
        <div className="wl-upload-receipt-card">
          <p className="wl-upload-receipt-txn">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="wl-upload-receipt-root">
        <div className="wl-upload-receipt-card">
          <h1 className="wl-upload-receipt-title">Upload {docLabel}</h1>
          <p className="wl-form-error">{loadError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="wl-upload-receipt-root">
        <div className="wl-upload-receipt-card">
          <h1 className="wl-upload-receipt-title">Done!</h1>
          <p className="wl-upload-receipt-success">
            Your {docLabel} has been uploaded successfully.
          </p>
          <p className="wl-upload-receipt-txn">You can close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-upload-receipt-root">
      <div className="wl-upload-receipt-card">
        <h1 className="wl-upload-receipt-title">Upload {docLabel}</h1>
        {txnTitle && (
          <p className="wl-upload-receipt-txn">
            Transaction: <strong>{txnTitle}</strong>
          </p>
        )}
        <div className="wl-form-group">
          <label className="wl-form-label" htmlFor="upload-doc-file">
            {docLabel} (photo or PDF)
          </label>
          <input
            id="upload-doc-file"
            type="file"
            accept="image/*,application/pdf"
            className="wl-form-file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setUploadError(null);
            }}
          />
        </div>
        {uploadError && (
          <div className="wl-form-error" role="alert">
            {uploadError}
          </div>
        )}
        <button
          type="button"
          className="wl-btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading…' : `Upload ${docLabel}`}
        </button>
      </div>
    </div>
  );
};
