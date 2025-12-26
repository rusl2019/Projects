"use client";

import { useEffect, useReducer, useTransition, useCallback } from "react";
import { PlusCircle, Pencil, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addInventory, updateInventory } from "@/lib/actions";
import { InventoryItem, Specs, ComponentSpec } from "@/lib/inventory-data";

interface FormState {
  isEditing: boolean;
  editId: string | null;
  itemName: string;
  itemCategory: string;
  itemQty: number;
  itemStatus: string;
  itemLocation: string;
  itemDescription: string;
  specsCpu: string;
  specsCpuQty: number;
  specsRam: string;
  specsRamQty: number;
  specsGpu: string;
  specsGpuQty: number;
  specsStorage: string;
  specsStorageQty: number;
  specsPsu: string;
  specsPsuQty: number;
  specsCase: string;
  specsCaseQty: number;
  selectedCpus: ComponentSpec[];
  selectedRams: ComponentSpec[];
  selectedGpus: ComponentSpec[];
  selectedStorages: ComponentSpec[];
  selectedPsus: ComponentSpec[];
  selectedCases: ComponentSpec[];
  showSpecsContainer: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; payload: any }
  | { type: 'ADD_SPEC'; specType: keyof Specs; payload: ComponentSpec }
  | { type: 'REMOVE_SPEC'; specType: keyof Specs; index: number }
  | { type: 'SET_INITIAL_ITEM'; payload: InventoryItem | null; statuses: string[] }
  | { type: 'RESET'; statuses: string[] };

const initialFormState: FormState = {
  isEditing: false,
  editId: null,
  itemName: "",
  itemCategory: "",
  itemQty: 1,
  itemStatus: "", // Will be set by SET_INITIAL_ITEM or RESET
  itemLocation: "",
  itemDescription: "",
  specsCpu: "",
  specsCpuQty: 1,
  specsRam: "",
  specsRamQty: 1,
  specsGpu: "",
  specsGpuQty: 1,
  specsStorage: "",
  specsStorageQty: 1,
  specsPsu: "",
  specsPsuQty: 1,
  specsCase: "",
  specsCaseQty: 1,
  selectedCpus: [],
  selectedRams: [],
  selectedGpus: [],
  selectedStorages: [],
  selectedPsus: [],
  selectedCases: [],
  showSpecsContainer: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'ADD_SPEC': {
      const currentSpecs = state[('selected' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1)) as keyof FormState] as ComponentSpec[];
      return {
        ...state,
        [('selected' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1)) as keyof FormState]: [...currentSpecs, action.payload],
        [('specs' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1)) as keyof FormState]: "", // Clear input field
        [('specs' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1) + 'Qty') as keyof FormState]: 1, // Reset qty
      };
    }
    case 'REMOVE_SPEC': {
      const currentSpecs = state[('selected' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1)) as keyof FormState] as ComponentSpec[];
      const newSpecs = [...currentSpecs];
      newSpecs.splice(action.index, 1);
      return {
        ...state,
        [('selected' + action.specType.charAt(0).toUpperCase() + action.specType.slice(1)) as keyof FormState]: newSpecs,
      };
    }
    case 'SET_INITIAL_ITEM': {
      const item = action.payload;
      if (item) {
        return {
          ...state,
          isEditing: true,
          editId: item.id,
          itemName: item.name,
          itemCategory: item.category,
          itemQty: item.qty,
          itemStatus: item.status,
          itemLocation: item.location,
          itemDescription: item.description || "",
          selectedCpus: item.specs?.cpu || [],
          selectedRams: item.specs?.ram || [],
          selectedGpus: item.specs?.gpu || [],
          selectedStorages: item.specs?.storage || [],
          selectedPsus: item.specs?.psu || [],
          selectedCases: item.specs?.case || [],
          showSpecsContainer: item.category === "Set Komputer",
        };
      } else {
        return { ...initialFormState, itemStatus: action.statuses[0] || "" };
      }
    }
    case 'RESET':
      return { ...initialFormState, itemStatus: action.statuses[0] || "" };
    default:
      return state;
  }
}

interface InventoryFormProps {
  initialItem?: InventoryItem | null; // For editing existing item
  categories: string[];
  statuses: string[];
  locations: string[];
  allInventoryItems: InventoryItem[]; // To derive spec options
  showToast: (msg: string, colorClass?: string) => void;
  onFormSubmitted: () => void; // Callback to reset parent state if needed
  onAddCategoryClick: () => void;
  onAddStatusClick: () => void;
  onAddLocationClick: () => void;
}

export default function InventoryForm({
  initialItem,
  categories,
  statuses,
  locations,
  allInventoryItems,
  showToast,
  onFormSubmitted,
  onAddCategoryClick,
  onAddStatusClick,
  onAddLocationClick,
}: InventoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(formReducer, { ...initialFormState, itemStatus: statuses[0] || "" });

  const {
    isEditing,
    editId,
    itemName,
    itemCategory,
    itemQty,
    itemStatus,
    itemLocation,
    itemDescription,
    specsCpu,
    specsCpuQty,
    specsRam,
    specsRamQty,
    specsGpu,
    specsGpuQty,
    specsStorage,
    specsStorageQty,
    specsPsu,
    specsPsuQty,
    specsCase,
    specsCaseQty,
    selectedCpus,
    selectedRams,
    selectedGpus,
    selectedStorages,
    selectedPsus,
    selectedCases,
    showSpecsContainer,
  } = state;

  // Derive spec options from allInventoryItems
  const updateSpecSelectors = useCallback(() => {
    const cpuOptions: string[] = [];
    const ramOptions: string[] = [];
    const gpuOptions: string[] = [];
    const storageOptions: string[] = [];
    const psuOptions: string[] = [];
    const caseOptions: string[] = [];

    allInventoryItems.forEach((item) => {
      if (item.category === "Processor (CPU)" && !cpuOptions.includes(item.name)) cpuOptions.push(item.name);
      if (item.category === "Memori (RAM)" && !ramOptions.includes(item.name)) ramOptions.push(item.name);
      if (item.category === "Kartu Grafis (GPU)" && !gpuOptions.includes(item.name)) gpuOptions.push(item.name);
      if (item.category === "Penyimpanan (SSD/HDD)" && !storageOptions.includes(item.name)) storageOptions.push(item.name);
      if (item.category === "Power Supply (PSU)" && !psuOptions.includes(item.name)) psuOptions.push(item.name);
      if (item.category === "Casing PC" && !caseOptions.includes(item.name)) caseOptions.push(item.name);
    });

    return { cpuOptions, ramOptions, gpuOptions, storageOptions, psuOptions, caseOptions };
  }, [allInventoryItems]);

  const { cpuOptions, ramOptions, gpuOptions, storageOptions, psuOptions, caseOptions } = updateSpecSelectors();

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET', statuses });
    onFormSubmitted(); // Notify parent that form is reset/submitted
  }, [onFormSubmitted, statuses]);

  // Effect to populate form when initialItem changes (for editing)
  useEffect(() => {
    dispatch({ type: 'SET_INITIAL_ITEM', payload: initialItem, statuses });
  }, [initialItem, statuses]);

  // Effect to toggle specs container visibility based on category
  useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'showSpecsContainer', payload: itemCategory === "Set Komputer" });
  }, [itemCategory]);


  const addSpec = (specType: keyof Specs, specName: string, specQty: number) => {
    if (specName && specQty > 0) {
      dispatch({ type: 'ADD_SPEC', specType, payload: { name: specName, qty: specQty } });
    }
  };

  const removeSpec = (specType: keyof Specs, index: number) => {
    dispatch({ type: 'REMOVE_SPEC', specType, index });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let specs: Specs | null = null;
    if (itemCategory === "Set Komputer") {
      specs = {
        cpu: selectedCpus,
        ram: selectedRams,
        gpu: selectedGpus,
        storage: selectedStorages,
        psu: selectedPsus,
        case: selectedCases,
      };
    }

    const newItemData = {
      name: itemName,
      category: itemCategory,
      qty: itemQty,
      status: itemStatus,
      location: itemLocation,
      description: itemDescription,
      specs: specs,
    };

    startTransition(async () => {
      if (isEditing && editId !== null) {
        const result = await updateInventory({ ...newItemData, id: editId } as InventoryItem);
        if (result) {
          showToast("DATA BERHASIL DIPERBARUI", "bg-blue-600");
        } else {
          showToast("Gagal memperbarui data.", "bg-rose-600");
        }
      } else {
        const result = await addInventory(newItemData);
        if (result) {
          showToast("DATA BARU DITAMBAHKAN", "bg-emerald-600");
        } else {
          showToast("Gagal menambahkan data baru.", "bg-rose-600");
        }
      }
      resetForm();
    });
  };

  return (
    <div className="lg:col-span-1">
      <Card id="form-card" className="glass-morphism sticky top-24 transition-all duration-300 p-6 rounded-2xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {isEditing ? (
              <Pencil className={`h-5 w-5 text-amber-600`} />
            ) : (
              <PlusCircle className={`h-5 w-5 text-blue-600`} />
            )}
            {isEditing ? "Edit Inventori" : "Tambah Inventori Baru"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="inventory-form" className="space-y-4" onSubmit={handleSubmit}>
            <input type="hidden" id="edit-id" value={editId || ""} />

            <div>
              <Label
                htmlFor="item-name"
                className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"
              >
                Nama Barang / Label Set
              </Label>
              <Input
                type="text"
                id="item-name"
                required
                placeholder="Contoh: PC-RAKIT-01"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 font-medium"
                value={itemName}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'itemName', payload: e.target.value })}
                disabled={isPending}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label
                  htmlFor="item-category"
                  className="block text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  Kategori
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddCategoryClick}
                  className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
              <Select
                value={itemCategory}
                onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'itemCategory', payload: value })}
                disabled={isPending}
              >
                <SelectTrigger id="item-category" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <SelectValue placeholder="-- Pilih Kategori --" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              id="specs-container"
              className={`p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3 shadow-sm ${
                showSpecsContainer ? "" : "hidden"
              }`}
            >
              <h3 className="text-[10px] font-bold text-slate-700 uppercase">
                Rincian Komponen Terpasang
              </h3>
              <div className="space-y-3">
                {/* CPU Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsCpu}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsCpu', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-cpu" className="spec-select">
                        <SelectValue placeholder="-- Pilih CPU --" />
                      </SelectTrigger>
                      <SelectContent>
                        {cpuOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-cpu-qty"
                    value={specsCpuQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsCpuQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('cpu', specsCpu, specsCpuQty)}
                    disabled={isPending || !specsCpu || specsCpuQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected CPUs */}
                {selectedCpus.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">CPU Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedCpus.map((cpu, index) => (
                        <div key={`cpu-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{cpu.qty}x {cpu.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('cpu', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RAM Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsRam}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsRam', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-ram" className="spec-select">
                        <SelectValue placeholder="-- Pilih RAM --" />
                      </SelectTrigger>
                      <SelectContent>
                        {ramOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-ram-qty"
                    value={specsRamQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsRamQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('ram', specsRam, specsRamQty)}
                    disabled={isPending || !specsRam || specsRamQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected RAMs */}
                {selectedRams.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">RAM Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedRams.map((ram, index) => (
                        <div key={`ram-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{ram.qty}x {ram.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('ram', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GPU Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsGpu}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsGpu', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-gpu" className="spec-select">
                        <SelectValue placeholder="-- Pilih GPU --" />
                      </SelectTrigger>
                      <SelectContent>
                        {gpuOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-gpu-qty"
                    value={specsGpuQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsGpuQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('gpu', specsGpu, specsGpuQty)}
                    disabled={isPending || !specsGpu || specsGpuQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected GPUs */}
                {selectedGpus.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">GPU Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedGpus.map((gpu, index) => (
                        <div key={`gpu-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{gpu.qty}x {gpu.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('gpu', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsStorage}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsStorage', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-storage" className="spec-select">
                        <SelectValue placeholder="-- Pilih Storage --" />
                      </SelectTrigger>
                      <SelectContent>
                        {storageOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-storage-qty"
                    value={specsStorageQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsStorageQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('storage', specsStorage, specsStorageQty)}
                    disabled={isPending || !specsStorage || specsStorageQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected Storages */}
                {selectedStorages.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Storage Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedStorages.map((storage, index) => (
                        <div key={`storage-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{storage.qty}x {storage.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('storage', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PSU Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsPsu}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsPsu', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-psu" className="spec-select">
                        <SelectValue placeholder="-- Pilih PSU --" />
                      </SelectTrigger>
                      <SelectContent>
                        {psuOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-psu-qty"
                    value={specsPsuQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsPsuQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('psu', specsPsu, specsPsuQty)}
                    disabled={isPending || !specsPsu || specsPsuQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected PSUs */}
                {selectedPsus.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">PSU Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedPsus.map((psu, index) => (
                        <div key={`psu-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{psu.qty}x {psu.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('psu', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Selection */}
                <div className="spec-row flex items-end gap-2">
                  <div className="flex-grow">
                    <Select
                      value={specsCase}
                      onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'specsCase', payload: value })}
                      disabled={isPending}
                    >
                      <SelectTrigger id="spec-case" className="spec-select">
                        <SelectValue placeholder="-- Pilih Casing --" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseOptions.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    id="spec-case-qty"
                    value={specsCaseQty}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'specsCaseQty', payload: Number(e.target.value) })}
                    min="1"
                    className="w-16"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    onClick={() => addSpec('case', specsCase, specsCaseQty)}
                    disabled={isPending || !specsCase || specsCaseQty <= 0}
                    className="h-9 px-3"
                  >
                    Tambah
                  </Button>
                </div>

                {/* Display selected Cases */}
                {selectedCases.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-medium text-slate-600 mb-1">Casing Terpilih:</h4>
                    <div className="space-y-1">
                      {selectedCases.map((caseItem, index) => (
                        <div key={`case-${index}`} className="flex justify-between items-center bg-slate-200 p-2 rounded">
                          <span className="text-sm">{caseItem.qty}x {caseItem.name}</span>
                          <Button
                            type="button"
                            onClick={() => removeSpec('case', index)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="item-qty"
                  className="block text-xs font-bold text-slate-500 mb-1 uppercase"
                >
                  Stok Unit
                </Label>
                <Input
                  type="number"
                  id="item-qty"
                  min="1"
                  required
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  value={itemQty}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'itemQty', payload: Number(e.target.value) })}
                  disabled={isPending}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label
                    htmlFor="item-status"
                    className="block text-xs font-bold text-slate-500 uppercase"
                  >
                    Kondisi
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddStatusClick}
                    className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                <Select
                  value={itemStatus}
                  onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'itemStatus', payload: value })}
                  disabled={isPending}
                >
                  <SelectTrigger id="item-status" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                    <SelectValue placeholder="-- Pilih Kondisi --" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label
                  htmlFor="item-location"
                  className="block text-xs font-bold text-slate-500 uppercase"
                >
                  Lokasi
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAddLocationClick}
                  className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              </div>
              <Select
                value={itemLocation}
                onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'itemLocation', payload: value })}
                disabled={isPending}
              >
                <SelectTrigger id="item-location" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                  <SelectValue placeholder="-- Pilih Lokasi --" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="item-description"
                className="block text-xs font-bold text-slate-500 mb-1 uppercase"
              >
                Deskripsi / Spesifikasi
              </Label>
              <Textarea
                id="item-description"
                placeholder="Masukkan deskripsi atau spesifikasi item (misal: Kondisi fisik, aksesoris, dll.)"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm min-h-[80px]"
                value={itemDescription}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'itemDescription', payload: e.target.value })}
                disabled={isPending}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                id="submit-btn"
                className={`w-full ${
                  isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-700 hover:bg-blue-800"
                } text-white font-bold py-3 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 text-sm uppercase`}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                ) : (
                  <span id="btn-text">
                    {isEditing ? "Perbarui Data" : "Simpan ke Sistem"}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                id="cancel-edit"
                onClick={resetForm}
                className={`${
                  isEditing ? "" : "hidden"
                } w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-lg text-sm uppercase`}
                disabled={isPending}
              >
                Batal Edit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
