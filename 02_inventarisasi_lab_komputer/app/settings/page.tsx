import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SquareStack, HardDrive, MapPin } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <nav className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HardDrive className="h-6 w-6 text-blue-300" />
              Pengaturan Master Data
            </h1>
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/inventory" className="text-blue-200 hover:text-white transition-colors">Inventaris</Link>
              <Link href="/settings" className="text-blue-200 hover:text-white transition-colors">Pengaturan</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8">
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
