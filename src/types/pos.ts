export interface CartItem {
  id: string;
  plu: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  originalPrice?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export type POSScreen = 'login' | 'main' | 'payment' | 'cash' | 'card' | 'complete' | 'inventory' | 'transactions';

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  timestamp: Date;
  cashierId: string;
  cashierName: string;
}

export interface Cashier {
  id: string;
  name: string;
  password: string;
}
