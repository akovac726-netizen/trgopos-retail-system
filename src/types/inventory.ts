export interface Product {
  plu: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  barcode?: string;
  lastInventory?: Date;
}

export interface InventoryCount {
  plu: string;
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
