-- Supports the default available/sold page windows without sorting the inventory.
CREATE INDEX "Car_sold_createdAt_id_idx" ON "Car"("sold", "createdAt" DESC, "id");
