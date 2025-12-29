// lib/inventory-data.ts
// Data-related interfaces are kept as they are used across the application
export interface ComponentSpec {
  id?: string; // The ID of the referenced InventoryItem
  name: string;
  qty: number;
}

export interface Specs {
  cpu: ComponentSpec[];
  motherboard: ComponentSpec[];
  ram: ComponentSpec[];
  gpu: ComponentSpec[];
  storage: ComponentSpec[];
  psu: ComponentSpec[];  // Power Supply Unit
  case: ComponentSpec[]; // PC Case
}

export interface InventoryItem {
  id: string; // Changed from number to string
  name: string;
  categoryId: string; // ID of the Category
  categoryName: string; // Name of the Category
  qty: number;
  statusId: string; // ID of the Status
  statusName: string; // Name of the Status
  locationId: string; // ID of the Location
  locationName: string; // Name of the Location
  description?: string; // New field for HTML description
  specs: Specs | null;
}
