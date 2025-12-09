export interface CartItem {
  id: string;
  ean: string;
  plu?: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  originalPrice?: number;
  isReturn?: boolean;
  isWeighed?: boolean;
  weight?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export type POSScreen = 'login' | 'main' | 'payment' | 'cash' | 'card' | 'complete' | 'inventory' | 'transactions' | 'reports';

export type CashierRole = 'admin' | 'cashier';

export interface Cashier {
  id: string;
  name: string;
  password: string;
  role: CashierRole;
  drawerCode: string;
}

export interface InvoiceData {
  companyName: string;
  taxNumber: string;
  address: string;
  city: string;
  postalCode: string;
}

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
  invoiceData?: InvoiceData;
}
