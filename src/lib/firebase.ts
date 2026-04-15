import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
} from "firebase/firestore";

// 🔥 PUT YOUR REAL CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyCOVe0qEI0oeqnF5StJhhmZnJqhdeS01FI",
  authDomain: "a-project-4e19d.firebaseapp.com",
  projectId: "a-project-4e19d",
  storageBucket: "a-project-4e19d.firebasestorage.app",
  messagingSenderId: "691682171738",
  appId: "1:691682171738:web:5fd871b9be9bbd2a44b163",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export type TransactionType = "debit" | "credit";
export type TagType = string;

export interface Transaction {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  tag: TagType;
  date: string;
  list: string;
}

const COLLECTION = "transactions";

// ✅ Add transaction
export const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  await addDoc(collection(db, COLLECTION), transaction);
};

// ✅ Delete transaction
export const deleteTransaction = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION, id));
};

// ✅ Real-time listener (IMPORTANT)
export const subscribeToTransactions = (
  callback: (transactions: Transaction[]) => void
) => {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    callback(data);
  });
};