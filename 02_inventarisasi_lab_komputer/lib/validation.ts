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
  category: z.string().min(1, "Kategori item tidak boleh kosong."),
  qty: z.number().int().min(0, "Kuantitas item harus angka positif."),
  status: z.string().min(1, "Status item tidak boleh kosong."),
  location: z.string().min(1, "Lokasi item tidak boleh kosong."),
  description: z.string().optional(), // Description can be empty

  // Specs are only required/validated if the category is "Set Komputer"
  specs: SpecsSchema, // This will be handled with .superRefine for conditional validation
}).superRefine((data, ctx) => {
  if (data.category === "Set Komputer") {
    if (!data.specs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Spesifikasi komponen harus diisi untuk 'Set Komputer'.",
        path: ["specs"],
      });
    } else {
      // Further check if at least one spec category has items, or if all are empty
      const hasAnySpecs = Object.values(data.specs).some(arr => arr && arr.length > 0);
      if (!hasAnySpecs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Setidaknya satu jenis komponen harus ditambahkan untuk 'Set Komputer'.",
          path: ["specs"],
        });
      }
    }
  }
});

// Schema for simple string options (Category, Status, Location)
export const OptionSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong."),
});
