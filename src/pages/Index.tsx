import { useState, useEffect, useMemo } from "react";
import { Plus, Search, ArrowUpDown, Tag, LayoutList, Filter, X, CalendarDays } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionSheet from "@/components/AddTransactionSheet";
import ManageTagsSheet from "@/components/ManageTagsSheet";
import ManageListsSheet from "@/components/ManageListsSheet";
import {
  addTransaction,
  deleteTransaction,
  subscribeToTransactions,
  type Transaction
} from "@/lib/firebase";

const DEFAULT_TAGS = ["fuel", "salary", "food", "shopping", "bills", "rent", "entertainment", "travel", "credit", "other"];
const DEFAULT_LISTS = ["List 1", "List 2", "List 3"];

type SortMode = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "name-asc";

const SORT_LABELS: Record<SortMode, string> = {
  "date-desc": "Newest",
  "date-asc": "Oldest",
  "amount-desc": "Highest",
  "amount-asc": "Lowest",
  "name-asc": "A-Z",
};

const parseDate = (d: string) => {
  const [day, month, year] = d.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

const Index = () => {
  const [lists, setLists] = useState<string[]>(() => {
    const saved = localStorage.getItem("expense-lists");
    return saved ? JSON.parse(saved) : DEFAULT_LISTS;
  });

  const [tags, setTags] = useState<string[]>(() => {
    const saved = localStorage.getItem("expense-tags");
    return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });

  const [activeList, setActiveList] = useState(lists[0]);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tagsSheetOpen, setTagsSheetOpen] = useState(false);
  const [listsSheetOpen, setListsSheetOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("date-desc");

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 🔥 REAL-TIME FIREBASE SYNC
  useEffect(() => {
    const unsub = subscribeToTransactions((data) => {
      setTransactions(data);

      // optional: cache locally for faster startup
      localStorage.setItem("transactions", JSON.stringify(data));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem("expense-lists", JSON.stringify(lists));
  }, [lists]);

  useEffect(() => {
    localStorage.setItem("expense-tags", JSON.stringify(tags));
  }, [tags]);

  const allTransactions = transactions;

  const filtered = useMemo(() => {
    let base = allTransactions
      .filter((t) => t.list === activeList)
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tag.toLowerCase().includes(search.toLowerCase())
      );

    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      base = base.filter((t) => parseDate(t.date) >= fromTs);
    }

    if (dateTo) {
      const toTs = new Date(dateTo).getTime() + 86400000;
      base = base.filter((t) => parseDate(t.date) < toTs);
    }

    return base.sort((a, b) => {
      switch (sortMode) {
        case "date-desc":
          return parseDate(b.date) - parseDate(a.date);
        case "date-asc":
          return parseDate(a.date) - parseDate(b.date);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [allTransactions, activeList, search, sortMode, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filtered]);

  // ✅ ADD (Firebase only)
  const handleAdd = async (data: Omit<Transaction, "id">) => {
    await addTransaction(data);
  };

  // ✅ DELETE (Firebase only)
  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
  };

  const handleAddList = (name: string) => setLists((prev) => [...prev, name]);

  const handleRemoveList = (name: string) => {
    const updated = lists.filter((l) => l !== name);
    setLists(updated);
    if (activeList === name) setActiveList(updated[0]);
  };

  const handleAddTag = (tag: string) => setTags((prev) => [...prev, tag]);

  const handleRemoveTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const cycleSortMode = () => {
    const modes: SortMode[] = ["date-desc", "date-asc", "amount-desc", "amount-asc", "name-asc"];
    const idx = modes.indexOf(sortMode);
    setSortMode(modes[(idx + 1) % modes.length]);
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* UI SAME AS BEFORE */}

      <div className="flex-1 overflow-y-auto pb-24 pt-1">
        <AnimatePresence>
          {filtered.map((t) => (
            <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">No transactions found</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSheetOpen(true)}
          className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center"
        >
          <Plus size={26} />
        </button>
      </div>

      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={handleAdd} activeList={activeList} tags={tags} />
      <ManageTagsSheet open={tagsSheetOpen} onClose={() => setTagsSheetOpen(false)} tags={tags} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
      <ManageListsSheet open={listsSheetOpen} onClose={() => setListsSheetOpen(false)} lists={lists} onAddList={handleAddList} onRemoveList={handleRemoveList} />
    </div>
  );
};

export default Index;