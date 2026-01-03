import { getAllCategories, getAllStatuses, getAllLocations } from '@/lib/actions';
import MasterDataTable from '@/components/MasterDataTable';
import Navbar from '@/components/Navbar';

export default async function SettingsPage() {
  const [categories, statuses, locations] = await Promise.all([
    getAllCategories(),
    getAllStatuses(),
    getAllLocations(),
  ]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4 md:p-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-8">Pengaturan Master Data</h2>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
          <MasterDataTable
            type="category"
            initialData={categories}
            title="Manajemen Kategori"
            label="Kategori"
            placeholder="Nama Kategori Baru"
          />
          <MasterDataTable
            type="status"
            initialData={statuses}
            title="Manajemen Kondisi"
            label="Kondisi"
            placeholder="Nama Kondisi Baru"
          />
          <MasterDataTable
            type="location"
            initialData={locations}
            title="Manajemen Lokasi"
            label="Lokasi"
            placeholder="Nama Lokasi Baru"
          />
        </div>
      </main>
    </div>
  );
}