import { prisma } from '@/lib/prisma';
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
  id: string; // Old ID from JSON, we won't use it
  name: string;
  category: string;
  qty: number;
  status: string;
  location: string;
  description: string;
  specs: Specs | null;
}

async function main() {
  console.log('Start seeding...');

  // 1. Clean up existing data to make seeding idempotent
  console.log('Deleting old data...');
  await prisma.component.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.status.deleteMany({});
  await prisma.location.deleteMany({});
  console.log('Old data deleted.');

  // 2. Seed Master Data (Categories, Statuses, Locations)
  console.log('\n--- Seeding Master Data ---');

  // Categories
  const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');
  const categoriesJson: string[] = JSON.parse(await fs.readFile(categoriesFilePath, 'utf-8'));
  for (const catName of categoriesJson) {
    await prisma.category.create({ data: { name: catName } });
    console.log(`Seeded Category: ${catName}`);
  }

  // Statuses
  const statusesFilePath = path.join(process.cwd(), 'data', 'statuses.json');
  const statusesJson: string[] = JSON.parse(await fs.readFile(statusesFilePath, 'utf-8'));
  for (const statusName of statusesJson) {
    await prisma.status.create({ data: { name: statusName } });
    console.log(`Seeded Status: ${statusName}`);
  }

  // Locations
  const locationsFilePath = path.join(process.cwd(), 'data', 'locations.json');
  const locationsJson: string[] = JSON.parse(await fs.readFile(locationsFilePath, 'utf-8'));
  for (const locName of locationsJson) {
    await prisma.location.create({ data: { name: locName } });
    console.log(`Seeded Location: ${locName}`);
  }
  console.log('Master data seeding finished.');


  // 3. First Pass (Existing Logic): Create all InventoryItem records without relations
  console.log('\n--- First Pass: Creating all InventoryItems ---');
  const filePath = path.join(process.cwd(), 'data', 'inventory.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const inventoryItemsJson: InventoryItemJson[] = JSON.parse(jsonData);

  const createdItemsMap = new Map<string, { id: string }>();

  for (const item of inventoryItemsJson) {
    try {
      const createdItem = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          category: item.category, // Storing name for now, will be replaced by relation later
          qty: item.qty,
          status: item.status,     // Storing name for now
          location: item.location, // Storing name for now
          description: item.description || '',
        },
      });
      createdItemsMap.set(item.name, { id: createdItem.id });
      console.log(`Created item: ${item.name} (ID: ${createdItem.id})`);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
        console.warn(`WARN: Item with name "${item.name}" already exists. Skipping.`);
      } else {
        throw error;
      }
    }
  }

  // 4. Second Pass (Existing Logic): Create Component relations for "Set Komputer" items
  console.log('\n--- Second Pass: Creating Component relations for Sets ---');
  for (const item of inventoryItemsJson) {
    if (item.category === 'Set Komputer' && item.specs) {
      const computerSet = createdItemsMap.get(item.name);
      if (!computerSet) {
        console.warn(`WARN: Computer Set "${item.name}" was not found in created items. Skipping specs.`);
        continue;
      }

      console.log(`Processing specs for: ${item.name}`);
      const componentsToCreate: { qty: number; setId: string; componentId: string }[] = [];

      for (const key in item.specs) {
        const specKey = key as keyof Specs;
        const components = item.specs[specKey];

        if (Array.isArray(components)) {
          for (const comp of components) {
            const componentItem = createdItemsMap.get(comp.name);
            if (componentItem) {
              componentsToCreate.push({
                qty: comp.qty,
                setId: computerSet.id,
                componentId: componentItem.id,
              });
            } else {
              console.warn(`WARN: Component item "${comp.name}" not found for set "${item.name}". Skipping.`);
            }
          }
        }
      }
      
      if(componentsToCreate.length > 0) {
        await prisma.component.createMany({
          data: componentsToCreate
        })
        console.log(` -> Created ${componentsToCreate.length} component relations for ${item.name}.`);
      }
    }
  }

  console.log('\nSeeding finished.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
