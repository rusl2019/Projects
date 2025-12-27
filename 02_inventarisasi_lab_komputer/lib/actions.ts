// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { InventoryItem, Specs, ComponentSpec } from "./inventory-data";
import {
  readCategories,
  writeCategories,
  readStatuses,
  writeStatuses,
  readLocations,
  writeLocations,
} from "./inventory-data";

// =================================================================
// Helper Functions for Data Transformation
// =================================================================

/**
 * Transforms a Prisma InventoryItem object (with a `components` array)
 * into the application's InventoryItem format (with a `specs` object).
 */
function prismaToAppItem(
  prismaItem: any // Prisma-generated type with components
): InventoryItem {
  const specs: Specs = {
    cpu: [],
    ram: [],
    gpu: [],
    storage: [],
    psu: [],
    case: [],
  };

  if (prismaItem.components) {
    for (const component of prismaItem.components) {
      if (component.type in specs) {
        (specs[component.type as keyof Specs] as ComponentSpec[]).push({
          name: component.name,
          qty: component.qty,
        });
      }
    }
  }

  return {
    id: prismaItem.id,
    name: prismaItem.name,
    category: prismaItem.category,
    qty: prismaItem.qty,
    status: prismaItem.status,
    location: prismaItem.location,
    description: prismaItem.description || "",
    specs,
  };
}

/**
 * Transforms application item data into the format required for a Prisma create/update query.
 */
function appToPrismaData(itemData: Omit<InventoryItem, 'id'> | InventoryItem) {
  const { specs, ...rest } = itemData;
  
  const componentsToCreate: { name: string; qty: number; type: string }[] = [];
  if (specs) {
    for (const key in specs) {
      const specKey = key as keyof Specs;
      const components = specs[specKey];
      if (Array.isArray(components)) {
        components.forEach((comp) => {
          componentsToCreate.push({ ...comp, type: specKey });
        });
      }
    }
  }

  return {
    ...rest,
    components: {
      create: componentsToCreate,
    },
  };
}


// =================================================================
// Inventory Item Actions (CRUD)
// =================================================================

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const prismaItems = await prisma.inventoryItem.findMany({
    include: { components: true },
    orderBy: { createdAt: "desc" },
  });
  return prismaItems.map(prismaToAppItem);
}

export async function getInventoryItemById(
  id: string
): Promise<InventoryItem | undefined> {
  const prismaItem = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { components: true },
  });

  if (!prismaItem) {
    return undefined;
  }

  return prismaToAppItem(prismaItem);
}

export async function addInventory(itemData: Omit<InventoryItem, "id">) {
  const prismaData = appToPrismaData(itemData);
  
  const newItem = await prisma.inventoryItem.create({
    data: prismaData,
  });

  revalidatePath("/inventory");
  return newItem;
}

export async function updateInventory(updatedItem: InventoryItem) {
  const { id, ...itemData } = updatedItem;
  const prismaData = appToPrismaData(itemData);

  // In a transaction, delete old components and create new ones
  const updatedPrismaItem = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...prismaData,
      components: {
        deleteMany: {}, // Delete all existing components for this item
        create: prismaData.components.create, // Create the new set
      },
    },
  });

  revalidatePath("/inventory");
  return updatedPrismaItem;
}

export async function deleteInventory(id: string) {
  await prisma.inventoryItem.delete({
    where: { id },
  });
  revalidatePath("/inventory");
  return id;
}


// =================================================================
// Category, Status, Location Actions (Still using JSON files)
// =================================================================

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

