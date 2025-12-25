// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from 'crypto'; // Import randomUUID for unique IDs
import { readInventoryData, writeInventoryData, InventoryItem, readCategories, writeCategories, readStatuses, writeStatuses, readLocations, writeLocations } from "./inventory-data";

export async function addInventory(itemData: Omit<InventoryItem, 'id'>) {
  // Ensure specs are in the new array format before adding
  const processedItemData = ensureSpecsArrayFormat(itemData);
  const inventory = await readInventoryData();
  // Ensure description is an empty string if not provided, to match interface
  const newItem = { ...processedItemData, id: randomUUID(), description: processedItemData.description || '' }; // Use randomUUID()
  inventory.unshift(newItem);
  await writeInventoryData(inventory);
  revalidatePath("/inventory");
  return newItem;
}

export async function updateInventory(updatedItem: InventoryItem) {
  // Ensure specs are in the new array format before updating
  const processedItem = ensureSpecsArrayFormat(updatedItem);
  const inventory = await readInventoryData();
  const index = inventory.findIndex((item) => item.id === processedItem.id);
  if (index !== -1) {
    // Ensure description is an empty string if not provided, to match interface
    inventory[index] = { ...processedItem, description: processedItem.description || '' };
    await writeInventoryData(inventory);
    revalidatePath("/inventory");
    return processedItem;
  }
  return null;
}

export async function deleteInventory(id: string) { // Changed id type to string
  let inventory = await readInventoryData();
  inventory = inventory.filter((item) => item.id !== id); // comparison is now string-to-string
  await writeInventoryData(inventory);
  revalidatePath("/inventory");
  return id;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const inventory = await readInventoryData();
  // Migrate all items to new specs structure if needed
  return inventory.map(item => migrateSpecsStructure(item));
}

export async function getAllCategories(): Promise<string[]> {
  return readCategories();
}

export async function addCategory(category: string): Promise<void> {
  const categories = await readCategories();
  if (!categories.includes(category)) {
    categories.push(category);
    await writeCategories(categories);
    revalidatePath("/inventory"); // Revalidate to update dropdowns
  }
}

export async function getAllStatuses(): Promise<string[]> {
  return readStatuses();
}

export async function addStatus(status: string): Promise<void> {
  const statuses = await readStatuses();
  if (!statuses.includes(status)) {
    statuses.push(status);
    await writeStatuses(statuses);
    revalidatePath("/inventory");
  }
}

export async function getAllLocations(): Promise<string[]> {
  return readLocations();
}

export async function addLocation(location: string): Promise<void> {
  const locations = await readLocations();
  if (!locations.includes(location)) {
    locations.push(location);
    await writeLocations(locations);
    revalidatePath("/inventory");
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> { // Changed id type to string
  console.log(`[DEBUG] getInventoryItemById: Searching for ID: ${id}`);
  const inventory = await readInventoryData();
  console.log(`[DEBUG] getInventoryItemById: Inventory loaded, count: ${inventory.length}`);
  let foundItem = inventory.find(item => item.id === id); // comparison is now string-to-string

  // Handle migration from old specs structure to new array structure
  if (foundItem && foundItem.specs) {
    foundItem = migrateSpecsStructure(foundItem);
  }

  console.log(`[DEBUG] getInventoryItemById: Item found: ${!!foundItem}`); // !!foundItem will be true if found, false otherwise
  return foundItem;
}

// Helper function to ensure specs are in the new array format
function ensureSpecsArrayFormat(item: Omit<InventoryItem, 'id'> | InventoryItem): Omit<InventoryItem, 'id'> | InventoryItem {
  if (!item.specs) return item;

  // Check if specs are in the old format (single objects)
  if (item.specs.cpu && typeof (item.specs.cpu as any).name === 'string') {
    // Old format detected, convert to new format
    const oldSpecs = item.specs as any;
    return {
      ...item,
      specs: {
        cpu: oldSpecs.cpu.name ? [{ name: oldSpecs.cpu.name, qty: oldSpecs.cpu.qty }] : [],
        ram: oldSpecs.ram.name ? [{ name: oldSpecs.ram.name, qty: oldSpecs.ram.qty }] : [],
        gpu: oldSpecs.gpu.name ? [{ name: oldSpecs.gpu.name, qty: oldSpecs.gpu.qty }] : [],
        storage: oldSpecs.storage.name ? [{ name: oldSpecs.storage.name, qty: oldSpecs.storage.qty }] : [],
        psu: oldSpecs.psu && oldSpecs.psu.name ? [{ name: oldSpecs.psu.name, qty: oldSpecs.psu.qty }] : [],
        case: oldSpecs.case && oldSpecs.case.name ? [{ name: oldSpecs.case.name, qty: oldSpecs.case.qty }] : [],
      }
    };
  }

  // If already in new format, just return the item
  return item;
}

// Helper function to migrate old specs structure to new array structure
function migrateSpecsStructure(item: InventoryItem): InventoryItem {
  if (!item.specs) return item;

  // Check if specs are in the old format (single objects)
  if (item.specs.cpu && typeof (item.specs.cpu as any).name === 'string') {
    // Old format detected, convert to new format
    const oldSpecs = item.specs as any;
    return {
      ...item,
      specs: {
        cpu: oldSpecs.cpu.name ? [{ name: oldSpecs.cpu.name, qty: oldSpecs.cpu.qty }] : [],
        ram: oldSpecs.ram.name ? [{ name: oldSpecs.ram.name, qty: oldSpecs.ram.qty }] : [],
        gpu: oldSpecs.gpu.name ? [{ name: oldSpecs.gpu.name, qty: oldSpecs.gpu.qty }] : [],
        storage: oldSpecs.storage.name ? [{ name: oldSpecs.storage.name, qty: oldSpecs.storage.qty }] : [],
        psu: oldSpecs.psu && oldSpecs.psu.name ? [{ name: oldSpecs.psu.name, qty: oldSpecs.psu.qty }] : [],
        case: oldSpecs.case && oldSpecs.case.name ? [{ name: oldSpecs.case.name, qty: oldSpecs.case.qty }] : [],
      }
    };
  }

  return item;
}

