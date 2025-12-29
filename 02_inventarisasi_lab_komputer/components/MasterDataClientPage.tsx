"use client";

import Link from "next/link"; // Import Link
import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, Loader2, SquareStack, MapPin, HardDrive, ArrowLeft } from "lucide-react"; // Import ArrowLeft

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OptionData | null>(null);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null); // State to hold validation error

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

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
      let result;
      if (editingItem) {
        result = await update(editingItem.id, newValue.trim());
      } else {
        result = await add(newValue.trim());
      }

      if (result.success) {
        toast.success(result.message || `${label} berhasil disimpan!`);
        setNewValue("");
        setIsModalOpen(false);
        setEditingItem(null);
        router.refresh(); // Revalidate data for server component to get latest
      } else {
        const errorMessage = result.errors?.name?.[0] || result.message || `Gagal menyimpan ${label}.`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${label} ini?`)) {
      return;
    }

    const { delete: deleteAction } = getActionFunctions();
    setMutatingItemId(id);

    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.success) {
        toast.success(result.message || `${label} berhasil dihapus.`);
        router.refresh(); // Revalidate data for server component to get latest
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
      case 'category': return <SquareStack className="h-6 w-6 text-blue-300" />;
      case 'status': return <HardDrive className="h-6 w-6 text-green-300" />;
      case 'location': return <MapPin className="h-6 w-6 text-purple-300" />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              {getIcon()}
              {title}
            </h1>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/inventory" className="text-blue-200 hover:text-white transition-colors">Inventaris</Link>
              <Link href="/settings" className="text-blue-200 hover:text-white transition-colors">Pengaturan Master Data</Link>
            </div>
          </div>
          <Button
            onClick={() => router.push('/settings')}
            variant="outline"
            className="text-white border-white/50 hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-end mb-4">
          <Button onClick={openAddModal} disabled={isPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Tambah {label} Baru
          </Button>
        </div>

        <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full text-left">
                <TableHeader>
                  <TableRow className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                    <TableHead className="px-6 py-4">Nama {label}</TableHead>
                    <TableHead className="px-6 py-4">ID</TableHead>
                    <TableHead className="px-6 py-4 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow className="text-center">
                      <TableCell colSpan={3} className="py-20 text-slate-400 text-sm italic">
                        Belum ada data {label}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => {
                      const isMutating = isPending && mutatingItemId === item.id;
                      return (
                        <TableRow key={item.id} className={`${isMutating ? "opacity-50 pointer-events-none" : ""}`}>
                          <TableCell className="px-6 py-5 font-medium">{item.name}</TableCell>
                          <TableCell className="px-6 py-5 text-slate-500 text-xs font-mono">{item.id}</TableCell>
                          <TableCell className="px-6 py-5 text-center">
                            <div className="flex justify-center items-center gap-2">
                              {isMutating ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditModal(item)}
                                    disabled={isPending}
                                    title="Edit"
                                  >
                                    <Pencil className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={isPending}
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-700" />
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
        setIsModalOpen(open);
        if (!open) {
          setEditingItem(null);
          setNewValue("");
          setError(null);
        }
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
                onChange={(e) => {
                  setNewValue(e.target.value);
                  if (error) setError(null);
                }}
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
