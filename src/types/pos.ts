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

export type POSScreen = 'main' | 'payment' | 'cash' | 'card' | 'complete';

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
}
