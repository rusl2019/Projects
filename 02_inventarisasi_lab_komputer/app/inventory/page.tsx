// app/inventory/page.tsx
import { getInventoryItems, getAllCategories, getAllStatuses, getAllLocations } from "@/lib/actions";
import InventoryPage from "./client-page";

export default async function ServerInventoryPage() {
  const initialInventory = await getInventoryItems();
  const categories = await getAllCategories();
  const statuses = await getAllStatuses();
  const locations = await getAllLocations();

  return (
    <InventoryPage
      initialInventory={initialInventory}
      initialCategories={categories}
      initialStatuses={statuses}
      initialLocations={locations}
    />
  );
}