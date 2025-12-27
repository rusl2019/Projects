// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { InventoryItem, Specs, ComponentSpec } from "./inventory-data";
// Remove JSON file specific imports for master data
// import { readCategories, writeCategories, readStatuses, writeStatuses, readLocations, writeLocations } from "./inventory-data";

// =================================================================
// Helper Functions for Data Transformation
// =================================================================

// Maps a full category name to a short key used in the 'specs' object
const categoryToSpecKey = (category: string): keyof Specs | null => {
  const map: { [key: string]: keyof Specs } = {
    "Processor (CPU)": "cpu",
    "Memori (RAM)": "ram",
    "Kartu Grafis (GPU)": "gpu",
    "Penyimpanan (SSD/HDD)": "storage",
    "Power Supply (PSU)": "psu",
    "Casing PC": "case",
  };
  return map[category] || null;
};

/**
 * Transforms a Prisma InventoryItem object (with nested relations)
 * into the application's flat InventoryItem format (with a `specs` object).
 */
function prismaToAppItem(prismaItem: any): InventoryItem {
  const specs: Specs = {
    cpu: [],
    ram: [],
    gpu: [],
    storage: [],
    psu: [],
    case: [],
  };

  // The new relation is called `specsAsSet`
  if (prismaItem.specsAsSet) {
    for (const spec of prismaItem.specsAsSet) {
      // The actual component data is nested inside
      const component = spec.component;
      if (component) {
        const specKey = categoryToSpecKey(component.category);
        if (specKey) {
          (specs[specKey] as ComponentSpec[]).push({
            id: component.id, // Pass the component's own ID
            name: component.name,
            qty: spec.qty,
          });
        }
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

// =================================================================
// Inventory Item Actions (CRUD)
// =================================================================

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const prismaItems = await prisma.inventoryItem.findMany({
    include: {
      specsAsSet: { // Include the join table
        include: {
          component: true, // And include the actual component data
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return prismaItems.map(prismaToAppItem);
}

export async function getInventoryItemById(
  id: string
): Promise<InventoryItem | undefined> {
  const prismaItem = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      specsAsSet: {
        include: {
          component: true,
        },
      },
    },
  });

  if (!prismaItem) {
    return undefined;
  }

  return prismaToAppItem(prismaItem);
}

export async function addInventory(itemData: Omit<InventoryItem, "id">) {
  const { specs, ...restOfItemData } = itemData;

  const componentsToCreate: { qty: number; componentId: string }[] = [];
  if (specs) {
    Object.values(specs).forEach((specArray) => {
      specArray.forEach((compSpec) => {
        // The form now needs to provide the component's ID
        if (compSpec.id) {
          componentsToCreate.push({
            qty: compSpec.qty,
            componentId: compSpec.id,
          });
        }
      });
    });
  }

  const newItem = await prisma.inventoryItem.create({
    data: {
      ...restOfItemData,
      specsAsSet: {
        create: componentsToCreate,
      },
    },
  });

  revalidatePath("/inventory");
  return newItem;
}

export async function updateInventory(updatedItem: InventoryItem) {
  const { id, specs, ...restOfItemData } = updatedItem;

  const componentsToCreate: { qty: number; componentId: string }[] = [];
  if (specs) {
    Object.values(specs).forEach((specArray) => {
      specArray.forEach((compSpec) => {
        if (compSpec.id) {
          componentsToCreate.push({
            qty: compSpec.qty,
            componentId: compSpec.id,
          });
        }
      });
    });
  }

  const updatedPrismaItem = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...restOfItemData,
      specsAsSet: {
        deleteMany: {}, // Delete all existing component relations for this set
        create: componentsToCreate, // Create the new set of relations
      },
    },
  });

  revalidatePath("/inventory");
  return updatedPrismaItem;
}

export async function deleteInventory(id: string) {
  // Thanks to `onDelete: Cascade` in the schema, deleting an InventoryItem
  // will also delete all `Component` records that link to it.
  await prisma.inventoryItem.delete({
    where: { id },
  });
  revalidatePath("/inventory");
  return id;
}


// =================================================================
// Category, Status, Location Actions (NOW using Prisma)
// =================================================================

export async function getAllCategories(): Promise<string[]> {
  const categories = await prisma.category.findMany({ select: { name: true } });
  return categories.map(c => c.name);
}

export async function addCategory(category: string): Promise<void> {
  const existingCategory = await prisma.category.findUnique({ where: { name: category } });
  if (!existingCategory) {
    await prisma.category.create({ data: { name: category } });
    revalidatePath("/inventory");
  }
}

export async function getAllStatuses(): Promise<string[]> {
  const statuses = await prisma.status.findMany({ select: { name: true } });
  return statuses.map(s => s.name);
}

export async function addStatus(status: string): Promise<void> {
  const existingStatus = await prisma.status.findUnique({ where: { name: status } });
  if (!existingStatus) {
    await prisma.status.create({ data: { name: status } });
    revalidatePath("/inventory");
  }
}

export async function getAllLocations(): Promise<string[]> {
  const locations = await prisma.location.findMany({ select: { name: true } });
  return locations.map(l => l.name);
}

export async function addLocation(location: string): Promise<void> {
  const existingLocation = await prisma.location.findUnique({ where: { name: location } });
  if (!existingLocation) {
    await prisma.location.create({ data: { name: location } });
    revalidatePath("/inventory");
  }
}
