import { useState } from "react";
import { X } from "lucide-react";
import type { TransactionType } from "@/lib/firebase";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; amount: number; type: TransactionType; tag: string; date: string; list: string }) => void;
  activeList: string;
  tags?: string[];
}

const DEFAULT_TAGS = ["fuel", "salary", "food", "shopping", "bills", "rent", "entertainment", "travel", "other"];

const AddTransactionSheet = ({ open, onClose, onAdd, activeList, tags }: AddTransactionSheetProps) => {
  const allTags = tags || DEFAULT_TAGS;
  const debitTags = allTags.filter((t) => t !== "credit");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("debit");
  const [tag, setTag] = useState(debitTags[0] || "other");

  if (!open) return null;

  const handleSubmit = () => {
    if (!name || !amount) return;
    onAdd({
      name,
      amount: parseFloat(amount),
      type,
      tag: type === "credit" ? "credit" : tag,
      date: new Date().toLocaleDateString("en-IN"),
      list: activeList,
    });
    setName("");
    setAmount("");
    setType("debit");
    setTag(debitTags[0] || "other");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 animate-slide-up border-t border-border/50">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Add Transaction</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            placeholder="Transaction name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-muted/60 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm border border-border/30"
          />

          <input
            placeholder="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-muted/60 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm border border-border/30"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setType("debit")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                type === "debit"
                  ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                  : "bg-muted/60 text-muted-foreground border border-border/30"
              }`}
            >
              Debit
            </button>
            <button
              onClick={() => setType("credit")}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                type === "credit"
                  ? "bg-success text-success-foreground shadow-lg shadow-success/20"
                  : "bg-muted/60 text-muted-foreground border border-border/30"
              }`}
            >
              Credit
            </button>
          </div>

          {type === "debit" && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Category</p>
              <div className="flex flex-wrap gap-2">
                {debitTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      tag === t
                        ? "bg-primary/20 text-primary border border-primary/50 shadow-sm shadow-primary/10"
                        : "bg-muted/60 text-muted-foreground border border-border/30 hover:border-primary/30"
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:bg-primary/90"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionSheet;
