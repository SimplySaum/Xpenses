import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, setDoc, getDocs } from "firebase/firestore";

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
  createdAt?: number;
}

const COLLECTION = "transactions";
const LISTS_COLLECTION = "lists";

export const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  try {
    await addDoc(collection(db, COLLECTION), {
      ...transaction,
      createdAt: Date.now(),
    });
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
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
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

// Lists sync
export const addList = async (name: string) => {
  try {
    await setDoc(doc(db, LISTS_COLLECTION, name), { name, createdAt: Date.now() });
  } catch (e) {
    console.error("Error adding list", e);
  }
};

export const removeList = async (name: string) => {
  try {
    await deleteDoc(doc(db, LISTS_COLLECTION, name));
  } catch (e) {
    console.error("Error removing list", e);
  }
};

export const subscribeToLists = (callback: (lists: string[]) => void) => {
  try {
    const q = query(collection(db, LISTS_COLLECTION), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data().name as string);
      callback(data);
    });
    } catch (e) {
    console.error("Error subscribing to lists", e);
    return () => {};
  }
};
