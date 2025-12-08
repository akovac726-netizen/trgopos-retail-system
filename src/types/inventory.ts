export interface Product {
  ean: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  lastInventory?: Date;
}

export interface InventoryCount {
  ean: string;
  expectedStock: number;
  countedStock: number;
  difference: number;
  countedAt: Date;
}

export interface InventorySession {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  counts: InventoryCount[];
  status: 'in-progress' | 'completed';
}
