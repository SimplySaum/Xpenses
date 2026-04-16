import { useState, useEffect, useMemo } from "react";
import { Plus, Search, ArrowUpDown, Tag, LayoutList, Filter, X, CalendarDays } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import TransactionItem from "@/components/TransactionItem";
import AddTransactionSheet from "@/components/AddTransactionSheet";
import ManageTagsSheet from "@/components/ManageTagsSheet";
import ManageListsSheet from "@/components/ManageListsSheet";
import { addTransaction, deleteTransaction, subscribeToTransactions, subscribeToLists, addList, removeList, type Transaction } from "@/lib/firebase";

const DEFAULT_TAGS = ["fuel", "salary", "food", "shopping", "bills", "rent", "entertainment", "travel", "credit", "other"];
const DEFAULT_LISTS = ["List 1", "List 2", "List 3"];

type SortMode = "created-desc" | "created-asc" | "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "name-asc";

const SORT_LABELS: Record<SortMode, string> = {
  "created-desc": "Latest",
  "created-asc": "Earliest",
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
  const [sortMode, setSortMode] = useState<SortMode>("created-desc");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [useFirebase, setUseFirebase] = useState(false);
  const [firebaseLists, setFirebaseLists] = useState<string[] | null>(null);

  useEffect(() => {
    const unsub = subscribeToTransactions((data) => {
      setTransactions(data);
      setUseFirebase(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to lists from Firebase
  useEffect(() => {
    const unsub = subscribeToLists((data) => {
      if (data.length > 0) {
        setFirebaseLists(data);
        setLists(data);
      }
    });
    return () => unsub();
  }, []);

  // Seed default lists to Firebase on first use
  useEffect(() => {
    if (useFirebase && firebaseLists !== null && firebaseLists.length === 0) {
      DEFAULT_LISTS.forEach((l) => addList(l));
    }
  }, [useFirebase, firebaseLists]);

  useEffect(() => { localStorage.setItem("expense-lists", JSON.stringify(lists)); }, [lists]);
  useEffect(() => { localStorage.setItem("expense-tags", JSON.stringify(tags)); }, [tags]);

  // Keep activeList valid
  useEffect(() => {
    if (lists.length > 0 && !lists.includes(activeList)) {
      setActiveList(lists[0]);
    }
  }, [lists, activeList]);

  const allTransactions = useFirebase ? transactions : localTransactions;

  const filtered = useMemo(() => {
    let base = allTransactions
      .filter((t) => t.list === activeList)
      .filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tag.toLowerCase().includes(search.toLowerCase())
      );

    if (dateFrom) {
      const [y, m, d] = dateFrom.split("-").map(Number);
      const fromTs = new Date(y, m - 1, d).getTime();
      base = base.filter((t) => parseDate(t.date) >= fromTs);
    }
    if (dateTo) {
      const [y, m, d] = dateTo.split("-").map(Number);
      const toTs = new Date(y, m - 1, d).getTime() + 86400000 - 1;
      base = base.filter((t) => parseDate(t.date) <= toTs);
    }

    return base.sort((a, b) => {
      switch (sortMode) {
        case "created-desc": return (b.createdAt || 0) - (a.createdAt || 0);
        case "created-asc": return (a.createdAt || 0) - (b.createdAt || 0);
        case "date-desc": return parseDate(b.date) - parseDate(a.date);
        case "date-asc": return parseDate(a.date) - parseDate(b.date);
        case "amount-desc": return b.amount - a.amount;
        case "amount-asc": return a.amount - b.amount;
        case "name-asc": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [allTransactions, activeList, search, sortMode, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filtered]);

  const handleAdd = async (data: Omit<Transaction, "id">) => {
    if (useFirebase) {
      await addTransaction(data);
    } else {
      setLocalTransactions((prev) => [{ ...data, id: Date.now().toString(), createdAt: Date.now() }, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    if (useFirebase) {
      await deleteTransaction(id);
    } else {
      setLocalTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleAddList = async (name: string) => {
    if (useFirebase) {
      await addList(name);
    } else {
      setLists((prev) => [...prev, name]);
    }
  };

  const handleRemoveList = async (name: string) => {
    if (useFirebase) {
      await removeList(name);
    } else {
      setLists((prev) => prev.filter((l) => l !== name));
    }
    if (activeList === name) setActiveList(lists.filter((l) => l !== name)[0]);
  };

  const handleAddTag = (tag: string) => setTags((prev) => [...prev, tag]);
  const handleRemoveTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const cycleSortMode = () => {
    const modes: SortMode[] = ["created-desc", "created-asc", "date-desc", "date-asc", "amount-desc", "amount-asc", "name-asc"];
    const idx = modes.indexOf(sortMode);
    setSortMode(modes[(idx + 1) % modes.length]);
  };

  const hasDateFilter = dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 rounded-b-[2rem] px-5 pt-12 pb-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-extrabold text-primary-foreground tracking-tight">Expenses</h1>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setTagsSheetOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all"
              >
                <Tag size={17} />
              </button>
              <button
                onClick={() => setListsSheetOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all"
              >
                <LayoutList size={17} />
              </button>
              <button
                onClick={() => setSheetOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
              <p className="text-[10px] text-primary-foreground/60 font-medium uppercase tracking-wider">Income</p>
              <p className="text-sm font-bold text-success mt-0.5">+₹{totals.income.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
              <p className="text-[10px] text-primary-foreground/60 font-medium uppercase tracking-wider">Expense</p>
              <p className="text-sm font-bold text-primary-foreground mt-0.5">-₹{totals.expense.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-center">
              <p className="text-[10px] text-primary-foreground/60 font-medium uppercase tracking-wider">Balance</p>
              <p className={`text-sm font-bold mt-0.5 ${totals.balance >= 0 ? "text-success" : "text-destructive"}`}>
                ₹{Math.abs(totals.balance).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lists.map((list) => (
              <button
                key={list}
                onClick={() => setActiveList(list)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeList === list
                    ? "bg-primary-foreground text-primary shadow-lg shadow-black/10"
                    : "bg-primary-foreground/12 text-primary-foreground/70 hover:bg-primary-foreground/20"
                }`}
              >
                {list}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Sort + Filter */}
      <div className="px-4 py-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-card rounded-xl px-3 py-2.5 border border-border/50">
          <Search size={16} className="text-muted-foreground" />
          <input
            placeholder="Search.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
        </div>
        <button
          onClick={cycleSortMode}
          className="flex items-center gap-1 bg-card border border-border/50 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
          title={SORT_LABELS[sortMode]}
        >
          <ArrowUpDown size={15} />
          <span className="text-[10px] font-semibold">{SORT_LABELS[sortMode]}</span>
        </button>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center bg-card border rounded-xl px-3 py-2.5 transition-colors ${
            hasDateFilter ? "border-primary/50 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter size={15} />
        </button>
      </div>

      {/* Date Filter Panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarDays size={15} className="text-primary" />
                    Date Range
                  </div>
                  {hasDateFilter && (
                    <button
                      onClick={() => { setDateFrom(""); setDateTo(""); }}
                      className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-muted/60 rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/50 border border-border/30 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full bg-muted/60 rounded-xl px-3 py-2 text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/50 border border-border/30 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction List */}
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

      {/* FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSheetOpen(true)}
          className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
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
