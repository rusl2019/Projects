"use client";

import { useEffect, useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  PlusCircle, Pencil, Trash2, Loader2, SquareStack, MapPin, HardDrive,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  addCategory, updateCategory, deleteCategory,
  addStatus, updateStatus, deleteStatus,
  addLocation, updateLocation, deleteLocation,
} from "@/lib/actions";

interface OptionData {
  id: string;
  name: string;
}

type SortableColumns = 'name';

interface MasterDataTableProps {
  type: 'category' | 'status' | 'location';
  initialData: OptionData[];
  title: string;
  label: string;
  placeholder: string;
}

export default function MasterDataTable({
  type,
  initialData,
  title,
  label,
  placeholder,
}: MasterDataTableProps) {
  const router = useRouter();
  const [data, setData] = useState<OptionData[]>(initialData);
  const [isPending, startTransition] = useTransition();
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortableColumns | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptionData | null>(null);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];
    if (searchQuery) {
      processedData = processedData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
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
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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
        setIsModalOpen(false);
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
    setError(null);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setNewValue("");
    setError(null);
    setIsModalOpen(true);
  };

  const getIcon = () => {
    switch (type) {
      case 'category': return <SquareStack className="h-6 w-6 text-blue-500" />;
      case 'status': return <HardDrive className="h-6 w-6 text-green-500" />;
      case 'location': return <MapPin className="h-6 w-6 text-purple-500" />;
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
                {getIcon()}
                {title}
            </h3>
            <Button onClick={openAddModal} disabled={isPending} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Baru
            </Button>
        </div>

        <Card className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <CardContent className="p-0">
                <div className="p-4 border-b border-slate-200">
                    <Input
                        type="text"
                        placeholder={`Cari ${label.toLowerCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-2/3"
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table className="w-full text-left">
                        <TableHeader>
                            <TableRow className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                                <TableHead className="px-6 py-3">
                                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                                        Nama {getSortIcon('name')}
                                    </button>
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredAndSortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="py-10 text-center text-slate-400 text-sm">
                                    {searchQuery ? `Tidak ada data yang cocok dengan "${searchQuery}".` : `Belum ada data.`}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedData.map((item) => {
                                const isMutating = isPending && mutatingItemId === item.id;
                                return (
                                    <TableRow key={item.id} className={`border-b border-slate-100 ${isMutating ? "opacity-50" : ""}`}>
                                        <TableCell className="px-6 py-3 font-medium text-slate-800">{item.name}</TableCell>
                                        <TableCell className="px-6 py-3 text-right">
                                            <div className="flex justify-end items-center gap-1">
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

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingItem ? `Edit ${label}` : `Tambah ${label} Baru`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEditSubmit} className="space-y-4 pt-4">
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
                    autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <DialogFooter>
                <Button type="submit" disabled={isPending || !newValue.trim()}>
                    {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
                    {editingItem ? 'Perbarui' : 'Tambah'}
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
