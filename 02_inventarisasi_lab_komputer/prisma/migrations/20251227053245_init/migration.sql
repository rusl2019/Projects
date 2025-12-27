/*
  Warnings:

  - You are about to drop the `ComponentSpec` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `InventoryItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ComponentSpec";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qty" INTEGER NOT NULL,
    "setId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    CONSTRAINT "Component_setId_fkey" FOREIGN KEY ("setId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Component_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Component_setId_componentId_key" ON "Component"("setId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_name_key" ON "InventoryItem"("name");
