"use client";

import { useEffect, useReducer, useTransition, useCallback, useState } from "react";
import { PlusCircle, Pencil, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { addInventory, updateInventory } from "@/lib/actions";
import { InventoryItem, Specs, ComponentSpec } from "@/lib/inventory-data";
import { toast } from "sonner";
import SpecSelector from "./SpecSelector";

// The form's state now manages the full ComponentSpec, including the optional id
interface FormState {
  isEditing: boolean;
  editId: string | null;
  itemName: string;
  itemCategory: string;
  itemQty: number;
  itemStatus: string;
  itemLocation: string;
  itemDescription: string;
  selectedCpus: ComponentSpec[];
  selectedMotherboards: ComponentSpec[];
  selectedRams: ComponentSpec[];
  selectedGpus: ComponentSpec[];
  selectedStorages: ComponentSpec[];
  selectedPsus: ComponentSpec[];
  selectedCases: ComponentSpec[];
  showSpecsContainer: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; payload: any }
  | { type: 'ADD_SPEC'; specType: keyof Specs; payload: ComponentSpec } // Payload is now the full ComponentSpec
  | { type: 'REMOVE_SPEC'; specType: keyof Specs; index: number }
  | { type: 'SET_INITIAL_ITEM'; payload: InventoryItem | null; statuses: string[] }
  | { type: 'RESET'; statuses: string[] };

const initialFormState: FormState = {
  isEditing: false,
  editId: null,
  itemName: "",
  itemCategory: "",
  itemQty: 1,
  itemStatus: "",
  itemLocation: "",
  itemDescription: "",
  selectedCpus: [],
  selectedMotherboards: [],
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
      const specKeyMap: { [key in keyof Specs]: keyof FormState } = {
        cpu: 'selectedCpus',
        motherboard: 'selectedMotherboards',
        ram: 'selectedRams',
        gpu: 'selectedGpus',
        storage: 'selectedStorages',
        psu: 'selectedPsus',
        case: 'selectedCases',
      };
      const keyToUpdate = specKeyMap[action.specType];
      const currentSpecs = state[keyToUpdate] as ComponentSpec[];
      return {
        ...state,
        [keyToUpdate]: [...currentSpecs, action.payload],
      };
    }
    case 'REMOVE_SPEC': {
       const specKeyMap: { [key in keyof Specs]: keyof FormState } = {
        cpu: 'selectedCpus',
        motherboard: 'selectedMotherboards',
        ram: 'selectedRams',
        gpu: 'selectedGpus',
        storage: 'selectedStorages',
        psu: 'selectedPsus',
        case: 'selectedCases',
      };
      const keyToUpdate = specKeyMap[action.specType];
      const currentSpecs = state[keyToUpdate] as ComponentSpec[];
      const newSpecs = [...currentSpecs];
      newSpecs.splice(action.index, 1);
      return {
        ...state,
        [keyToUpdate]: newSpecs,
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
          selectedMotherboards: item.specs?.motherboard || [],
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
  initialItem?: InventoryItem | null;
  categories: string[];
  statuses: string[];
  locations: string[];
  allInventoryItems: InventoryItem[];
  onFormSubmitted: () => void;
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
  onFormSubmitted,
  onAddCategoryClick,
  onAddStatusClick,
  onAddLocationClick,
}: InventoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, dispatch] = useReducer(formReducer, { ...initialFormState, itemStatus: statuses[0] || "" });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({}); // State for validation errors

  const {
    isEditing,
    editId,
    itemName,
    itemCategory,
    itemQty,
    itemStatus,
    itemLocation,
    itemDescription,
    selectedCpus,
    selectedMotherboards,
    selectedRams,
    selectedGpus,
    selectedStorages,
    selectedPsus,
    selectedCases,
    showSpecsContainer,
  } = state;

  // REFACTORED: This function now returns options as { id, name } objects
  const updateSpecSelectors = useCallback(() => {
    const componentOptions: { [key: string]: { id: string; name: string }[] } = {
      cpuOptions: [],
      motherboardOptions: [],
      ramOptions: [],
      gpuOptions: [],
      storageOptions: [],
      psuOptions: [],
      caseOptions: [],
    };

    const categoryMap: { [key: string]: keyof typeof componentOptions } = {
      "Processor (CPU)": "cpuOptions",
      "Motherboard": "motherboardOptions",
      "Memori (RAM)": "ramOptions",
      "Kartu Grafis (GPU)": "gpuOptions",
      "Penyimpanan (SSD/HDD)": "storageOptions",
      "Power Supply (PSU)": "psuOptions",
      "Casing PC": "caseOptions",
    };

    allInventoryItems.forEach((item) => {
      const optionKey = categoryMap[item.category];
      if (optionKey) {
        componentOptions[optionKey].push({ id: item.id, name: item.name });
      }
    });

    return componentOptions;
  }, [allInventoryItems]);

  const { cpuOptions, motherboardOptions, ramOptions, gpuOptions, storageOptions, psuOptions, caseOptions } = updateSpecSelectors();

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET', statuses });
    setValidationErrors({}); // Clear errors on form reset
    onFormSubmitted();
  }, [onFormSubmitted, statuses]);

  useEffect(() => {
    dispatch({ type: 'SET_INITIAL_ITEM', payload: initialItem, statuses });
    setValidationErrors({}); // Clear errors when initial item changes (e.g., switching from edit to add)
  }, [initialItem, statuses]);

  useEffect(() => {
    dispatch({ type: 'SET_FIELD', field: 'showSpecsContainer', payload: itemCategory === "Set Komputer" });
    if (itemCategory !== "Set Komputer") {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.specs; // Clear specs errors if category changes
        return newErrors;
      });
    }
  }, [itemCategory]);

  // REFACTORED: `addSpec` now receives the component object and quantity
  const addSpec = (specType: keyof Specs, spec: { id: string; name: string }, specQty: number) => {
    dispatch({ type: 'ADD_SPEC', specType, payload: { id: spec.id, name: spec.name, qty: specQty } });
  };

  const removeSpec = (specType: keyof Specs, index: number) => {
    dispatch({ type: 'REMOVE_SPEC', specType, index });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({}); // Clear previous errors

    let specs: Specs | undefined = undefined; // Use undefined for Zod optional
    if (itemCategory === "Set Komputer") {
      specs = {
        cpu: selectedCpus,
        motherboard: selectedMotherboards,
        ram: selectedRams,
        gpu: selectedGpus,
        storage: selectedStorages,
        psu: selectedPsus,
        case: selectedCases,
      };
    }

    // Prepare data for server action, including ID if editing
    const itemDataToSend: Partial<InventoryItem> = {
      name: itemName,
      category: itemCategory,
      qty: itemQty,
      status: itemStatus,
      location: itemLocation,
      description: itemDescription,
      specs: specs,
    };
    if (isEditing && editId) {
      itemDataToSend.id = editId;
    }

    startTransition(async () => {
      const result = isEditing && editId
        ? await updateInventory(itemDataToSend as InventoryItem)
        : await addInventory(itemDataToSend as Omit<InventoryItem, "id">);

      if (result.success) {
        toast.success(result.message || "Operasi berhasil!");
        resetForm();
      } else {
        if (result.errors) {
          // Flatten Zod errors for easier display
          const flatErrors: { [key: string]: string[] } = {};
          if (result.errors._errors && result.errors._errors.length > 0) {
            flatErrors.general = result.errors._errors; // General form errors
          }
          for (const key in result.errors) {
            if (key !== '_errors') {
              // Zod's .format() can give nested objects; this extracts error messages.
              const errorMessages = (result.errors as any)[key]?._errors || [];
              if (errorMessages.length > 0) {
                flatErrors[key] = errorMessages;
              }
            }
          }
          setValidationErrors(flatErrors);
          toast.error(result.message || "Validasi gagal. Mohon periksa input Anda.");
        } else {
          toast.error(result.message || "Terjadi kesalahan yang tidak diketahui.");
        }
      }
    });
  };

  const getFieldError = (fieldName: string) => validationErrors[fieldName]?.[0];

  return (
    <div className="lg:col-span-1">
      <Card id="form-card" className="glass-morphism sticky top-24 transition-all duration-300 p-6 rounded-2xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            {isEditing ? <Pencil className={`h-5 w-5 text-amber-600`} /> : <PlusCircle className={`h-5 w-5 text-blue-600`} />}
            {isEditing ? "Edit Inventori" : "Tambah Inventori Baru"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="inventory-form" className="space-y-4" onSubmit={handleSubmit}>
            <input type="hidden" id="edit-id" value={editId || ""} />

            <div>
              <Label htmlFor="item-name" className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nama Barang / Label Set</Label>
              <Input
                type="text"
                id="item-name"
                required
                placeholder="Contoh: PC-RAKIT-01"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 font-medium"
                value={itemName}
                onChange={(e) => {
                  dispatch({ type: 'SET_FIELD', field: 'itemName', payload: e.target.value });
                  setValidationErrors(prev => ({ ...prev, name: undefined })); // Clear error on change
                }}
                disabled={isPending}
              />
              {getFieldError('name') && <p className="text-red-500 text-xs mt-1">{getFieldError('name')}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="item-category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</Label>
                <Button variant="ghost" size="sm" onClick={onAddCategoryClick} className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5" disabled={isPending}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
              </div>
              <Select
                value={itemCategory}
                onValueChange={(value) => {
                  dispatch({ type: 'SET_FIELD', field: 'itemCategory', payload: value });
                  setValidationErrors(prev => ({ ...prev, category: undefined })); // Clear error on change
                }}
                disabled={isPending}
              >
                <SelectTrigger id="item-category" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm"><SelectValue placeholder="-- Pilih Kategori --" /></SelectTrigger>
                <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
              </Select>
              {getFieldError('category') && <p className="text-red-500 text-xs mt-1">{getFieldError('category')}</p>}
            </div>

            <div id="specs-container" className={`p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3 shadow-sm ${showSpecsContainer ? "" : "hidden"}`}>
              <h3 className="text-[10px] font-bold text-slate-700 uppercase">Rincian Komponen Terpasang</h3>
              <div className="space-y-3">
                <SpecSelector specTypeLabel="CPU" internalSpecType="cpu" options={cpuOptions} selectedItems={selectedCpus} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="Motherboard" internalSpecType="motherboard" options={motherboardOptions} selectedItems={selectedMotherboards} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="RAM" internalSpecType="ram" options={ramOptions} selectedItems={selectedRams} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="GPU" internalSpecType="gpu" options={gpuOptions} selectedItems={selectedGpus} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="Storage" internalSpecType="storage" options={storageOptions} selectedItems={selectedStorages} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="PSU" internalSpecType="psu" options={psuOptions} selectedItems={selectedPsus} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
                <SpecSelector specTypeLabel="Casing" internalSpecType="case" options={caseOptions} selectedItems={selectedCases} onAddSpec={addSpec} onRemoveSpec={removeSpec} isPending={isPending} />
              </div>
              {(getFieldError('specs') || getFieldError('specs.cpu') || getFieldError('specs.motherboard') || getFieldError('specs.ram') || getFieldError('specs.gpu') || getFieldError('specs.storage') || getFieldError('specs.psu') || getFieldError('specs.case')) && (
                <p className="text-red-500 text-xs mt-1">
                  {getFieldError('specs') || getFieldError('specs.cpu') || getFieldError('specs.motherboard') || getFieldError('specs.ram') || getFieldError('specs.gpu') || getFieldError('specs.storage') || getFieldError('specs.psu') || getFieldError('specs.case')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item-qty" className="block text-xs font-bold text-slate-500 mb-1 uppercase">Stok Unit</Label>
                <Input
                type="number"
                id="item-qty"
                min="0"
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                value={itemQty}
                onChange={(e) => {
                  dispatch({ type: 'SET_FIELD', field: 'itemQty', payload: Number(e.target.value) });
                  setValidationErrors(prev => ({ ...prev, qty: undefined })); // Clear error on change
                }}
                disabled={isPending}
              />
              {getFieldError('qty') && <p className="text-red-500 text-xs mt-1">{getFieldError('qty')}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="item-status" className="block text-xs font-bold text-slate-500 uppercase">Kondisi</Label>
                  <Button variant="ghost" size="sm" onClick={onAddStatusClick} className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5" disabled={isPending}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
                </div>
                <Select
                  value={itemStatus}
                  onValueChange={(value) => {
                    dispatch({ type: 'SET_FIELD', field: 'itemStatus', payload: value });
                    setValidationErrors(prev => ({ ...prev, status: undefined })); // Clear error on change
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger id="item-status" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm"><SelectValue placeholder="-- Pilih Kondisi --" /></SelectTrigger>
                  <SelectContent>{statuses.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                </Select>
                {getFieldError('status') && <p className="text-red-500 text-xs mt-1">{getFieldError('status')}</p>}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label htmlFor="item-location" className="block text-xs font-bold text-slate-500 uppercase">Lokasi</Label>
                <Button variant="ghost" size="sm" onClick={onAddLocationClick} className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5" disabled={isPending}><Plus className="h-4 w-4 mr-1" />Tambah</Button>
              </div>
              <Select
                value={itemLocation}
                onValueChange={(value) => {
                  dispatch({ type: 'SET_FIELD', field: 'itemLocation', payload: value });
                  setValidationErrors(prev => ({ ...prev, location: undefined })); // Clear error on change
                }}
                disabled={isPending}
              >
                <SelectTrigger id="item-location" className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-sm"><SelectValue placeholder="-- Pilih Lokasi --" /></SelectTrigger>
                <SelectContent>{locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}</SelectContent>
              </Select>
              {getFieldError('location') && <p className="text-red-500 text-xs mt-1">{getFieldError('location')}</p>}
            </div>

            <div>
              <Label htmlFor="item-description" className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deskripsi / Spesifikasi</Label>
              <Textarea
                id="item-description"
                placeholder="Masukkan deskripsi atau spesifikasi item (misal: Kondisi fisik, aksesoris, dll.)"
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm min-h-[80px]"
                value={itemDescription}
                onChange={(e) => {
                  dispatch({ type: 'SET_FIELD', field: 'itemDescription', payload: e.target.value });
                  setValidationErrors(prev => ({ ...prev, description: undefined })); // Clear error on change
                }}
                disabled={isPending}
              />
              {getFieldError('description') && <p className="text-red-500 text-xs mt-1">{getFieldError('description')}</p>}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" id="submit-btn" className={`w-full ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-700 hover:bg-blue-800"} text-white font-bold py-3 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 text-sm uppercase`} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin h-5 w-5 text-white" /> : <span id="btn-text">{isEditing ? "Perbarui Data" : "Simpan ke Sistem"}</span>}
              </Button>
              <Button type="button" id="cancel-edit" onClick={resetForm} className={`${isEditing ? "" : "hidden"} w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-lg text-sm uppercase`} disabled={isPending}>Batal Edit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
