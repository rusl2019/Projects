// app/inventory/[id]/page.tsx
import { getInventoryItemById } from "@/lib/actions";
import { HardDrive } from "lucide-react";
import Link from "next/link"; // Import Link for navigation
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from '@/lib/safe-html'; // Import fungsi sanitizeHtml

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage(props: ItemDetailPageProps) {
  const { id } = await props.params; // Await the params Promise
  const item = await getInventoryItemById(id);

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Item Tidak Ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Item dengan ID {id} tidak ditemukan dalam inventaris.</p>
            <Button asChild>
              <Link href="/inventory">Kembali ke Daftar Inventaris</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sanitize the description before rendering
  const safeDescription = item.description ? sanitizeHtml(item.description) : '';

  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-blue-300" />
            Detail Item Inventaris
          </h1>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800">{item.name}</CardTitle>
            <p className="text-sm text-slate-500">ID: {item.id}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Kategori:</p>
              <p className="text-slate-600">{item.categoryName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Stok:</p>
              <p className="text-slate-600">{item.qty}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Kondisi:</p>
              <p className="text-slate-600">{item.statusName}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Lokasi:</p>
              <p className="text-slate-600">{item.locationName}</p>
            </div>
            {item.specs && item.categoryName === 'Set Komputer' && (
              <div>
                <p className="text-sm font-semibold text-slate-700">Spesifikasi Komponen:</p>
                <ul className="list-disc list-inside text-slate-600">
                  {item.specs.cpu.length > 0 && item.specs.cpu.map((cpu, index) => (
                    <li key={`cpu-${index}`}>CPU: {cpu.qty}x {cpu.name}</li>
                  ))}
                  {item.specs.motherboard.length > 0 && item.specs.motherboard.map((motherboard, index) => (
                    <li key={`motherboard-${index}`}>Motherboard: {motherboard.qty}x {motherboard.name}</li>
                  ))}
                  {item.specs.ram.length > 0 && item.specs.ram.map((ram, index) => (
                    <li key={`ram-${index}`}>RAM: {ram.qty}x {ram.name}</li>
                  ))}
                  {item.specs.gpu.length > 0 && item.specs.gpu.map((gpu, index) => (
                    <li key={`gpu-${index}`}>GPU: {gpu.qty}x {gpu.name}</li>
                  ))}
                  {item.specs.storage.length > 0 && item.specs.storage.map((storage, index) => (
                    <li key={`storage-${index}`}>Penyimpanan: {storage.qty}x {storage.name}</li>
                  ))}
                  {item.specs.psu.length > 0 && item.specs.psu.map((psu, index) => (
                    <li key={`psu-${index}`}>PSU: {psu.qty}x {psu.name}</li>
                  ))}
                  {item.specs.case.length > 0 && item.specs.case.map((caseItem, index) => (
                    <li key={`case-${index}`}>Casing: {caseItem.qty}x {caseItem.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {safeDescription && (
              <div>
                <p className="text-sm font-semibold text-slate-700">Deskripsi:</p>
                <div className="prose max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: safeDescription }} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory">Kembali</Link>
            </Button>
            {/* Optionally add edit/delete buttons here that call server actions directly */}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
