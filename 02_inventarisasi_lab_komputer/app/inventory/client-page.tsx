"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useTransition } from "react";
import { HardDrive, PlusCircle, Pencil, Trash2, Plus, Loader2, X } from "lucide-react"; // Imported Lucide icons
import { Button } from "@/components/ui/button"; // Imported Shadcn Button component
import { Input } from "@/components/ui/input"; // Imported Shadcn Input component
import { Label } from "@/components/ui/label"; // Imported Shadcn Label component
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Imported Shadcn Select component
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Imported Shadcn Dialog component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Imported Shadcn Card component
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"; // Imported Shadcn Table component
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link"; // Imported Next.js Link component
import { addInventory, updateInventory, deleteInventory, addCategory, addStatus, addLocation } from "@/lib/actions";
import { InventoryItem, Specs } from "@/lib/inventory-data";

interface InventoryPageProps {
  initialInventory: InventoryItem[];
  categories: string[];
  statuses: string[];
  locations: string[];
}



export default function InventoryPage({ initialInventory, categories, statuses, locations }: InventoryPageProps) {

  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory); // Initialize with prop
  const [isPending, startTransition] = useTransition(); // Added useTransition
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemStatus, setItemStatus] = useState(statuses[0] || ""); // Initialize with first status or empty
  const [itemLocation, setItemLocation] = useState("");
  const [itemDescription, setItemDescription] = useState(""); // New state for description
  const [specsCpu, setSpecsCpu] = useState("");
  const [specsCpuQty, setSpecsCpuQty] = useState(1);
  const [specsRam, setSpecsRam] = useState("");
  const [specsRamQty, setSpecsRamQty] = useState(1);
  const [specsGpu, setSpecsGpu] = useState("");
  const [specsGpuQty, setSpecsGpuQty] = useState(1);
  const [specsStorage, setSpecsStorage] = useState("");
  const [specsStorageQty, setSpecsStorageQty] = useState(1);
  const [specsPsu, setSpecsPsu] = useState("");
  const [specsPsuQty, setSpecsPsuQty] = useState(1);
  const [specsCase, setSpecsCase] = useState("");
  const [specsCaseQty, setSpecsCaseQty] = useState(1);
  // New state for multiple components (using IDs instead of names)
  const [selectedCpus, setSelectedCpus] = useState<{ name: string; qty: number }[]>([]);
  const [selectedRams, setSelectedRams] = useState<{ name: string; qty: number }[]>([]);
  const [selectedGpus, setSelectedGpus] = useState<{ name: string; qty: number }[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<{ name: string; qty: number }[]>([]);
  const [selectedPsus, setSelectedPsus] = useState<{ name: string; qty: number }[]>([]);
  const [selectedCases, setSelectedCases] = useState<{ name: string; qty: number }[]>([]);
  const [showSpecsContainer, setShowSpecsContainer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastColorClass, setToastColorClass] = useState("bg-slate-900");
  const toastRef = useRef<HTMLDivElement>(null);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState("");
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusValue, setNewStatusValue] = useState("");
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationValue, setNewLocationValue] = useState("");

  // Re-sync client state with server data if initialInventory changes (e.g., after a mutation)
  useEffect(() => {
    setInventory(initialInventory);
  }, [initialInventory]);

  const updateSpecSelectors = (currentInventory: InventoryItem[]) => { // Now accepts inventory as argument
    const cpuOptions: string[] = [];
    const ramOptions: string[] = [];
    const gpuOptions: string[] = [];
    const storageOptions: string[] = [];
    const psuOptions: string[] = [];
    const caseOptions: string[] = [];

    currentInventory.forEach((item) => {
      if (item.category === "Processor (CPU)" && !cpuOptions.includes(item.name)) cpuOptions.push(item.name);
      if (item.category === "Memori (RAM)" && !ramOptions.includes(item.name)) ramOptions.push(item.name);
      if (item.category === "Kartu Grafis (GPU)" && !gpuOptions.includes(item.name)) gpuOptions.push(item.name);
      if (item.category === "Penyimpanan (SSD/HDD)" && !storageOptions.includes(item.name)) storageOptions.push(item.name);
      if (item.category === "Power Supply (PSU)" && !psuOptions.includes(item.name)) psuOptions.push(item.name);
      if (item.category === "Casing PC" && !caseOptions.includes(item.name)) caseOptions.push(item.name);
    });

    return { cpuOptions, ramOptions, gpuOptions, storageOptions, psuOptions, caseOptions };
  };

  const { cpuOptions, ramOptions, gpuOptions, storageOptions, psuOptions, caseOptions } = updateSpecSelectors(inventory); // Pass current inventory

  // Functions to manage multiple components
  const addCpu = () => {
    if (specsCpu && specsCpuQty > 0) {
      setSelectedCpus([...selectedCpus, { name: specsCpu, qty: specsCpuQty }]);
      setSpecsCpu("");
      setSpecsCpuQty(1);
    }
  };

  const removeCpu = (index: number) => {
    const newCpus = [...selectedCpus];
    newCpus.splice(index, 1);
    setSelectedCpus(newCpus);
  };

  const addRam = () => {
    if (specsRam && specsRamQty > 0) {
      setSelectedRams([...selectedRams, { name: specsRam, qty: specsRamQty }]);
      setSpecsRam("");
      setSpecsRamQty(1);
    }
  };

  const removeRam = (index: number) => {
    const newRams = [...selectedRams];
    newRams.splice(index, 1);
    setSelectedRams(newRams);
  };

  const addGpu = () => {
    if (specsGpu && specsGpuQty > 0) {
      setSelectedGpus([...selectedGpus, { name: specsGpu, qty: specsGpuQty }]);
      setSpecsGpu("");
      setSpecsGpuQty(1);
    }
  };

  const removeGpu = (index: number) => {
    const newGpus = [...selectedGpus];
    newGpus.splice(index, 1);
    setSelectedGpus(newGpus);
  };

  const addStorage = () => {
    if (specsStorage && specsStorageQty > 0) {
      setSelectedStorages([...selectedStorages, { name: specsStorage, qty: specsStorageQty }]);
      setSpecsStorage("");
      setSpecsStorageQty(1);
    }
  };

  const removeStorage = (index: number) => {
    const newStorages = [...selectedStorages];
    newStorages.splice(index, 1);
    setSelectedStorages(newStorages);
  };

  const addPsu = () => {
    if (specsPsu && specsPsuQty > 0) {
      setSelectedPsus([...selectedPsus, { name: specsPsu, qty: specsPsuQty }]);
      setSpecsPsu("");
      setSpecsPsuQty(1);
    }
  };

  const removePsu = (index: number) => {
    const newPsus = [...selectedPsus];
    newPsus.splice(index, 1);
    setSelectedPsus(newPsus);
  };

  const addCase = () => {
    if (specsCase && specsCaseQty > 0) {
      setSelectedCases([...selectedCases, { name: specsCase, qty: specsCaseQty }]);
      setSpecsCase("");
      setSpecsCaseQty(1);
    }
  };

  const removeCase = (index: number) => {
    const newCases = [...selectedCases];
    newCases.splice(index, 1);
    setSelectedCases(newCases);
  };

  const toggleSpecs = () => {
    if (itemCategory === "Set Komputer") {
      setShowSpecsContainer(true);
    } else {
      setShowSpecsContainer(false);
    }
  };

  useEffect(() => {
    toggleSpecs();
  }, [itemCategory, inventory]); // Re-run when category or inventory changes

  const showToast = (msg: string, colorClass: string = "bg-slate-900") => {
    setToastMessage(msg);
    setToastColorClass(colorClass);
    if (toastRef.current) {
      toastRef.current.classList.remove("translate-y-20", "opacity-0");
      toastRef.current.classList.add("translate-y-0", "opacity-100");
    }
    setTimeout(() => {
      if (toastRef.current) {
        toastRef.current.classList.remove("translate-y-0", "opacity-100");
        toastRef.current.classList.add("translate-y-20", "opacity-0");
      }
    }, 3000);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setItemName("");
    setItemCategory("");
    setItemQty(1);
    setItemStatus("Bagus");
    setItemLocation("");
    setSpecsCpu("");
    setSpecsCpuQty(1);
    setSpecsRam("");
    setSpecsRamQty(1);
    setSpecsGpu("");
    setSpecsGpuQty(1);
    setSpecsStorage("");
    setSpecsStorageQty(1);
    setSelectedCpus([]);
    setSelectedRams([]);
    setSelectedGpus([]);
    setSelectedStorages([]);
    setSelectedPsus([]);
    setSelectedCases([]);
    setItemDescription(""); // Clear itemDescription on reset
    setShowSpecsContainer(false); // Hide specs when form is reset
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let specs: Specs | null = null;
    if (itemCategory === "Set Komputer") {
      // Combine the selected components with any individual selections
      let cpuComponents = [...selectedCpus];
      if (specsCpu && specsCpuQty > 0) {
        cpuComponents.push({ name: specsCpu, qty: specsCpuQty });
      }

      let ramComponents = [...selectedRams];
      if (specsRam && specsRamQty > 0) {
        ramComponents.push({ name: specsRam, qty: specsRamQty });
      }

      let gpuComponents = [...selectedGpus];
      if (specsGpu && specsGpuQty > 0) {
        gpuComponents.push({ name: specsGpu, qty: specsGpuQty });
      }

      let storageComponents = [...selectedStorages];
      if (specsStorage && specsStorageQty > 0) {
        storageComponents.push({ name: specsStorage, qty: specsStorageQty });
      }

      let psuComponents = [...selectedPsus];
      if (specsPsu && specsPsuQty > 0) {
        psuComponents.push({ name: specsPsu, qty: specsPsuQty });
      }

      let caseComponents = [...selectedCases];
      if (specsCase && specsCaseQty > 0) {
        caseComponents.push({ name: specsCase, qty: specsCaseQty });
      }

      specs = {
        cpu: cpuComponents,
        ram: ramComponents,
        gpu: gpuComponents,
        storage: storageComponents,
        psu: psuComponents,
        case: caseComponents,
      };
    }

    const newItemData: Omit<InventoryItem, 'id'> = { // Removed ID for add operation
      name: itemName,
      category: itemCategory,
      qty: itemQty,
      status: itemStatus,
      location: itemLocation,
      description: itemDescription, // Added description
      specs: specs,
    };

    startTransition(async () => { // Wrap server action call in startTransition
      if (isEditing && editId !== null) {
        const updatedItemData: InventoryItem = { ...newItemData, id: editId };
        await updateInventory(updatedItemData);
        showToast("DATA BERHASIL DIPERBARUI", "bg-blue-600");
      } else {
        await addInventory(newItemData);
        showToast("DATA BARU DITAMBAHKAN", "bg-emerald-600");
      }
      resetForm();
    });
  };

  const editItem = (id: string) => { // Changed id type to string
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    setIsEditing(true);
    setEditId(item.id);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQty(item.qty);
    setItemStatus(item.status);
    setItemLocation(item.location);
    setItemDescription(item.description || ""); // Set description for editing

    if (item.category === "Set Komputer" && item.specs) {
      setShowSpecsContainer(true);
      // Handle the migration from old structure to new structure
      // If the specs are in the old format (single objects), convert them to arrays
      if (item.specs.cpu && Array.isArray(item.specs.cpu)) {
        setSelectedCpus(item.specs.cpu);
      } else if (item.specs.cpu && typeof item.specs.cpu === 'object' && 'name' in item.specs.cpu) {
        // Old format: single object, convert to array
        setSelectedCpus(item.specs.cpu.name ? [{ name: item.specs.cpu.name, qty: item.specs.cpu.qty }] : []);
      } else {
        setSelectedCpus([]);
      }

      if (item.specs.ram && Array.isArray(item.specs.ram)) {
        setSelectedRams(item.specs.ram);
      } else if (item.specs.ram && typeof item.specs.ram === 'object' && 'name' in item.specs.ram) {
        // Old format: single object, convert to array
        setSelectedRams(item.specs.ram.name ? [{ name: item.specs.ram.name, qty: item.specs.ram.qty }] : []);
      } else {
        setSelectedRams([]);
      }

      if (item.specs.gpu && Array.isArray(item.specs.gpu)) {
        setSelectedGpus(item.specs.gpu);
      } else if (item.specs.gpu && typeof item.specs.gpu === 'object' && 'name' in item.specs.gpu) {
        // Old format: single object, convert to array
        setSelectedGpus(item.specs.gpu.name ? [{ name: item.specs.gpu.name, qty: item.specs.gpu.qty }] : []);
      } else {
        setSelectedGpus([]);
      }

      if (item.specs.storage && Array.isArray(item.specs.storage)) {
        setSelectedStorages(item.specs.storage);
      } else if (item.specs.storage && typeof item.specs.storage === 'object' && 'name' in item.specs.storage) {
        // Old format: single object, convert to array
        setSelectedStorages(item.specs.storage.name ? [{ name: item.specs.storage.name, qty: item.specs.storage.qty }] : []);
      } else {
        setSelectedStorages([]);
      }

      if (item.specs.psu && Array.isArray(item.specs.psu)) {
        setSelectedPsus(item.specs.psu);
      } else if (item.specs.psu && typeof item.specs.psu === 'object' && 'name' in item.specs.psu) {
        // Old format: single object, convert to array
        setSelectedPsus(item.specs.psu.name ? [{ name: item.specs.psu.name, qty: item.specs.psu.qty }] : []);
      } else {
        setSelectedPsus([]);
      }

      if (item.specs.case && Array.isArray(item.specs.case)) {
        setSelectedCases(item.specs.case);
      } else if (item.specs.case && typeof item.specs.case === 'object' && 'name' in item.specs.case) {
        // Old format: single object, convert to array
        setSelectedCases(item.specs.case.name ? [{ name: item.specs.case.name, qty: item.specs.case.qty }] : []);
      } else {
        setSelectedCases([]);
      }

      // Set the individual spec fields to empty since we're now using arrays
      setSpecsCpu("");
      setSpecsCpuQty(1);
      setSpecsRam("");
      setSpecsRamQty(1);
      setSpecsGpu("");
      setSpecsGpuQty(1);
      setSpecsStorage("");
      setSpecsStorageQty(1);
      setSpecsPsu("");
      setSpecsPsuQty(1);
      setSpecsCase("");
      setSpecsCaseQty(1);
    } else {
      setShowSpecsContainer(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteItem = async (id: string) => { // Changed id type to string
    if (confirm("Hapus item ini secara permanen?")) {
      startTransition(async () => { // Wrap server action call in startTransition
        await deleteInventory(id);
        if (isEditing && editId === id) {
          resetForm();
        }
        showToast("DATA TELAH DIHAPUS", "bg-rose-600");
      });
    }
  };

  const filteredInventory = inventory.filter((item) =>
    (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(inventory, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `inventory_lab_v4_${new Date().getTime()}.json`);
    dl.click();
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-blue-300" />
            LabInventory Pro{" "}
            <span
              className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full ml-2 font-normal tracking-wide italic"
            >
              v4.1 Fixed
            </span>
          </h1>
                      <div id="stats" className="text-sm font-medium flex gap-4">
                        <div className="hidden md:block">
                          Total Item:{" "}
                          <span id="total-count" className="bg-blue-950 px-2 py-1 rounded">
                            {inventory.length}
                          </span>
                        </div>
                      </div>        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Input / Edit */}
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
                                        onChange={(e) => setItemName(e.target.value)}
                                        disabled={isPending}
                                      />                </div>

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
                      onClick={() => setShowAddCategoryModal(true)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                      disabled={isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>                  </div>
                  <Select
                    value={itemCategory}
                    onValueChange={setItemCategory}
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
                          onValueChange={setSpecsCpu}
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
                        onChange={(e) => setSpecsCpuQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addCpu}
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
                                onClick={() => removeCpu(index)}
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
                          onValueChange={setSpecsRam}
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
                        onChange={(e) => setSpecsRamQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addRam}
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
                                onClick={() => removeRam(index)}
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
                          onValueChange={setSpecsGpu}
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
                        onChange={(e) => setSpecsGpuQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addGpu}
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
                                onClick={() => removeGpu(index)}
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
                          onValueChange={setSpecsStorage}
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
                        onChange={(e) => setSpecsStorageQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addStorage}
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
                                onClick={() => removeStorage(index)}
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
                          onValueChange={setSpecsPsu}
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
                        onChange={(e) => setSpecsPsuQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addPsu}
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
                                onClick={() => removePsu(index)}
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
                          onValueChange={setSpecsCase}
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
                        onChange={(e) => setSpecsCaseQty(Number(e.target.value))}
                        min="1"
                        className="w-16"
                        disabled={isPending}
                      />
                      <Button
                        type="button"
                        onClick={addCase}
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
                                onClick={() => removeCase(index)}
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
                      onChange={(e) => setItemQty(Number(e.target.value))}
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
                                          </Label>                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAddStatusModal(true)}
                                            className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                                            disabled={isPending}
                                          >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tambah
                                          </Button>                    </div>
                                      <Select
                                        value={itemStatus}
                                        onValueChange={setItemStatus}
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
                      onClick={() => setShowAddLocationModal(true)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-bold flex items-center gap-1 h-auto px-1 py-0.5"
                      disabled={isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>                  </div>
                                      <Select
                                        value={itemLocation}
                                        onValueChange={setItemLocation}
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
                    onChange={(e) => setItemDescription(e.target.value)}
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
                    disabled={isPending} // Disable button during pending state
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

          {/* List Data */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Input
                type="text"
                id="search-input"
                placeholder="Cari item, kategori, atau lokasi..."
                className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-slate-300 outline-none shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button
                  id="export-btn"
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="text-[10px] bg-white border border-slate-200 px-3 py-2 rounded-lg font-bold uppercase shadow-sm h-auto"
                  disabled={isPending}
                >
                  Backup JSON
                </Button>
              </div>
            </div>

            <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <CardContent>
                <div className="overflow-x-auto">
                <Table className="w-full text-left">
                  <TableHeader>
                    <TableRow className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                      <TableHead className="px-6 py-4">Item & Rincian</TableHead>
                      <TableHead className="px-6 py-4">Kategori</TableHead>
                      <TableHead className="px-6 py-4 text-center">Stok</TableHead>
                      <TableHead className="px-6 py-4 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody id="inventory-list">
                    {filteredInventory.length === 0 ? (
                      <TableRow className="text-center">
                        <TableCell colSpan={4} className="py-20 text-slate-400 text-sm italic">
                          Belum ada data inventori.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => {
                        const statusClass =
                          item.status === "Bagus"
                            ? "text-emerald-500 bg-emerald-50"
                            : item.status === "Rusak Ringan"
                            ? "text-amber-500 bg-amber-50"
                            : "text-rose-500 bg-rose-50";

                        const isBeingEdited = isEditing && editId === item.id;

                        let specsHtml = null;
                        if (item.category === "Set Komputer" && item.specs) {
                          const s = item.specs;
                          const line = (lbl: string, components: { name: string; qty: number }[]) =>
                            components && components.length > 0 ? (
                              <div>
                                <b className="text-blue-600">{lbl}:</b> {components.map(comp => `${comp.qty}x ${comp.name}`).join(', ')}
                              </div>
                            ) : null;
                          specsHtml = (
                            <div className="mt-2 text-[9px] bg-slate-100 p-2 rounded border border-slate-200 font-mono shadow-sm">
                              {line("CPU", s.cpu)}
                              {line("RAM", s.ram)}
                              {line("GPU", s.gpu)}
                              {line("SSD", s.storage)}
                              {line("PSU", s.psu)}
                              {line("CASE", s.case)}
                            </div>
                          );
                        }

                        return (
                          <TableRow
                            key={item.id}
                            className={`transition-all border-b border-slate-100 ${
                              isBeingEdited ? "editing-row" : "hover:bg-slate-50/50"
                            }`}
                          >
                            <TableCell className="px-6 py-5 align-top">
                              <div className="flex flex-col">
                                <Link href={`/inventory/${item.id}`} className="font-bold text-blue-600 hover:underline text-sm">
                                  {item.name}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${statusClass}`}
                                  >
                                    {item.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Loc: {item.location}
                                  </span>
                                </div>
                                {specsHtml}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-5 align-top text-xs font-bold text-slate-400 uppercase">
                              {item.category}
                            </TableCell>
                            <TableCell className="px-6 py-5 align-top text-center">
                              <span className="font-mono font-bold text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded">
                                {item.qty}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-5 align-top text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editItem(item.id)}
                                  title="Edit Data"
                                  disabled={isPending}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Hapus Data"
                                  disabled={isPending}
                                  className="text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>



      {/* Modals for adding dynamic options */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (newCategoryValue.trim()) {
              startTransition(async () => {
                await addCategory(newCategoryValue.trim());
                showToast(`Kategori '${newCategoryValue.trim()}' ditambahkan!`, 'bg-emerald-600');
                setNewCategoryValue(""); // Clear input
                setShowAddCategoryModal(false); // Close modal
              });
            }
          }} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Nama Kategori"
              value={newCategoryValue}
              onChange={(e) => setNewCategoryValue(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
              disabled={isPending}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm"
                disabled={isPending || !newCategoryValue.trim()}
              >
                {isPending ? "Menambah..." : "Tambah Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStatusModal} onOpenChange={setShowAddStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kondisi Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (newStatusValue.trim()) {
              startTransition(async () => {
                await addStatus(newStatusValue.trim());
                showToast(`Kondisi '${newStatusValue.trim()}' ditambahkan!`, 'bg-emerald-600');
                setNewStatusValue(""); // Clear input
                setShowAddStatusModal(false); // Close modal
              });
            }
          }} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Nama Kondisi"
              value={newStatusValue}
              onChange={(e) => setNewStatusValue(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
              disabled={isPending}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm"
                disabled={isPending || !newStatusValue.trim()}
              >
                {isPending ? "Menambah..." : "Tambah Kondisi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddLocationModal} onOpenChange={setShowAddLocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Lokasi Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (newLocationValue.trim()) {
              startTransition(async () => {
                await addLocation(newLocationValue.trim());
                showToast(`Lokasi '${newLocationValue.trim()}' ditambahkan!`, 'bg-emerald-600');
                setNewLocationValue(""); // Clear input
                setShowAddLocationModal(false); // Close modal
              });
            }
          }} className="flex flex-col gap-4">
            <Input
              type="text"
              placeholder="Nama Lokasi"
              value={newLocationValue}
              onChange={(e) => setNewLocationValue(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              required
              disabled={isPending}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm"
                disabled={isPending || !newLocationValue.trim()}
              >
                {isPending ? "Menambah..." : "Tambah Lokasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div
        ref={toastRef}
        className={`fixed bottom-5 right-5 transform translate-y-20 opacity-0 transition-all duration-300 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 border border-slate-700 ${toastColorClass}`}
      >
        <span id="toast-msg" className="text-xs font-bold uppercase">
          {toastMessage}
        </span>
      </div>
    </div>
  );
}
