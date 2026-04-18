/**
 * Reads club_officers.csv and creates/updates each club in Firestore with:
 *   presidents: [email, ...]
 *   treasurers: [email, ...]
 *   officers:   [email, ...]
 *
 * Run with:  node scripts/importAdmins.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, setDoc, deleteField } from "firebase/firestore";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
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

const CSV_PATH = "/Users/coreyzhang/Downloads/club_officers.csv";

function decodeHTML(str) {
  return str
    .replace(/&amp;/g,  "&")
    .replace(/&#39;/g,  "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

// Read CSV → { clubName: { presidents: Set, treasurers: Set, officers: Set } }
async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const clubs = {};
    createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on("data", (row) => {
        const name  = decodeHTML(row.club_name?.trim() || "");
        const email = row.email?.trim();
        const role  = row.role?.trim().toLowerCase();
        if (!name || !email) return;

        if (!clubs[name]) clubs[name] = { presidents: new Set(), treasurers: new Set(), officers: new Set() };

        if (role === "president")       clubs[name].presidents.add(email);
        else if (role === "treasurer")  clubs[name].treasurers.add(email);
        else                            clubs[name].officers.add(email);
      })
      .on("end",   () => resolve(clubs))
      .on("error", reject);
  });
}

async function importAdmins() {
  console.log("Reading CSV...");
  const clubs = await readCSV(CSV_PATH);
  const clubNames = Object.keys(clubs);
  console.log(`Found ${clubNames.length} clubs.\n`);

  let created = 0, updated = 0;

  for (const clubName of clubNames) {
    const { presidents, treasurers, officers } = clubs[clubName];

    const fields = {
      presidents: Array.from(presidents),
      treasurers: Array.from(treasurers),
      officers:   Array.from(officers),
    };

    // Check if club already exists
    let existingRef = null;
    for (const field of ["name", "clubName"]) {
      const snap = await getDocs(query(collection(db, "clubs"), where(field, "==", clubName)));
      if (!snap.empty) {
        existingRef = snap.docs[0].ref;
        break;
      }
    }

    if (existingRef) {
      await updateDoc(existingRef, { ...fields, admins: deleteField() });
      console.log(`  ✓ updated: ${clubName} — ${fields.presidents.length} presidents, ${fields.treasurers.length} treasurers, ${fields.officers.length} officers`);
      updated++;
    } else {
      const docId = clubName.replace(/[^a-zA-Z0-9]/g, "_");
      await setDoc(doc(db, "clubs", docId), {
        name:              clubName,
        ...fields,
        budgetAllocations: {},
        isBudgetLinesSet:  false,
      });
      console.log(`  + created: ${clubName} — ${fields.presidents.length} presidents, ${fields.treasurers.length} treasurers, ${fields.officers.length} officers`);
      created++;
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`);
  process.exit(0);
}

importAdmins().catch((err) => {
  console.error(err);
  process.exit(1);
});
