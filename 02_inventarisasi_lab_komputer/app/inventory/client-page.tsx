"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addCategory, addStatus, addLocation, deleteInventory } from "@/lib/actions";
import { InventoryItem } from "@/lib/inventory-data";
import InventoryForm from "@/components/InventoryForm";
import InventoryTable from "@/components/InventoryTable";
import AddOptionModal from "@/components/AddOptionModal";
import { useInventoryStore } from "@/lib/store";
import { toast } from "sonner";

interface InventoryPageProps {
  initialInventory: InventoryItem[];
  initialCategories: string[];
  initialStatuses: string[];
  initialLocations: string[];
}

export default function InventoryPage({
  initialInventory,
  initialCategories,
  initialStatuses,
  initialLocations,
}: InventoryPageProps) {
  // Zustand store integration
  const {
    inventory,
    categories,
    statuses,
    locations,
    searchQuery,
    categoryFilter,
    initializeData,
    setSearchQuery,
    setCategoryFilter,
  } = useInventoryStore();

  const [isPending, startTransition] = useTransition();
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  // Initialize store with server-side data
  useEffect(() => {
    initializeData({
      inventory: initialInventory,
      categories: initialCategories,
      statuses: initialStatuses,
      locations: initialLocations,
    });
  }, [initialInventory, initialCategories, initialStatuses, initialLocations, initializeData]);

  const handleFormSubmitted = useCallback(() => {
    setItemToEdit(null);
  }, []);

  const editItem = (id: string) => {
    const item = useInventoryStore.getState().inventory.find((i) => i.id === id);
    if (item) {
      setItemToEdit(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Hapus item ini secara permanen?")) {
      setMutatingItemId(id);
      startTransition(async () => {
        const result = await deleteInventory(id);
        if (itemToEdit && itemToEdit.id === id) {
          setItemToEdit(null);
        }
        toast.success(`Item dengan ID ${result} telah dihapus.`);
        setMutatingItemId(null);
      });
    }
  };

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
            <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded-full ml-2 font-normal tracking-wide italic">
              v4.2 Zustand
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
          <InventoryForm
            initialItem={itemToEdit}
            categories={categories}
            statuses={statuses}
            locations={locations}
            allInventoryItems={inventory}
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
            </div>
            <InventoryTable
              itemToEdit={itemToEdit}
              isPending={isPending}
              onEditItem={editItem}
              onDeleteItem={handleDeleteItem}
              mutatingItemId={mutatingItemId}
            />
          </div>
        </div>
      </main>

      {/* Modals for adding dynamic options */}
      <AddOptionModal
        isOpen={showAddCategoryModal}
        onOpenChange={setShowAddCategoryModal}
        title="Tambah Kategori Baru"
        label="Kategori"
        placeholder="Nama Kategori"
        onAdd={addCategory}
      />

      <AddOptionModal
        isOpen={showAddStatusModal}
        onOpenChange={setShowAddStatusModal}
        title="Tambah Kondisi Baru"
        label="Kondisi"
        placeholder="Nama Kondisi"
        onAdd={addStatus}
      />

      <AddOptionModal
        isOpen={showAddLocationModal}
        onOpenChange={setShowAddLocationModal}
        title="Tambah Lokasi Baru"
        label="Lokasi"
        placeholder="Nama Lokasi"
        onAdd={addLocation}
      />
    </div>
  );
}

