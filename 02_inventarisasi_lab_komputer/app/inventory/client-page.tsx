"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useTransition, useCallback } from "react";
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
import { addCategory, addStatus, addLocation, deleteInventory } from "@/lib/actions";
import { InventoryItem } from "@/lib/inventory-data";
import InventoryForm from "@/components/InventoryForm"; // Import the new form component
import InventoryTable from "@/components/InventoryTable"; // Import the new table component
import AddOptionModal from "@/components/AddOptionModal"; // Import the new modal component

interface InventoryPageProps {
  initialInventory: InventoryItem[];
  categories: string[];
  statuses: string[];
  locations: string[];
}

export default function InventoryPage({ initialInventory, categories, statuses, locations }: InventoryPageProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // State for category filter
  const [toastMessage, setToastMessage] = useState("");
  const [toastColorClass, setToastColorClass] = useState("bg-slate-900");
  const toastRef = useRef<HTMLDivElement>(null);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null); // State to pass to InventoryForm for editing


  // Re-sync client state with server data if initialInventory changes (e.g., after a mutation)
  useEffect(() => {
    setInventory(initialInventory);
  }, [initialInventory]);

  const showToast = useCallback((msg: string, colorClass: string = "bg-slate-900") => {
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
  }, []);

  const handleFormSubmitted = useCallback(() => {
    setItemToEdit(null); // Clear itemToEdit after form submission/reset
  }, []);

  const editItem = (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (item) {
      setItemToEdit(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Hapus item ini secara permanen?")) {
      startTransition(async () => {
        await deleteInventory(id);
        if (itemToEdit && itemToEdit.id === id) {
          setItemToEdit(null); // Clear editing state if the edited item is deleted
        }
        showToast("DATA TELAH DIHAPUS", "bg-rose-600");
      });
    }
  };

  const filteredInventory = inventory
    .filter(item => {
      if (categoryFilter === "all") return true;
      return item.category === categoryFilter;
    })
    .filter((item) => {
      if (!searchQuery) return true;
      return (
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    });

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
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Input / Edit */}
          <InventoryForm
            initialItem={itemToEdit}
            categories={categories}
            statuses={statuses}
            locations={locations}
            allInventoryItems={inventory} // Pass current inventory for spec options
            showToast={showToast}
            onFormSubmitted={handleFormSubmitted}
            onAddCategoryClick={() => setShowAddCategoryModal(true)}
            onAddStatusClick={() => setShowAddStatusModal(true)}
            onAddLocationClick={() => setShowAddLocationModal(true)}
          />

                    <div className="lg:col-span-2 space-y-4">
                                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex gap-2 w-full md:w-auto">
                                    <Input
                                      type="text"
                                      id="search-input"
                                      placeholder="Cari item, kategori, atau lokasi..."
                                      className="w-full md:w-96 px-4 py-2.5 rounded-xl border border-slate-300 outline-none shadow-sm text-sm"
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      disabled={isPending}
                                    />
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                      <SelectTrigger className="w-full md:w-[180px] bg-white rounded-xl shadow-sm border-slate-300">
                                        <SelectValue placeholder="Filter by category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        {categories.map((cat) => (
                                          <SelectItem key={cat} value={cat}>
                                            {cat}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    </div>
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
                                  </div>                      <InventoryTable
                        filteredInventory={filteredInventory}
                        itemToEdit={itemToEdit}
                        isPending={isPending}
                        onEditItem={editItem}
                        onDeleteItem={handleDeleteItem}
                      />
                    </div>        </div>
      </main>



      {/* Modals for adding dynamic options */}
      <AddOptionModal
        isOpen={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
        title="Tambah Kategori Baru"
        label="Kategori"
        placeholder="Nama Kategori"
        onAdd={addCategory}
        showToast={showToast}
      />

      <AddOptionModal
        isOpen={showAddStatusModal}
        onOpenChange={setShowAddStatusModal}
        title="Tambah Kondisi Baru"
        label="Kondisi"
        placeholder="Nama Kondisi"
        onAdd={addStatus}
        showToast={showToast}
      />

      <AddOptionModal
        isOpen={showAddLocationModal}
        onOpenChange={setShowAddLocationModal}
        title="Tambah Lokasi Baru"
        label="Lokasi"
        placeholder="Nama Lokasi"
        onAdd={addLocation}
        showToast={showToast}
      />

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

