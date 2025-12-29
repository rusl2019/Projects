import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SquareStack, HardDrive, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function SettingsPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      <main className="container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Pengaturan Master Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/settings/categories">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SquareStack className="h-5 w-5 text-blue-600" />
                  Kategori
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Mengelola daftar kategori inventaris (misalnya, Processor, RAM, Monitor).
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/statuses">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="h-5 w-5 text-green-600" />
                  Kondisi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Mengelola status kondisi item inventaris (misalnya, Bagus, Rusak Ringan).
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings/locations">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Mengelola daftar lokasi penyimpanan inventaris (misalnya, Lab RPL 1, Gudang IT).
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
