import { getAllCategories } from '@/lib/actions';
import MasterDataClientPage from '@/components/MasterDataClientPage'; // Komponen klien untuk tampilan dan interaksi

export default async function CategoriesPage() {
  const initialData = await getAllCategories();
  
  return (
    <MasterDataClientPage
      type="category"
      initialData={initialData}
      title="Manajemen Kategori Inventaris"
      label="Kategori"
      placeholder="Nama Kategori"
    />
  );
}
