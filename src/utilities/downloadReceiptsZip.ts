/**
 * downloadReceiptsZip.ts
 * Bundles receipt files from the given transactions into a ZIP and triggers
 * a browser download.
 *
 * ZIP structure:
 *   receipts/
 *     {date}_{slug}/
 *       receipt.{ext}
 */

import { getBlob, ref } from 'firebase/storage';
import JSZip from 'jszip';

import { storage } from '../config/firebase';
import { Transaction } from '../types';

/** Turns a transaction title into a safe folder-name slug */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/**
 * Extracts the Firebase Storage object path from a download URL.
 * Firebase Storage URLs look like:
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media&token=...
 * Returns null if the URL is not a Firebase Storage URL.
 */
function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('firebasestorage.googleapis.com')) return null;
    const match = u.pathname.match(/^\/v0\/b\/[^/]+\/o\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/** Returns a file extension from a blob's MIME type */
function extFromMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/tiff': 'tiff',
  };
  return map[mimeType.toLowerCase()] ?? 'bin';
}

/**
 * Downloads a file as a Blob using the Firebase Storage SDK (bypasses CORS).
 * Falls back to fetch() for non-Firebase URLs.
 * Both paths have a 30-second timeout to prevent hanging.
 */
async function fetchBlob(url: string, timeoutMs = 30_000): Promise<Blob> {
  const storagePath = storagePathFromUrl(url);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Download timed out after 30 s')), timeoutMs),
  );

  if (storagePath) {
    return Promise.race([getBlob(ref(storage, storagePath)), timeout]);
  }

  // Fallback for non-Firebase URLs
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await Promise.race([fetch(url, { signal: controller.signal }), timeout]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadReceiptsZip(
  transactions: Transaction[],
  zipName = 'receipts.zip',
): Promise<void> {
  const zip = new JSZip();
  const receiptsFolder = zip.folder('receipts')!;

  const withReceipts = transactions.filter((t) => t.receiptFileUrl);

  if (withReceipts.length === 0) {
    throw new Error('No receipts to download.');
  }

  await Promise.all(
    withReceipts.map(async (t) => {
      const url = t.receiptFileUrl!;
      const date = t.date ?? 'undated';
      const slug = slugify(t.title);
      const folderName = `${date}_${slug}`;

      try {
        console.log(`[ZIP] Fetching receipt for "${t.title}" — url: ${url}`);
        const blob = await fetchBlob(url);
        console.log(
          `[ZIP] Got blob for "${t.title}" — size: ${blob.size}, type: ${blob.type}`,
        );
        const ext = extFromMimeType(blob.type);
        console.log(`[ZIP] Writing receipt.${ext} for "${t.title}"`);
        receiptsFolder.folder(folderName)!.file(`receipt.${ext}`, blob);
      } catch (err) {
        console.error(`[ZIP] Failed to fetch receipt for "${t.title}":`, err);
        receiptsFolder
          .folder(folderName)!
          .file(
            'receipt_unavailable.txt',
            `Could not download receipt for: ${t.title}\nError: ${err instanceof Error ? err.message : String(err)}`,
          );
      }
    }),
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(a.href);
}
