import { getAllLocations } from '@/lib/actions';
import MasterDataClientPage from '@/components/MasterDataClientPage'; // Komponen klien untuk tampilan dan interaksi

export default async function LocationsPage() {
  const initialData = await getAllLocations();
  
  return (
    <MasterDataClientPage
      type="location"
      initialData={initialData}
      title="Manajemen Lokasi Inventaris"
      label="Lokasi"
      placeholder="Nama Lokasi"
    />
  );
}
