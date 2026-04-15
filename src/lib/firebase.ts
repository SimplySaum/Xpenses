import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";

// TODO: Replace with your Firebase config
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

export const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  try {
    await addDoc(collection(db, COLLECTION), transaction);
  } catch (e) {
    console.error("Firebase not configured. Using local state only.", e);
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (e) {
    console.error("Firebase not configured.", e);
  }
};

export const subscribeToTransactions = (callback: (transactions: Transaction[]) => void) => {
  try {
    const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      callback(data);
    });
  } catch (e) {
    console.error("Firebase not configured.", e);
    return () => {};
  }
};
