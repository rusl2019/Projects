// lib/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { InventoryItem, Specs, ComponentSpec } from "./inventory-data";
import { InventoryItemSchema, OptionSchema } from "./validation"; // Import Zod schemas
import { ZodFormattedError } from "zod";

// =================================================================
// Helper Functions for Data Transformation
// =================================================================

// Maps a full category name to a short key used in the 'specs' object
const categoryToSpecKey = (category: string): keyof Specs | null => {
  const map: { [key: string]: keyof Specs } = {
    "Processor (CPU)": "cpu",
    "Motherboard": "motherboard",
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
    motherboard: [],
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

// Helper to format Zod errors
const formatErrors = (errors: ZodFormattedError<any>) => {
  const formatted: { [key: string]: string[] } = {};
  for (const key in errors) {
    if (errors[key]?._errors.length > 0) {
      formatted[key] = errors[key]._errors;
    }
    // Handle nested errors for specs
    if (errors[key] && typeof errors[key] === "object" && !Array.isArray(errors[key])) {
      const nestedErrors = formatErrors(errors[key] as ZodFormattedError<any>);
      for (const nestedKey in nestedErrors) {
        formatted[`${key}.${nestedKey}`] = nestedErrors[nestedKey];
      }
    }
  }
  return formatted;
};

// =================================================================
// Inventory Item Actions (CRUD)
// =================================================================

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  errors?: { [key: string]: string[] };
  message?: string;
};

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const prismaItems = await prisma.inventoryItem.findMany({
    include: {
      specsAsSet: {
        // Include the join table
        include: {
          component: true, // And include the actual component data
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return prismaItems.map(prismaToAppItem);
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
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

export async function addInventory(itemData: Omit<InventoryItem, "id">): Promise<ActionResponse<InventoryItem>> {
  const parsed = InventoryItemSchema.safeParse(itemData);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.format(),
      message: "Validasi gagal untuk penambahan inventaris baru.",
    };
  }

  const { specs, ...restOfItemData } = parsed.data;
  const isSetKomputer = restOfItemData.category === "Set Komputer";

  try {
    const newItem = await prisma.$transaction(async (tx) => {
      // --- Start Stock Management Logic ---
      const componentsToCreate: { qty: number; componentId: string }[] = [];
      if (isSetKomputer && specs) {
        for (const specKey in specs) {
          const componentArray = specs[specKey as keyof Specs];
          if (componentArray) {
            for (const compSpec of componentArray) {
              if (compSpec.id) {
                // Check stock availability
                const componentItem = await tx.inventoryItem.findUnique({ where: { id: compSpec.id } });
                if (!componentItem || componentItem.qty < compSpec.qty) {
                  throw new Error(`Stok untuk '${compSpec.name}' tidak mencukupi (tersisa: ${componentItem?.qty || 0}).`);
                }
                // Decrement stock
                await tx.inventoryItem.update({
                  where: { id: compSpec.id },
                  data: { qty: { decrement: compSpec.qty } },
                });
                componentsToCreate.push({ qty: compSpec.qty, componentId: compSpec.id });
              }
            }
          }
        }
      }
      // --- End Stock Management Logic ---

      const createdItem = await tx.inventoryItem.create({
        data: {
          ...restOfItemData,
          specsAsSet: {
            create: componentsToCreate,
          },
        },
      });
      return createdItem;
    });

    revalidatePath("/inventory");
    return { success: true, data: prismaToAppItem(newItem), message: "Item berhasil ditambahkan!" };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return { success: false, errors: { name: ["Nama item ini sudah ada. Harap gunakan nama lain."] }, message: "Nama item duplikat." };
    }
    console.error("Error adding inventory item:", error);
    // Return specific stock error message
    return { success: false, message: error.message || "Terjadi kesalahan saat menambahkan item." };
  }
}

export async function updateInventory(updatedItem: InventoryItem): Promise<ActionResponse<InventoryItem>> {
  const parsed = InventoryItemSchema.safeParse(updatedItem);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.format(),
      message: "Validasi gagal untuk pembaruan inventaris.",
    };
  }

  const { id, specs: newSpecs, ...restOfItemData } = parsed.data;
  const isNowSetKomputer = restOfItemData.category === "Set Komputer";

  try {
    const updatedPrismaItem = await prisma.$transaction(async (tx) => {
      const oldItem = await tx.inventoryItem.findUnique({
        where: { id },
        include: { specsAsSet: { include: { component: true } } },
      });

      if (!oldItem) throw new Error("Item tidak ditemukan untuk diperbarui.");

      const wasSetKomputer = oldItem.category === "Set Komputer";

      const oldComponents = new Map<string, number>();
      if (wasSetKomputer) {
        oldItem.specsAsSet.forEach(spec => {
          oldComponents.set(spec.componentId, spec.qty);
        });
      }

      const newComponents = new Map<string, {name: string, qty: number}>();
       if (isNowSetKomputer && newSpecs) {
         Object.values(newSpecs).flat().forEach(spec => {
            if(spec.id) {
                newComponents.set(spec.id, { name: spec.name, qty: spec.qty });
            }
         });
       }

      // Calculate delta
      const stockChanges = new Map<string, { name: string, change: number }>();

      // Items to be returned to stock
      oldComponents.forEach((oldQty, componentId) => {
        const newComp = newComponents.get(componentId);
        const newQty = newComp ? newComp.qty : 0;
        const change = oldQty - newQty; // Positive if quantity decreased or removed
        if (change > 0) {
            stockChanges.set(componentId, { name: oldItem.specsAsSet.find(s => s.componentId === componentId)?.component.name || 'N/A', change: change }); // Increment stock
        }
      });
      
      // Items to be taken from stock
      newComponents.forEach((newComp, componentId) => {
        const oldQty = oldComponents.get(componentId) || 0;
        const change = oldQty - newComp.qty; // Negative if quantity increased or added
         if (change < 0) {
           stockChanges.set(componentId, { name: newComp.name, change: change }); // Decrement stock
         }
      });

      // Validate stock for decrements
      for (const [componentId, { name, change }] of stockChanges.entries()) {
        if (change < 0) { // Decrementing stock
          const componentItem = await tx.inventoryItem.findUnique({ where: { id: componentId } });
          const requiredQty = Math.abs(change);
          if (!componentItem || componentItem.qty < requiredQty) {
            throw new Error(`Stok untuk '${name}' tidak mencukupi (tersisa: ${componentItem?.qty || 0}, butuh: ${requiredQty}).`);
          }
        }
      }

      // Apply stock changes
      for (const [componentId, { change }] of stockChanges.entries()) {
         await tx.inventoryItem.update({
           where: { id: componentId },
           data: { qty: { increment: change } }, // increment handles both positive and negative
         });
      }
      
      const componentsToCreate: { qty: number; componentId: string }[] = [];
      if(isNowSetKomputer) {
          newComponents.forEach((comp, id) => {
              componentsToCreate.push({qty: comp.qty, componentId: id});
          })
      }

      // Finally, update the item itself
      const result = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...restOfItemData,
          specsAsSet: {
            deleteMany: {}, // Delete all existing component relations
            create: componentsToCreate, // Create new relations
          },
        },
      });

      return result;
    });

    revalidatePath("/inventory");
    // We need to fetch the item again to return it in the correct format
    const finalItem = await getInventoryItemById(updatedPrismaItem.id);
    return { success: true, data: finalItem, message: "Item berhasil diperbarui!" };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return { success: false, errors: { name: ["Nama item ini sudah ada. Harap gunakan nama lain."] }, message: "Nama item duplikat." };
    }
    console.error("Error updating inventory item:", error);
    return { success: false, message: error.message || "Terjadi kesalahan saat memperbarui item." };
  }
}

export async function deleteInventory(id: string): Promise<ActionResponse<string>> {
  try {
    // Check if the item is used as a component in any set
     const usageCount = await prisma.component.count({ where: { componentId: id } });
     if (usageCount > 0) {
       return { success: false, message: `Item ini tidak dapat dihapus karena sedang digunakan di ${usageCount} Set Komputer.` };
     }

    await prisma.$transaction(async (tx) => {
      // Find the item to be deleted, including its own components if it's a set
      const itemToDelete = await tx.inventoryItem.findUnique({
        where: { id },
        include: { specsAsSet: true }, // To see if it's a set and what's inside
      });

      if (!itemToDelete) {
        throw new Error("Item tidak ditemukan.");
      }
      
      // If it's a Set Komputer, return its components to stock
      if (itemToDelete.category === "Set Komputer" && itemToDelete.specsAsSet.length > 0) {
        for (const spec of itemToDelete.specsAsSet) {
          await tx.inventoryItem.update({
            where: { id: spec.componentId },
            data: { qty: { increment: spec.qty } },
          });
        }
      }

      // Now, delete the item itself
      await tx.inventoryItem.delete({
        where: { id },
      });
    });

    revalidatePath("/inventory");
    return { success: true, data: id, message: "Item berhasil dihapus." };
  } catch (error: any) {
    console.error("Error deleting inventory item:", error);
    return { success: false, message: error.message || "Terjadi kesalahan saat menghapus item." };
  }
}

// =================================================================
// Category, Status, Location Actions (NOW using Prisma with Validation)
// =================================================================

type OptionActionResponse = {
  success: boolean;
  errors?: { name?: string[] };
  message?: string;
};

export async function getAllCategories(): Promise<string[]> {
  const categories = await prisma.category.findMany({ select: { name: true } });
  return categories.map(c => c.name);
}

export async function addCategory(categoryName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: categoryName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingCategory = await prisma.category.findUnique({ where: { name: parsed.data.name } });
    if (!existingCategory) {
      await prisma.category.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, message: `Kategori '${parsed.data.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Kategori ini sudah ada."] }, message: "Kategori duplikat." };
    }
  } catch (error) {
    console.error("Error adding category:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan kategori." };
  }
}

export async function getAllStatuses(): Promise<string[]> {
  const statuses = await prisma.status.findMany({ select: { name: true } });
  return statuses.map(s => s.name);
}

export async function addStatus(statusName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: statusName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingStatus = await prisma.status.findUnique({ where: { name: parsed.data.name } });
    if (!existingStatus) {
      await prisma.status.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, message: `Status '${parsed.data.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Status ini sudah ada."] }, message: "Status duplikat." };
    }
  } catch (error) {
    console.error("Error adding status:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan status." };
  }
}

export async function getAllLocations(): Promise<string[]> {
  const locations = await prisma.location.findMany({ select: { name: true } });
  return locations.map(l => l.name);
}

export async function addLocation(locationName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: locationName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingLocation = await prisma.location.findUnique({ where: { name: parsed.data.name } });
    if (!existingLocation) {
      await prisma.location.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, message: `Lokasi '${parsed.data.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Lokasi ini sudah ada."] }, message: "Lokasi duplikat." };
    }
  } catch (error) {
    console.error("Error adding location:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan lokasi." };
  }
}
