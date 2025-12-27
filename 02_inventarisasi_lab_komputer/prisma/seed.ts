import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from '../generated/prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Define types based on your JSON structure to ensure type safety
interface Specs {
  cpu: { name: string; qty: number }[];
  ram: { name: string; qty: number }[];
  gpu: { name: string; qty: number }[];
  storage: { name: string; qty: number }[];
  psu: { name: string; qty: number }[];
  case: { name: string; qty: number }[];
}

interface InventoryItemJson {
  id: string;
  name: string;
  category: string;
  qty: number;
  status: string;
  location: string;
  description: string;
  specs: Specs | null;
}

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Clean up existing data to make seeding idempotent
  console.log('Deleting old data...');
  await prisma.componentSpec.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  console.log('Old data deleted.');

  // 2. Read the JSON file
  const filePath = path.join(process.cwd(), 'data', 'inventory.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const inventoryItems: InventoryItemJson[] = JSON.parse(jsonData);

  // 3. Iterate and create records
  console.log(`Found ${inventoryItems.length} items to seed.`);
  for (const item of inventoryItems) {
    // We don't need the old ID from the JSON file
    const { id, specs, ...itemData } = item;

    const componentsToCreate: { name: string; qty: number; type: string }[] = [];
    if (specs) {
      for (const key in specs) {
        const specKey = key as keyof Specs;
        const components = specs[specKey];
        if (Array.isArray(components)) {
          components.forEach((comp) => {
            if (comp.name && comp.qty > 0) { // Ensure component has data
              componentsToCreate.push({ ...comp, type: specKey });
            }
          });
        }
      }
    }

    await prisma.inventoryItem.create({
      data: {
        ...itemData,
        description: item.description || '', // Ensure description is not null
        components: {
          create: componentsToCreate,
        },
      },
    });
    console.log(`Created item: ${item.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
