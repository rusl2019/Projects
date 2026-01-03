import Link from "next/link";
import { Pencil, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { InventoryItem } from "@/lib/inventory-data";
import { useInventoryStore } from "@/lib/store"; // Import the Zustand store
import { Input } from "./ui/input";

type SortableInventoryColumns = 'name' | 'categoryName' | 'qty' | 'statusName' | 'locationName';

interface InventoryTableProps {
  itemToEdit: InventoryItem | null;
  isPending: boolean;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => Promise<void>;
  mutatingItemId: string | null;
}

export default function InventoryTable({
  itemToEdit,
  isPending,
  onEditItem,
  onDeleteItem,
  mutatingItemId,
}: InventoryTableProps) {
  const { filteredInventory, sortColumn, sortDirection, setSort, selectedItems, toggleSelectAll, toggleItemSelection } = useInventoryStore(); // Get filtered and sorted data, and sort state from the store

  const handleSort = (column: SortableInventoryColumns) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSort(column, 'desc');
      } else if (sortDirection === 'desc') {
        setSort(column, null); // Remove sort if clicked twice on 'desc'
      } else {
        setSort(column, 'asc'); // Default to ascending if no sort
      }
    } else {
      setSort(column, 'asc'); // Default to ascending when changing column
    }
  };

  const getSortIcon = (column: SortableInventoryColumns) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400 flex-shrink-0" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4 flex-shrink-0" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4 flex-shrink-0" />;
  };

  const areAllFilteredItemsSelected = filteredInventory.length > 0 && filteredInventory.every(item => selectedItems.includes(item.id));

  return (
    <div className="lg:col-span-2 space-y-4">
      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full text-left">
              <TableHeader>
                <TableRow className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100">
                <TableHead className="px-6 py-4">
                    <Input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={areAllFilteredItemsSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all items on this page"
                    />
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <button
                      className="flex items-center justify-between w-full cursor-pointer transition-colors hover:bg-slate-100/50 -mx-3 px-3 rounded"
                      onClick={() => handleSort('name')}
                    >
                      Item & Rincian
                      {getSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <button
                      className="flex items-center justify-between w-full cursor-pointer transition-colors hover:bg-slate-100/50 -mx-3 px-3 rounded"
                      onClick={() => handleSort('categoryName')}
                    >
                      Kategori
                      {getSortIcon('categoryName')}
                    </button>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <button
                      className="flex items-center justify-between w-full cursor-pointer transition-colors hover:bg-slate-100/50 -mx-3 px-3 rounded"
                      onClick={() => handleSort('qty')}
                    >
                      Stok
                      {getSortIcon('qty')}
                    </button>
                  </TableHead>
                  {/* Tambahkan kolom Sortable untuk Status dan Lokasi jika diinginkan */}
                  {/* <TableHead className="px-6 py-4">
                    <button
                      className="flex items-center justify-between w-full cursor-pointer transition-colors hover:bg-slate-100/50 -mx-3 px-3 rounded"
                      onClick={() => handleSort('statusName')}
                    >
                      Kondisi
                      {getSortIcon('statusName')}
                    </button>
                  </TableHead>
                  <TableHead className="px-6 py-4">
                    <button
                      className="flex items-center justify-between w-full cursor-pointer transition-colors hover:bg-slate-100/50 -mx-3 px-3 rounded"
                      onClick={() => handleSort('locationName')}
                    >
                      Lokasi
                      {getSortIcon('locationName')}
                    </button>
                  </TableHead> */}
                  <TableHead className="px-6 py-4 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody id="inventory-list">
                {filteredInventory.length === 0 ? (
                  <TableRow className="text-center">
                    <TableCell colSpan={5} className="py-20 text-slate-400 text-sm italic">
                      Belum ada data inventori atau tidak ada hasil yang cocok.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const statusClass =
                      item.statusName === "Bagus"
                        ? "text-emerald-500 bg-emerald-50"
                        : item.statusName === "Rusak Ringan"
                        ? "text-amber-500 bg-amber-50"
                        : "text-rose-500 bg-rose-50";

                    const isBeingEdited = itemToEdit && itemToEdit.id === item.id;
                    const isMutating = isPending && mutatingItemId === item.id;

                    let specsHtml = null;
                    if (item.categoryName === "Set Komputer" && item.specs) {
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
                          {line("Mobo", s.motherboard)}
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
                        } ${isMutating ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <TableCell className="px-6 py-5 align-top">
                          <Input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            aria-label={`Select item ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top">
                          <div className="flex flex-col">
                            <Link href={`/inventory/${item.id}`} className="font-bold text-blue-600 hover:underline text-sm">
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${statusClass}`}
                              >
                                {item.statusName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Loc: {item.locationName}
                              </span>
                            </div>
                            {specsHtml}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top text-xs font-bold text-slate-400 uppercase">
                          {item.categoryName}
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top text-center">
                          <span className="font-mono font-bold text-blue-800 text-sm bg-blue-50 px-2 py-1 rounded">
                            {item.qty}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-5 align-top text-center">
                          <div className="flex justify-center items-center gap-1 h-full">
                            {isMutating ? (
                              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onEditItem(item.id)}
                                  title="Edit Data"
                                  disabled={isPending}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onDeleteItem(item.id)}
                                  title="Hapus Data"
                                  disabled={isPending}
                                  className="text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
