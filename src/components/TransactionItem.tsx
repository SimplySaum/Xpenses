import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Transaction } from "@/lib/firebase";
import ConfirmDialog from "./ConfirmDialog";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

const TransactionItem = ({ transaction, onDelete }: TransactionItemProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isCredit = transaction.type === "credit";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="flex items-center justify-between px-5 py-4 mx-3 mb-2 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 hover:bg-card/80 transition-colors"
      >
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-foreground text-[15px]">{transaction.name}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
              isCredit
                ? "bg-success/15 text-success"
                : "bg-primary/15 text-primary"
            }`}>
              {transaction.tag.charAt(0).toUpperCase() + transaction.tag.slice(1)}
            </span>
            <span className="text-[11px] text-muted-foreground">{transaction.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className={`font-bold text-[15px] tabular-nums ${isCredit ? "text-success" : "text-foreground"}`}>
            {isCredit ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <button
            onClick={() => setConfirmOpen(true)}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${transaction.name}"? This action cannot be undone.`}
        onConfirm={() => transaction.id && onDelete(transaction.id)}
      />
    </>
  );
};

export default TransactionItem;
