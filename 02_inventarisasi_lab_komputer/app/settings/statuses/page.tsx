import { getAllStatuses } from '@/lib/actions';
import MasterDataClientPage from '@/components/MasterDataClientPage'; // Komponen klien untuk tampilan dan interaksi

export default async function StatusesPage() {
  const initialData = await getAllStatuses();
  
  return (
    <MasterDataClientPage
      type="status"
      initialData={initialData}
      title="Manajemen Kondisi Inventaris"
      label="Kondisi"
      placeholder="Nama Kondisi"
    />
  );
}
