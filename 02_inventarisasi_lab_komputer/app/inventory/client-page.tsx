"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { addCategory, addStatus, addLocation, deleteInventory, importInventory } from "@/lib/actions";
import { InventoryItem, Specs } from "@/lib/inventory-data";
import InventoryForm from "@/components/InventoryForm";
import InventoryTable from "@/components/InventoryTable";
import AddOptionModal from "@/components/AddOptionModal";
import ImportExcelModal from "@/components/ImportExcelModal"; // Import the modal
import { useInventoryStore } from "@/lib/store";
import { toast } from "sonner";
import PaginationControls from "@/components/PaginationControls";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

interface OptionData {
  id: string;
  name: string;
}



interface InventoryPageProps {
  initialInventory: InventoryItem[];
  initialCategories: OptionData[];
  initialStatuses: OptionData[];
  initialLocations: OptionData[];
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
    categories, // These are now OptionData[]
    statuses,   // These are now OptionData[]
    locations,  // These are now OptionData[]
    searchQuery,
    categoryFilter,
    initializeData,
    setSearchQuery,
    setCategoryFilter,
  } = useInventoryStore();

  const [isPending, startTransition] = useTransition();
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false); // State for import modal
  const router = useRouter();

  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);

  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

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
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
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

  const handleExportExcel = () => {
    const fullInventory = useInventoryStore.getState().inventory;
    
    const formatSpecs = (specs: Specs | null): string => {
        if (!specs) return '';
        return Object.entries(specs)
            .filter(([, components]) => components.length > 0)
            .map(([key, components]) => {
                const componentList = components.map(c => `${c.qty}x ${c.name}`).join(', ');
                return `${key.toUpperCase()}: ${componentList}`;
            })
            .join('; ');
    };

    const dataToExport = fullInventory.map(item => ({
      'ID': item.id,
      'Nama Item': item.name,
      'Kategori': item.categoryName,
      'Stok': item.qty,
      'Kondisi': item.statusName,
      'Lokasi': item.locationName,
      'Spesifikasi': formatSpecs(item.specs),
      'Deskripsi': item.description?.replace(/<[^>]*>?/gm, ''), 
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaris");
    XLSX.writeFile(workbook, `inventaris_export_${new Date().getTime()}.xlsx`);
  };

  // Handler for the import process
  const handleImport = async (data: any[]) => {
    startTransition(async () => {
      const result = await importInventory(data);
      if (result.success) {
        let toastMessage = result.message || "Impor selesai!";
        if (result.data?.errors && result.data.errors.length > 0) {
          // Show a more detailed toast if there are errors
          toast.warning(toastMessage, {
            description: `Silakan periksa ${result.data.errors.length} item yang gagal.`,
            duration: 8000,
          });
          console.error("Import errors:", result.data.errors);
        } else {
          toast.success(toastMessage);
        }
        router.refresh(); // Re-fetch server data
      } else {
        toast.error(result.message || "Gagal melakukan impor.");
      }
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar>
        <div id="stats" className="text-sm font-medium flex gap-4">
          <div className="hidden md:block">
            Total Item:{" "}
            <span id="total-count" className="bg-blue-950 px-2 py-1 rounded">
              {useInventoryStore.getState().inventory.length}
            </span>
          </div>
        </div>
      </Navbar>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <InventoryForm
            initialItem={itemToEdit}
            categories={categories} // Pass OptionData[]
            statuses={statuses}     // Pass OptionData[]
            locations={locations}   // Pass OptionData[]
            allInventoryItems={useInventoryStore.getState().inventory} // Pass full inventory for spec selectors
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
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowImportModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-[10px] bg-white border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg font-bold uppercase shadow-sm h-auto"
                  disabled={isPending}
                >
                  Import Excel
                </Button>
                <Button
                  onClick={handleExportExcel}
                  variant="outline"
                  size="sm"
                  className="text-[10px] bg-white border-green-200 text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg font-bold uppercase shadow-sm h-auto"
                  disabled={isPending}
                >
                  Export Excel
                </Button>
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
            <PaginationControls /> {/* Add PaginationControls here */}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ImportExcelModal 
        isOpen={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleImport}
      />
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
