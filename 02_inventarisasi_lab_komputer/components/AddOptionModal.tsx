"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AddOptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
  showToast: (msg: string, colorClass?: string) => void;
}

export default function AddOptionModal({
  isOpen,
  onOpenChange,
  title,
  label,
  placeholder,
  onAdd,
  showToast,
}: AddOptionModalProps) {
  const [newValue, setNewValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newValue.trim()) {
      startTransition(async () => {
        await onAdd(newValue.trim());
        showToast(`${label} '${newValue.trim()}' ditambahkan!`, 'bg-emerald-600');
        setNewValue(""); // Clear input
        onOpenChange(false); // Close modal
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
            required
            disabled={isPending}
          />
          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm"
              disabled={isPending || !newValue.trim()}
            >
              {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : `Tambah ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
