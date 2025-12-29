"use client";

import { useEffect, useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  PlusCircle, Pencil, Trash2, Loader2, SquareStack, MapPin, HardDrive, ArrowLeft,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";

import {
  addCategory, updateCategory, deleteCategory,
  addStatus, updateStatus, deleteStatus,
  addLocation, updateLocation, deleteLocation,
} from "@/lib/actions";

interface OptionData {
  id: string;
  name: string;
}

type SortableColumns = 'name' | 'id';

interface MasterDataClientPageProps {
  type: 'category' | 'status' | 'location';
  initialData: OptionData[];
  title: string;
  label: string;
  placeholder: string;
}

export default function MasterDataClientPage({
  type,
  initialData,
  title,
  label,
  placeholder,
}: MasterDataClientPageProps) {
  const router = useRouter();
  const [data, setData] = useState<OptionData[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);

  // New states for search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortableColumns | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptionData | null>(null);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Memoize filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Filtering
    if (searchQuery) {
      processedData = processedData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sorting
    if (sortColumn && sortDirection) {
      processedData.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processedData;
  }, [data, searchQuery, sortColumn, sortDirection]);

  const handleSort = (column: SortableColumns) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else setSortDirection('asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: SortableColumns) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const getActionFunctions = useCallback(() => {
    switch (type) {
      case 'category': return { add: addCategory, update: updateCategory, delete: deleteCategory };
      case 'status': return { add: addStatus, update: updateStatus, delete: deleteStatus };
      case 'location': return { add: addLocation, update: updateLocation, delete: deleteLocation };
    }
  }, [type]);

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newValue.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    const { add, update } = getActionFunctions();
    startTransition(async () => {
      const result = editingItem ? await update(editingItem.id, newValue.trim()) : await add(newValue.trim());
      if (result.success) {
        toast.success(result.message || `${label} berhasil disimpan!`);
        setNewValue("");
        setIsModalOpen(false);
        setEditingItem(null);
        router.refresh();
      } else {
        const errorMessage = result.errors?.name?.[0] || result.message || `Gagal menyimpan ${label}.`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${label} ini?`)) return;
    const { delete: deleteAction } = getActionFunctions();
    setMutatingItemId(id);
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.success) {
        toast.success(result.message || `${label} berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(result.message || `Gagal menghapus ${label}.`);
      }
      setMutatingItemId(null);
    });
  };

  const openEditModal = (item: OptionData) => {
    setEditingItem(item);
    setNewValue(item.name);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewValue("");
    setIsModalOpen(true);
  };

  const getIcon = () => {
    switch (type) {
      case 'category': return <SquareStack className="h-8 w-8 text-blue-500" />;
      case 'status': return <HardDrive className="h-8 w-8 text-green-500" />;
      case 'location': return <MapPin className="h-8 w-8 text-purple-500" />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar>
        <Button
          onClick={() => router.push('/settings')}
          variant="ghost"
          className="border border-white/50 text-white hover:bg-white/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </Navbar>

      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            {getIcon()}
            {title}
          </h2>
          <Button onClick={openAddModal} disabled={isPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah {label} Baru
          </Button>
        </div>

        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <CardContent className="p-0">
             <div className="p-4 border-b border-slate-200">
                <Input
                    type="text"
                    placeholder={`Cari nama ${label.toLowerCase()}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-1/3"
                />
            </div>
            <div className="overflow-x-auto">
              <Table className="w-full text-left">
                <TableHeader>
                  <TableRow className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                    <TableHead className="px-6 py-4">
                       <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        Nama {label} {getSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead className="px-6 py-4">
                      <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                        ID {getSortIcon('id')}
                      </button>
                    </TableHead>
                    <TableHead className="px-6 py-4 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-20 text-center text-slate-400 text-sm italic">
                        {searchQuery ? `Tidak ada ${label} yang cocok dengan pencarian "${searchQuery}".` : `Belum ada data ${label}.`}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedData.map((item) => {
                      const isMutating = isPending && mutatingItemId === item.id;
                      return (
                        <TableRow key={item.id} className={`border-b border-slate-100 ${isMutating ? "opacity-50 pointer-events-none" : ""}`}>
                          <TableCell className="px-6 py-4 font-medium text-slate-800">{item.name}</TableCell>
                          <TableCell className="px-6 py-4 text-slate-500 text-xs font-mono">{item.id}</TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-1">
                              {isMutating ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => openEditModal(item)} disabled={isPending} title="Edit">
                                    <Pencil className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={isPending} title="Hapus">
                                    <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
                                  </Button>
                                </>
                              )}
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
      </main>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) { setEditingItem(null); setNewValue(""); setError(null); }
        setIsModalOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit ${label}: ${editingItem.name}` : `Tambah ${label} Baru`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="option-name" className="sr-only">{label}</Label>
              <Input
                id="option-name"
                type="text"
                placeholder={placeholder}
                value={newValue}
                onChange={(e) => { setNewValue(e.target.value); if (error) setError(null); }}
                disabled={isPending}
                required
                className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !newValue.trim()}>
                {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                {editingItem ? `Perbarui ${label}` : `Tambah ${label}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
