// lib/inventory-data.ts
import fs from 'fs/promises';
import path from 'path';

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


// Functions for reading/writing auxiliary JSON files (categories, statuses, locations) are kept
async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    console.error(`Error reading ${path.basename(filePath)}:`, error);
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${path.basename(filePath)}:`, error);
    throw error;
  }
}

export async function readCategories(): Promise<string[]> {
  const filePath = path.join(process.cwd(), 'data', 'categories.json');
  return readJsonFile(filePath, []);
}

export async function writeCategories(data: string[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'categories.json');
  return writeJsonFile(filePath, data);
}

export async function readStatuses(): Promise<string[]> {
  const filePath = path.join(process.cwd(), 'data', 'statuses.json');
  return readJsonFile(filePath, []);
}

export async function writeStatuses(data: string[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'statuses.json');
  return writeJsonFile(filePath, data);
}

export async function readLocations(): Promise<string[]> {
  const filePath = path.join(process.cwd(), 'data', 'locations.json');
  return readJsonFile(filePath, []);
}

export async function writeLocations(data: string[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'locations.json');
  return writeJsonFile(filePath, data);
}
