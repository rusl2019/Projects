"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Import sonner toast
import { OptionActionResponse } from "@/lib/actions"; // Assuming this type is available from actions

interface AddOptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  placeholder: string;
  onAdd: (value: string) => Promise<OptionActionResponse>; // Updated return type
}

export default function AddOptionModal({
  isOpen,
  onOpenChange,
  title,
  label,
  placeholder,
  onAdd,
}: AddOptionModalProps) {
  const [newValue, setNewValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null); // State to hold validation error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (!newValue.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }

    startTransition(async () => {
      const result = await onAdd(newValue.trim()); // Call the action

      if (result.success) {
        toast.success(result.message || `${label} '${newValue.trim()}' berhasil ditambahkan!`);
        setNewValue(""); // Clear input
        onOpenChange(false); // Close modal
      } else {
        // Display validation error if available, otherwise generic message
        const errorMessage = result.errors?.name?.[0] || result.message || `Gagal menambahkan ${label}.`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) { // When modal closes, reset state
        setNewValue("");
        setError(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="text"
            placeholder={placeholder}
            value={newValue}
            onChange={(e) => {
              setNewValue(e.target.value);
              if (error) setError(null); // Clear error on change
            }}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
            required
            disabled={isPending}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>} {/* Display error message */}
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
