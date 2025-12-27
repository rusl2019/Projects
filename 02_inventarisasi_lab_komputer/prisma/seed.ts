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
  // Delete from the "many" side of the relation first
  await prisma.component.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  console.log('Old data deleted.');

  // 2. Read the JSON file
  const filePath = path.join(process.cwd(), 'data', 'inventory.json');
  const jsonData = await fs.readFile(filePath, 'utf-8');
  const inventoryItemsJson: InventoryItemJson[] = JSON.parse(jsonData);

  // 3. First Pass: Create all InventoryItem records without relations
  console.log('--- First Pass: Creating all InventoryItems ---');
  const createdItemsMap = new Map<string, { id: string }>();

  for (const item of inventoryItemsJson) {
    try {
      const createdItem = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          category: item.category,
          qty: item.qty,
          status: item.status,
          location: item.location,
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

  // 4. Second Pass: Create Component relations for "Set Komputer" items
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
