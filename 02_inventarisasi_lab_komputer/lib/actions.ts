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

/**
 * Helper to map category name to spec key, still useful for component identification
 */
function categoryToSpecKey(categoryName: string): keyof Specs | null {
  const map: { [key: string]: keyof Specs } = {
    "Processor (CPU)": "cpu",
    "Motherboard": "motherboard",
    "Memori (RAM)": "ram",
    "Kartu Grafis (GPU)": "gpu",
    "Penyimpanan (SSD/HDD)": "storage",
    "Power Supply (PSU)": "psu",
    "Casing PC": "case",
  };
  return map[categoryName] || null;
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

  if (prismaItem.specsAsSet) {
    for (const spec of prismaItem.specsAsSet) {
      const component = spec.component;
      if (component) {
        const componentCategoryName = component.category.name; 
        const specKey = categoryToSpecKey(componentCategoryName);
        if (specKey) {
          (specs[specKey] as ComponentSpec[]).push({
            id: component.id,
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
    categoryId: prismaItem.categoryId,
    categoryName: prismaItem.category.name,
    qty: prismaItem.qty,
    statusId: prismaItem.statusId,
    statusName: prismaItem.status.name,
    locationId: prismaItem.locationId,
    locationName: prismaItem.location.name,
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
      category: true,
      status: true,
      location: true,
      specsAsSet: {
        include: {
          component: {
            include: { category: true }
          },
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
      category: true,
      status: true,
      location: true,
      specsAsSet: {
        include: {
          component: {
            include: { category: true }
          },
        },
      },
    },
  });

  if (!prismaItem) {
    return undefined;
  }

  return prismaToAppItem(prismaItem);
}

export async function addInventory(itemData: Omit<InventoryItem, "id" | "categoryName" | "statusName" | "locationName">): Promise<ActionResponse<InventoryItem>> {
  const parsed = InventoryItemSchema.safeParse(itemData);

  if (!parsed.success) {
    return {
      success: false,
      errors: formatErrors(parsed.error.format()),
      message: "Validasi gagal untuk penambahan inventaris baru.",
    };
  }

  const { categoryId, statusId, locationId, specs, ...restOfItemData } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { success: false, message: "Kategori tidak ditemukan." };
  }
  const isSetKomputer = category.name === "Set Komputer";

  if (isSetKomputer) {
    if (!specs) {
      return { success: false, errors: { specs: ["Spesifikasi komponen harus diisi untuk 'Set Komputer'."] }, message: "Validasi gagal." };
    }
    const hasAnySpecs = Object.values(specs).some(arr => arr && arr.length > 0);
    if (!hasAnySpecs) {
      return { success: false, errors: { specs: ["Setidaknya satu jenis komponen harus ditambahkan untuk 'Set Komputer'."] }, message: "Validasi gagal." };
    }
  }

  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const componentsToCreate: { qty: number; componentId: string }[] = [];
      if (isSetKomputer && specs) {
        for (const specKey in specs) {
          const componentArray = specs[specKey as keyof Specs];
          if (componentArray) {
            for (const compSpec of componentArray) {
              if (compSpec.id) {
                const componentItem = await tx.inventoryItem.findUnique({ where: { id: compSpec.id } });
                if (!componentItem || componentItem.qty < compSpec.qty) {
                  throw new Error(`Stok untuk '${compSpec.name}' tidak mencukupi (tersisa: ${componentItem?.qty || 0}).`);
                }
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

      const createdItem = await tx.inventoryItem.create({
        data: {
          ...restOfItemData,
          categoryId,
          statusId,
          locationId,
          specsAsSet: {
            create: componentsToCreate,
          },
        },
        include: { category: true, status: true, location: true }
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
    return { success: false, message: error.message || "Terjadi kesalahan saat menambahkan item." };
  }
}

export async function updateInventory(itemData: InventoryItem): Promise<ActionResponse<InventoryItem>> {
  const parsed = InventoryItemSchema.safeParse(itemData);

  if (!parsed.success) {
    return {
      success: false,
      errors: formatErrors(parsed.error.format()),
      message: "Validasi gagal untuk pembaruan inventaris.",
    };
  }

  const { id, categoryId, statusId, locationId, specs: newSpecs, ...restOfItemData } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { success: false, message: "Kategori tidak ditemukan." };
  }
  const isNowSetKomputer = category.name === "Set Komputer";

  if (isNowSetKomputer) {
    if (!newSpecs) {
      return { success: false, errors: { specs: ["Spesifikasi komponen harus diisi untuk 'Set Komputer'."] }, message: "Validasi gagal." };
    }
    const hasAnySpecs = Object.values(newSpecs).some(arr => arr && arr.length > 0);
    if (!hasAnySpecs) {
      return { success: false, errors: { specs: ["Setidaknya satu jenis komponen harus ditambahkan untuk 'Set Komputer'."] }, message: "Validasi gagal." };
    }
  }

  try {
    const updatedPrismaItem = await prisma.$transaction(async (tx) => {
      const oldItem = await tx.inventoryItem.findUnique({
        where: { id },
        include: { 
          category: true,
          specsAsSet: { include: { component: true } }
        },
      });

      if (!oldItem) throw new Error("Item tidak ditemukan untuk diperbarui.");

      const wasSetKomputer = oldItem.category.name === "Set Komputer";

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

      const stockChanges = new Map<string, { name: string, change: number }>();

      oldComponents.forEach((oldQty, componentId) => {
        const newComp = newComponents.get(componentId);
        const newQty = newComp ? newComp.qty : 0;
        const change = oldQty - newQty;
        if (change > 0) {
            stockChanges.set(componentId, { name: oldItem.specsAsSet.find(s => s.componentId === componentId)?.component.name || 'N/A', change: change });
        }
      });
      
      newComponents.forEach((newComp, componentId) => {
        const oldQty = oldComponents.get(componentId) || 0;
        const change = oldQty - newComp.qty;
         if (change < 0) {
           stockChanges.set(componentId, { name: newComp.name, change: change });
         }
      });

      for (const [componentId, { name, change }] of stockChanges.entries()) {
        if (change < 0) {
          const componentItem = await tx.inventoryItem.findUnique({ where: { id: componentId } });
          const requiredQty = Math.abs(change);
          if (!componentItem || componentItem.qty < requiredQty) {
            throw new Error(`Stok untuk '${name}' tidak mencukupi (tersisa: ${componentItem?.qty || 0}, butuh: ${requiredQty}).`);
          }
        }
      }

      for (const [componentId, { change }] of stockChanges.entries()) {
         await tx.inventoryItem.update({
           where: { id: componentId },
           data: { qty: { increment: change } },
         });
      }
      
      const componentsToCreate: { qty: number; componentId: string }[] = [];
      if(isNowSetKomputer) {
          newComponents.forEach((comp, id) => {
              componentsToCreate.push({qty: comp.qty, componentId: id});
          })
      }

      const result = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...restOfItemData,
          categoryId,
          statusId,
          locationId,
          specsAsSet: {
            deleteMany: {},
            create: componentsToCreate,
          },
        },
        include: { category: true, status: true, location: true }
      });

      return result;
    });

    revalidatePath("/inventory");
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
    const usageCount = await prisma.component.count({ where: { componentId: id } });
    if (usageCount > 0) {
       return { success: false, message: `Item ini tidak dapat dihapus karena sedang digunakan di ${usageCount} Set Komputer.` };
     }

    await prisma.$transaction(async (tx) => {
      const itemToDelete = await tx.inventoryItem.findUnique({
        where: { id },
        include: { category: true, specsAsSet: true },
      });

      if (!itemToDelete) {
        throw new Error("Item tidak ditemukan.");
      }
      
      if (itemToDelete.category.name === "Set Komputer" && itemToDelete.specsAsSet.length > 0) {
        for (const spec of itemToDelete.specsAsSet) {
          await tx.inventoryItem.update({
            where: { id: spec.componentId },
            data: { qty: { increment: spec.qty } },
          });
        }
      }

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

type OptionData = { id: string; name: string };

type OptionActionResponse = {
  success: boolean;
  data?: OptionData;
  errors?: { name?: string[] };
  message?: string;
};

export async function getAllCategories(): Promise<OptionData[]> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  return categories;
}

export async function addCategory(categoryName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: categoryName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingCategory = await prisma.category.findUnique({ where: { name: parsed.data.name } });
    if (!existingCategory) {
      const newCategory = await prisma.category.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, data: { id: newCategory.id, name: newCategory.name }, message: `Kategori '${parsed.data.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Kategori ini sudah ada."] }, message: "Kategori duplikat." };
    }
  } catch (error) {
    console.error("Error adding category:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan kategori." };
  }
}

export async function updateCategory(id: string, newName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: newName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingCategory = await prisma.category.findFirst({
      where: { name: parsed.data.name, id: { not: id } },
    });
    if (existingCategory) {
      return { success: false, errors: { name: ["Kategori dengan nama ini sudah ada."] }, message: "Nama kategori duplikat." };
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    revalidatePath("/inventory");
    return { success: true, data: { id: updatedCategory.id, name: updatedCategory.name }, message: `Kategori '${updatedCategory.name}' berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, message: "Terjadi kesalahan saat memperbarui kategori." };
  }
}

export async function deleteCategory(id: string): Promise<OptionActionResponse> {
  try {
    const usageCount = await prisma.inventoryItem.count({ where: { categoryId: id } });
    if (usageCount > 0) {
      return { success: false, message: `Kategori ini tidak dapat dihapus karena digunakan oleh ${usageCount} item inventaris.` };
    }

    const deletedCategory = await prisma.category.delete({ where: { id } });
    revalidatePath("/inventory");
    return { success: true, data: { id: deletedCategory.id, name: deletedCategory.name }, message: `Kategori '${deletedCategory.name}' berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, message: "Terjadi kesalahan saat menghapus kategori." };
  }
}

export async function getAllStatuses(): Promise<OptionData[]> {
  const statuses = await prisma.status.findMany({ select: { id: true, name: true } });
  return statuses;
}

export async function addStatus(statusName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: statusName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingStatus = await prisma.status.findUnique({ where: { name: parsed.data.name } });
    if (!existingStatus) {
      const newStatus = await prisma.status.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, data: { id: newStatus.id, name: newStatus.name }, message: `Status '${parsed.data.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Status ini sudah ada."] }, message: "Status duplikat." };
    }
  } catch (error) {
    console.error("Error adding status:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan status." };
  }
}

export async function updateStatus(id: string, newName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: newName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingStatus = await prisma.status.findFirst({
      where: { name: parsed.data.name, id: { not: id } },
    });
    if (existingStatus) {
      return { success: false, errors: { name: ["Status dengan nama ini sudah ada."] }, message: "Nama status duplikat." };
    }

    const updatedStatus = await prisma.status.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    revalidatePath("/inventory");
    return { success: true, data: { id: updatedStatus.id, name: updatedStatus.name }, message: `Status '${updatedStatus.name}' berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, message: "Terjadi kesalahan saat memperbarui status." };
  }
}

export async function deleteStatus(id: string): Promise<OptionActionResponse> {
  try {
    const usageCount = await prisma.inventoryItem.count({ where: { statusId: id } });
    if (usageCount > 0) {
      return { success: false, message: `Status ini tidak dapat dihapus karena digunakan oleh ${usageCount} item inventaris.` };
    }

    const deletedStatus = await prisma.status.delete({ where: { id } });
    revalidatePath("/inventory");
    return { success: true, data: { id: deletedStatus.id, name: deletedStatus.name }, message: `Status '${deletedStatus.name}' berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting status:", error);
    return { success: false, message: "Terjadi kesalahan saat menghapus status." };
  }
}

export async function getAllLocations(): Promise<OptionData[]> {
  const locations = await prisma.location.findMany({ select: { id: true, name: true } });
  return locations;
}

export async function addLocation(locationName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: locationName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingLocation = await prisma.location.findUnique({ where: { name: parsed.data.name } });
    if (!existingLocation) {
      const newLocation = await prisma.location.create({ data: { name: parsed.data.name } });
      revalidatePath("/inventory");
      return { success: true, data: { id: newLocation.id, name: newLocation.name }, message: `Lokasi '${newLocation.name}' berhasil ditambahkan.` };
    } else {
      return { success: false, errors: { name: ["Lokasi ini sudah ada."] }, message: "Lokasi duplikat." };
    }
  } catch (error) {
    console.error("Error adding location:", error);
    return { success: false, message: "Terjadi kesalahan saat menambahkan lokasi." };
  }
}

export async function updateLocation(id: string, newName: string): Promise<OptionActionResponse> {
  const parsed = OptionSchema.safeParse({ name: newName });
  if (!parsed.success) {
    return { success: false, errors: parsed.error.format(), message: "Validasi gagal." };
  }

  try {
    const existingLocation = await prisma.location.findFirst({
      where: { name: parsed.data.name, id: { not: id } },
    });
    if (existingLocation) {
      return { success: false, errors: { name: ["Lokasi dengan nama ini sudah ada."] }, message: "Nama lokasi duplikat." };
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    revalidatePath("/inventory");
    return { success: true, data: { id: updatedLocation.id, name: updatedLocation.name }, message: `Lokasi '${updatedLocation.name}' berhasil diperbarui.` };
  } catch (error) {
    console.error("Error updating location:", error);
    return { success: false, message: "Terjadi kesalahan saat memperbarui lokasi." };
  }
}

export async function deleteLocation(id: string): Promise<OptionActionResponse> {
  try {
    const usageCount = await prisma.inventoryItem.count({ where: { locationId: id } });
    if (usageCount > 0) {
      return { success: false, message: `Lokasi ini tidak dapat dihapus karena digunakan oleh ${usageCount} item inventaris.` };
    }

    const deletedLocation = await prisma.location.delete({ where: { id } });
    revalidatePath("/inventory");
    return { success: true, data: { id: deletedLocation.id, name: deletedLocation.name }, message: `Lokasi '${deletedLocation.name}' berhasil dihapus.` };
  } catch (error) {
    console.error("Error deleting location:", error);
    return { success: false, message: "Terjadi kesalahan saat menghapus lokasi." };
  }
}