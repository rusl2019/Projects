"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";
import { ComponentSpec, Specs } from "@/lib/inventory-data";

interface SpecSelectorProps {
  specTypeLabel: string; // e.g., "CPU"
  internalSpecType: keyof Specs; // e.g., "cpu"
  options: string[];
  selectedItems: ComponentSpec[];
  onAddSpec: (specType: keyof Specs, specName: string, specQty: number) => void;
  onRemoveSpec: (specType: keyof Specs, index: number) => void;
  isPending: boolean;
}

export default function SpecSelector({
  specTypeLabel,
  internalSpecType,
  options,
  selectedItems,
  onAddSpec,
  onRemoveSpec,
  isPending,
}: SpecSelectorProps) {
  const [specName, setSpecName] = useState('');
  const [specQty, setSpecQty] = useState(1);

  const handleAdd = () => {
    if (specName && specQty > 0) {
      onAddSpec(internalSpecType, specName, specQty);
      setSpecName('');
      setSpecQty(1);
    }
  };

  return (
    <div>
      {/* Input row */}
      <div className="spec-row flex items-end gap-2">
        <div className="flex-grow">
          <Select
            value={specName}
            onValueChange={setSpecName}
            disabled={isPending}
          >
            <SelectTrigger className="spec-select">
              <SelectValue placeholder={`-- Pilih ${specTypeLabel} --`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="number"
          value={specQty}
          onChange={(e) => setSpecQty(Number(e.target.value))}
          min="1"
          className="spec-qty"
          disabled={isPending}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !specName || specQty <= 0}
          className="h-9 px-3"
        >
          Tambah
        </Button>
      </div>

      {/* Display selected items */}
      {selectedItems.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-medium text-slate-600 mb-1">{specTypeLabel} Terpilih:</h4>
          <div className="space-y-1">
            {selectedItems.map((item, index) => (
              <div key={`${internalSpecType}-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                <span className="text-sm">{item.qty}x {item.name}</span>
                <Button
                  type="button"
                  onClick={() => onRemoveSpec(internalSpecType, index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
