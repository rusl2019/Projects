// lib/inventory-data.ts
// Data-related interfaces are kept as they are used across the application
export interface ComponentSpec {
  id?: string; // The ID of the referenced InventoryItem
  name: string;
  qty: number;
}

export interface Specs {
  cpu: ComponentSpec[];
  ram: ComponentSpec[];
  gpu: ComponentSpec[];
  storage: ComponentSpec[];
  psu: ComponentSpec[];  // Power Supply Unit
  case: ComponentSpec[]; // PC Case
}

export interface InventoryItem {
  id: string; // Changed from number to string
  name: string;
  category: string;
  qty: number;
  status: string;
  location: string;
  description: string; // New field for HTML description
  specs: Specs | null;
}
