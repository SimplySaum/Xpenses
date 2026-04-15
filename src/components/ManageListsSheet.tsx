import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

interface ManageListsSheetProps {
  open: boolean;
  onClose: () => void;
  lists: string[];
  onAddList: (name: string) => void;
  onRemoveList: (name: string) => void;
}

const ManageListsSheet = ({ open, onClose, lists, onAddList, onRemoveList }: ManageListsSheetProps) => {
  const [newList, setNewList] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  if (!open) return null;

  const handleAdd = () => {
    const name = newList.trim();
    if (name && !lists.includes(name)) {
      onAddList(name);
      setNewList("");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-md bg-card rounded-t-3xl p-6 animate-slide-up border-t border-border/50 max-h-[70vh] overflow-y-auto">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Manage Lists</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            <input
              placeholder="New list name"
              value={newList}
              onChange={(e) => setNewList(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {lists.map((list) => (
              <div key={list} className="flex items-center justify-between bg-muted/60 rounded-xl px-4 py-3 border border-border/30">
                <span className="text-sm text-foreground font-medium">{list}</span>
                {lists.length > 1 && (
                  <button
                    onClick={() => setConfirmTarget(list)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title="Delete List"
        description={`Are you sure you want to delete "${confirmTarget}"? All transactions in this list will remain but won't be visible.`}
        onConfirm={() => {
          if (confirmTarget) {
            onRemoveList(confirmTarget);
            setConfirmTarget(null);
          }
        }}
      />
    </>
  );
};

export default ManageListsSheet;
