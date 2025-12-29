import { z } from 'zod';

// Schema for individual components (CPU, RAM, etc.)
export const ComponentSchema = z.object({
  id: z.string().cuid('ID komponen tidak valid.').optional(), // ID is optional for new components, required if coming from DB
  name: z.string().min(1, "Nama komponen tidak boleh kosong."),
  qty: z.number().int().min(1, "Kuantitas komponen harus minimal 1."),
});

// Schema for the 'specs' object within an InventoryItem (for Set Komputer)
export const SpecsSchema = z.object({
  cpu: z.array(ComponentSchema).optional(),
  motherboard: z.array(ComponentSchema).optional(),
  ram: z.array(ComponentSchema).optional(),
  gpu: z.array(ComponentSchema).optional(),
  storage: z.array(ComponentSchema).optional(),
  psu: z.array(ComponentSchema).optional(),
  case: z.array(ComponentSchema).optional(),
}).optional(); // The entire specs object is optional if not a "Set Komputer"

// Main schema for an InventoryItem
export const InventoryItemSchema = z.object({
  id: z.string().cuid('ID item tidak valid.').optional(), // ID is optional for adding, required for updating
  name: z.string().min(3, "Nama item harus minimal 3 karakter."),
  categoryId: z.string().cuid("ID kategori tidak valid.").min(1, "Kategori item tidak boleh kosong."),
  qty: z.number().int().min(0, "Kuantitas item harus angka positif."),
  statusId: z.string().cuid("ID status tidak valid.").min(1, "Status item tidak boleh kosong."),
  locationId: z.string().cuid("ID lokasi tidak valid.").min(1, "Lokasi item tidak boleh kosong."),
  description: z.string().optional(), // Description can be empty

  // Specs are only required/validated if the category is "Set Komputer"
  specs: SpecsSchema, // This will be handled with .superRefine for conditional validation
}).superRefine(async (data, ctx) => {
  if (!data.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Kategori item tidak boleh kosong.",
      path: ["categoryId"],
    });
    return;
  }

  // Fetch category name to check if it's "Set Komputer"
  // This requires `prisma` to be available here, which is usually not ideal in a pure validation file.
  // For simplicity and to avoid circular deps with Prisma, we'll assume the category name will be checked in the action.
  // However, for Zod's superRefine, we need a way to know the category name.
  // A better approach might be to pass the category name or the category object to the validation.
  // For now, let's assume `data.categoryName` will be available or infer it from categoryId in the action.

  // To make superRefine work correctly with category name without fetching in validation:
  // We need to modify InventoryForm.tsx to pass categoryName to the validation data
  // Or fetch it in the action before calling safeParse.
  // Given the current structure, the check for "Set Komputer" might need to move into the action.

  // For a temporary workaround (until we modify InventoryForm/action to pass categoryName):
  // We'll skip the 'Set Komputer' specific validation in superRefine directly.
  // It will be handled in the action after fetching the category name.
});

// Schema for simple string options (Category, Status, Location)
export const OptionSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong."),
});
