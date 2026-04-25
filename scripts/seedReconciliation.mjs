/**
 * seedReconciliation.mjs
 *
 * For every club in Firestore:
 *   1. Sets `lastReconciliationDate` on the club doc to the timestamp of its
 *      earliest transaction (if not already set and transactions exist).
 *   2. For every Debit Card transaction that doesn't yet have `reconciledAt`,
 *      sets `reconciledAt: null` (unreconciled).
 *
 * Run with:  node scripts/seedReconciliation.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

async function main() {
  const clubsSnap = await getDocs(collection(db, "clubs"));
  console.log(`Found ${clubsSnap.size} clubs`);

  let clubsUpdated = 0;
  let txnsUpdated  = 0;

  for (const clubDoc of clubsSnap.docs) {
    const clubData = clubDoc.data();
    const clubRef  = doc(db, "clubs", clubDoc.id);

    // --- transactions subcollection ---
    const txnsSnap = await getDocs(
      collection(db, "clubs", clubDoc.id, "transactions")
    );

    if (txnsSnap.empty) continue;

    // Set lastReconciliationDate to null if missing or incorrectly set to a number
    // (null = never reconciled; only set to a real timestamp when reconciliation occurs)
    if (clubData.lastReconciliationDate !== null &&
        clubData.lastReconciliationDate !== undefined ||
        !Object.prototype.hasOwnProperty.call(clubData, "lastReconciliationDate")) {
      await updateDoc(clubRef, { lastReconciliationDate: null });
      clubsUpdated++;
    }

    // For each Debit Card transaction, add reconciledAt: null if missing
    for (const txDoc of txnsSnap.docs) {
      const txData = txDoc.data();
      if (
        txData.budgetLine === "Debit Card" &&
        !Object.prototype.hasOwnProperty.call(txData, "reconciledAt")
      ) {
        await updateDoc(
          doc(db, "clubs", clubDoc.id, "transactions", txDoc.id),
          { reconciledAt: null }
        );
        txnsUpdated++;
      }
    }
  }

  console.log(`Done. Clubs updated: ${clubsUpdated}, Debit Card txns updated: ${txnsUpdated}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
