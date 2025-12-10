import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CartItem, POSScreen, Transaction, Cashier, InvoiceData } from "@/types/pos";
import { Product } from "@/types/inventory";
import POSHeader from "@/components/pos/POSHeader";
import CartItemList from "@/components/pos/CartItemList";
import ActionButtons from "@/components/pos/ActionButtons";
import NumericKeypad from "@/components/pos/NumericKeypad";
import TotalDisplay from "@/components/pos/TotalDisplay";
import InputDisplay from "@/components/pos/InputDisplay";
import PaymentScreen from "@/components/pos/PaymentScreen";
import CashPaymentScreen from "@/components/pos/CashPaymentScreen";
import CardPaymentScreen from "@/components/pos/CardPaymentScreen";
import CompletionScreen from "@/components/pos/CompletionScreen";
import InventoryScreen from "@/components/inventory/InventoryScreen";
import LoginScreen from "@/components/pos/LoginScreen";
import TransactionHistory from "@/components/pos/TransactionHistory";
import DrawerCodeDialog from "@/components/pos/DrawerCodeDialog";
import SalesReports from "@/components/pos/SalesReports";
import ManagerCodeDialog from "@/components/pos/ManagerCodeDialog";
import ProductSearchDialog from "@/components/pos/ProductSearchDialog";
import QuantityInputDialog from "@/components/pos/QuantityInputDialog";
import DiscountInputDialog from "@/components/pos/DiscountInputDialog";
import WeighingDialog from "@/components/pos/WeighingDialog";
import BakeryDialog from "@/components/pos/BakeryDialog";
import ReturnDialog from "@/components/pos/ReturnDialog";
import InvoiceDialog from "@/components/pos/InvoiceDialog";
import ShiftEndDialog from "@/components/pos/ShiftEndDialog";
import ReceiptsDialog from "@/components/pos/ReceiptsDialog";
import PriceCheckDialog from "@/components/pos/PriceCheckDialog";
import WeightCheckDialog from "@/components/pos/WeightCheckDialog";
import GiftVoucherDialog from "@/components/pos/GiftVoucherDialog";
import { ShoppingCart } from "lucide-react";

// Cashiers data with roles and individual drawer codes
const cashiers: Cashier[] = [
  { id: '00722', name: 'Dženan Kedić', password: '00722', role: 'admin', drawerCode: '5445' },
  { id: '11091', name: 'Najla Ramić', password: '11091', role: 'cashier', drawerCode: '7229' },
  { id: '22413', name: 'Melisa Kedić', password: '22413', role: 'cashier', drawerCode: '2140' },
  { id: '30431', name: 'Adela Ramić', password: '30431', role: 'cashier', drawerCode: '8404' },
];

// Initial products with stock data and EAN codes
const initialProducts: Product[] = [
  { ean: '3838980514548', name: 'RAZKUŽILO ZA ROKE IN POVRŠINE (50ML)', price: 2.95, stock: 1, minStock: 1, category: 'Higiena' },
  { ean: '4002448047766', name: 'RAZKUŽILO (50ML)', price: 2.79, stock: 1, minStock: 1, category: 'Higiena' },
  { ean: '5999005966662', name: 'DUREX KONDOMI 4 KOS', price: 3.69, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '5011831092220', name: 'SKYN KONDOMI 10 KOS', price: 7.95, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '5052197044973', name: 'DUREX KONDOMI 18 KOS', price: 18.79, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '3830000629782', name: 'RADENSKA NATURAL 1L', price: 0.60, stock: 1, minStock: 1, category: 'Pijače' },
  { ean: '3830000624589', name: 'RADENSKA NATURAL 0,5L', price: 0.49, stock: 1, minStock: 1, category: 'Pijače' },
  { ean: '4015100810745', name: 'SCHWARTZKOPF TAFT VOL. 3 (75ML)', price: 6.59, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '9005800366432', name: 'NIVEA MEN DEO ROLL (50ML)', price: 3.90, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '3859893870491', name: 'AIRCASH KARTICA', price: 5.00, stock: 2, minStock: 1, category: 'Kartice' },
  { ean: '50173167', name: 'AIRWAVES MENTOL (14G)', price: 0.79, stock: 2, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '42101925', name: 'AIRWAVES BLACK MINT (14G)', price: 0.79, stock: 2, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '42189633', name: 'AIRWAVES EXTREME (14G)', price: 0.90, stock: 2, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '42070047', name: 'AIRWAVES BLACKCURRANT (14G)', price: 0.49, stock: 4, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '50173617', name: 'ORBIT EUCALYPTUS (10X)', price: 0.85, stock: 1, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '50173822', name: 'ORBIT SPEARMINT FLAVOUR (10X)', price: 0.85, stock: 7, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '4005401874836', name: 'LEPILO V STIKU (20G)', price: 1.50, stock: 1, minStock: 1, category: 'Pisarniški material' },
  { ean: '4902505355790', name: 'FLOMASTRI ZA PO TABLI (ZELENI)', price: 1.94, stock: 1, minStock: 1, category: 'Pisarniški material' },
  { ean: '4902505355783', name: 'FLOMASTRI ZA PO TABLI (MODRI)', price: 1.94, stock: 1, minStock: 1, category: 'Pisarniški material' },
  { ean: '4902505355769', name: 'FLOMASTRI ZA PO TABLI (ČRNI)', price: 1.94, stock: 1, minStock: 1, category: 'Pisarniški material' },
  { ean: '8720181047725', name: 'AXE DEO SPREJ BLACK (250ML)', price: 6.85, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '8720181131905', name: 'AXE DEO SPREJ RECHARGE (150ML)', price: 4.65, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '8720181415678', name: 'AXE DEO V STIKU (50ML)', price: 2.95, stock: 1, minStock: 1, category: 'Osebna nega' },
  { ean: '4009900550215', name: 'ORBIT ŽVEČILNI GUMIJI PEPERMINT (46X)', price: 3.25, stock: 1, minStock: 1, category: 'Žvečilni gumi' },
  { ean: '8006540319574', name: 'OLD SPICE CAPITAN DEO V STIKU XXLLLL (85ML)', price: 5.89, stock: 1, minStock: 1, category: 'Osebna nega' },
];

// PLU products for weighing (9000+) and bakery (1000+)
const pluProducts: Record<string, { name: string; pricePerKg?: number; pricePerUnit?: number }> = {
  // Bakery products (1000+)
  '1001': { name: 'Kruh beli', pricePerUnit: 1.89 },
  '1002': { name: 'Kruh črni', pricePerUnit: 2.19 },
  '1003': { name: 'Kruh z semeni', pricePerUnit: 2.49 },
  '1004': { name: 'Kruh koruzni', pricePerUnit: 2.29 },
  '1005': { name: 'Domače bele žemlje', pricePerUnit: 0.39 },
  '1006': { name: 'Domače črne žemlje', pricePerUnit: 0.45 },
  '1007': { name: 'Domače semeni žemlje', pricePerUnit: 0.49 },
  '1008': { name: 'Domače kajzarice', pricePerUnit: 0.35 },
  '1009': { name: 'Domače lepinje', pricePerUnit: 0.59 },
  '1010': { name: 'Domače male lepinje', pricePerUnit: 0.45 },
};

// Convert products to simple lookup for POS by EAN
const getProductsLookup = (products: Product[]): Record<string, { name: string; price: number }> => {
  return products.reduce((acc, p) => {
    acc[p.ean] = { name: p.name, price: p.price };
    return acc;
  }, {} as Record<string, { name: string; price: number }>);
};

const Index = () => {
  const [screen, setScreen] = useState<POSScreen>('login');
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceData | undefined>();
  
  // Dialog states
  const [showManagerCodeDialog, setShowManagerCodeDialog] = useState(false);
  const [showProductSearchDialog, setShowProductSearchDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showWeighingDialog, setShowWeighingDialog] = useState(false);
  const [showBakeryDialog, setShowBakeryDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showShiftEndDialog, setShowShiftEndDialog] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [showPriceCheckDialog, setShowPriceCheckDialog] = useState(false);
  const [showWeightCheckDialog, setShowWeightCheckDialog] = useState(false);
  const [showGiftVoucherDialog, setShowGiftVoucherDialog] = useState(false);
  const [pendingStornoIndex, setPendingStornoIndex] = useState<number | null>(null);

  const productsLookup = getProductsLookup(products);
  const isAdmin = currentCashier?.role === 'admin';

  const subtotal = cartItems.reduce((sum, item) => {
    if (item.isReturn) return sum - item.price * item.quantity;
    return sum + item.price * item.quantity;
  }, 0);
  
  const totalDiscount = cartItems.reduce((sum, item) => {
    if (item.discount && item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const total = subtotal;

  const handleLogin = (cashier: Cashier) => {
    setCurrentCashier(cashier);
    setScreen('main');
  };

  const handleLogout = () => {
    setCurrentCashier(null);
    setCartItems([]);
    setSelectedItemIndex(null);
    setInputValue("");
    setScreen('login');
    toast.success('Uspešna odjava');
  };

  const handleKeyPress = (key: string) => {
    if (key.includes('x')) {
      const qty = parseInt(key.replace('x', ''));
      if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
        const newItems = [...cartItems];
        newItems[selectedItemIndex].quantity = qty;
        setCartItems(newItems);
        toast.success(`Količina spremenjena na ${qty}`);
      }
      return;
    }
    setInputValue(prev => prev + key);
  };

  const handleDelete = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (!inputValue) return;

    const product = productsLookup[inputValue];
    if (product) {
      const existingIndex = cartItems.findIndex(item => item.ean === inputValue && !item.isReturn);
      
      if (existingIndex >= 0) {
        const newItems = [...cartItems];
        newItems[existingIndex].quantity += 1;
        setCartItems(newItems);
        setSelectedItemIndex(existingIndex);
      } else {
        const newItem: CartItem = {
          id: Date.now().toString(),
          ean: inputValue,
          name: product.name,
          price: product.price,
          quantity: 1,
        };
        setCartItems(prev => [...prev, newItem]);
        setSelectedItemIndex(cartItems.length);
      }
      toast.success(`${product.name} dodan`);
    } else {
      toast.error('Artikel ni najden');
    }
    setInputValue("");
  };

  const handleDiscount = () => {
    if (cartItems.length === 0) {
      toast.warning('Dodajte artikle pred popustom');
      return;
    }
    setShowDiscountDialog(true);
  };

  const handleApplyDiscount = (discount: number, isPercentage: boolean) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
      // Apply to selected item
      const newItems = [...cartItems];
      const item = newItems[selectedItemIndex];
      item.originalPrice = item.originalPrice || item.price;
      
      if (isPercentage) {
        item.discount = discount;
        item.price = item.originalPrice * (1 - discount / 100);
      } else {
        item.price = Math.max(0, item.originalPrice - discount);
        item.discount = ((item.originalPrice - item.price) / item.originalPrice) * 100;
      }
      setCartItems(newItems);
      toast.success(`Popust ${isPercentage ? discount + '%' : discount.toFixed(2) + '€'} dodan`);
    } else {
      // Apply to all items
      const newItems = cartItems.map(item => {
        const originalPrice = item.originalPrice || item.price;
        if (isPercentage) {
          return {
            ...item,
            originalPrice,
            discount,
            price: originalPrice * (1 - discount / 100)
          };
        } else {
          const newPrice = Math.max(0, originalPrice - discount);
          return {
            ...item,
            originalPrice,
            discount: ((originalPrice - newPrice) / originalPrice) * 100,
            price: newPrice
          };
        }
      });
      setCartItems(newItems);
      toast.success(`Popust ${isPercentage ? discount + '%' : discount.toFixed(2) + '€'} dodan na vse artikle`);
    }
  };

  const handleStorno = () => {
    if (cartItems.length === 0) {
      toast.warning('Ni artiklov za storno');
      return;
    }
    // Set pending storno and request manager code
    setPendingStornoIndex(cartItems.length - 1);
    setShowManagerCodeDialog(true);
  };

  const handleStornoConfirmed = () => {
    if (pendingStornoIndex !== null && pendingStornoIndex >= 0) {
      const itemName = cartItems[pendingStornoIndex]?.name;
      const newItems = cartItems.filter((_, i) => i !== pendingStornoIndex);
      setCartItems(newItems);
      setSelectedItemIndex(null);
      toast.success(`${itemName} storniran`);
    }
    setPendingStornoIndex(null);
  };

  const handleVoidTransaction = () => {
    setCartItems([]);
    setSelectedItemIndex(null);
    toast.success('Račun storniran');
  };

  const handleReturn = () => {
    setShowReturnDialog(true);
  };

  const handleReturnConfirm = (ean: string, quantity: number, price: number) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      ean: ean,
      name: `Vračilo (${ean})`,
      price: price,
      quantity: quantity,
      isReturn: true,
    };
    setCartItems(prev => [...prev, newItem]);
    toast.success(`Vračilo dodano: -${(price * quantity).toFixed(2)} €`);
  };

  const handlePriceCheck = () => {
    setShowPriceCheckDialog(true);
  };

  const handleWeightCheck = () => {
    setShowWeightCheckDialog(true);
  };

  const handleGiftVoucher = () => {
    setShowGiftVoucherDialog(true);
  };

  const handleGiftVoucherConfirm = (code: string, amount: number, type: 'use' | 'sell') => {
    if (type === 'use') {
      // In real system, would validate code against database
      toast.success(`Darilni bon ${code} uporabljen`);
    } else {
      // Add gift voucher as item to cart
      const newItem: CartItem = {
        id: Date.now().toString(),
        ean: `GIFT-${code}`,
        name: `Darilni bon (${code})`,
        price: amount,
        quantity: 1,
      };
      setCartItems(prev => [...prev, newItem]);
      toast.success(`Darilni bon ${amount} € dodan`);
    }
  };

  const handleReceipts = () => {
    setShowReceiptsDialog(true);
  };

  const handlePrintReceipt = (transaction: Transaction) => {
    toast.success(`Račun #${transaction.id} se tiska...`);
  };

  const handlePrintInvoice = (transaction: Transaction) => {
    toast.success(`Faktura #${transaction.id} se tiska...`);
  };

  const handleCopyToNew = (transaction: Transaction) => {
    // Copy items from transaction to cart
    setCartItems(transaction.items.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    })));
    toast.success('Artikli kopirani v nov račun');
  };

  const handleVoidReceipt = (transaction: Transaction) => {
    // Mark transaction as voided
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    toast.success(`Račun #${transaction.id} storniran`);
  };

  const handleInventory = () => {
    if (!isAdmin) {
      toast.error('Samo administrator ima dostop do zalog');
      return;
    }
    setScreen('inventory');
  };

  const handleOpenDrawer = () => {
    setShowDrawerDialog(true);
  };

  const handleReports = () => {
    if (!isAdmin) {
      toast.error('Samo administrator ima dostop do poročil');
      return;
    }
    setScreen('reports');
  };

  const handleProductSearch = () => {
    setShowProductSearchDialog(true);
  };

  const handleSelectProduct = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.ean === product.ean && !item.isReturn);
    
    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += 1;
      setCartItems(newItems);
      setSelectedItemIndex(existingIndex);
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        ean: product.ean,
        name: product.name,
        price: product.price,
        quantity: 1,
      };
      setCartItems(prev => [...prev, newItem]);
      setSelectedItemIndex(cartItems.length);
    }
    toast.success(`${product.name} dodan`);
  };

  const handleAddProduct = (newProduct: Omit<Product, 'stock' | 'minStock'>) => {
    const fullProduct: Product = {
      ...newProduct,
      stock: 0,
      minStock: 0
    };
    setProducts(prev => [...prev, fullProduct]);
    toast.success(`Artikel ${newProduct.name} dodan v bazo`);
    
    // Also add to cart
    handleSelectProduct(fullProduct);
  };

  const handleQuantity = () => {
    if (selectedItemIndex === null) {
      toast.warning('Izberite artikel');
      return;
    }
    setShowQuantityDialog(true);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
      const newItems = [...cartItems];
      newItems[selectedItemIndex].quantity = quantity;
      setCartItems(newItems);
      toast.success(`Količina spremenjena na ${quantity}`);
    }
  };

  const handleWeighing = () => {
    setShowWeighingDialog(true);
  };

  const handleWeighingConfirm = (pluCode: string, weight: number) => {
    const pluProduct = pluProducts[pluCode];
    if (pluProduct && pluProduct.pricePerKg) {
      const totalPrice = pluProduct.pricePerKg * weight;
      const newItem: CartItem = {
        id: Date.now().toString(),
        ean: `PLU-${pluCode}`,
        plu: pluCode,
        name: `${pluProduct.name} (${weight.toFixed(3)} kg)`,
        price: totalPrice,
        quantity: 1,
        isWeighed: true,
        weight: weight,
      };
      setCartItems(prev => [...prev, newItem]);
      setSelectedItemIndex(cartItems.length);
      toast.success(`${pluProduct.name} - ${weight.toFixed(3)} kg dodan`);
    } else {
      toast.error(`PLU koda ${pluCode} ni najdena`);
    }
  };

  const handleBakery = () => {
    setShowBakeryDialog(true);
  };

  const handleBakeryConfirm = (pluCode: string, quantity: number) => {
    const pluProduct = pluProducts[pluCode];
    if (pluProduct && pluProduct.pricePerUnit) {
      const newItem: CartItem = {
        id: Date.now().toString(),
        ean: `PLU-${pluCode}`,
        plu: pluCode,
        name: pluProduct.name,
        price: pluProduct.pricePerUnit,
        quantity: quantity,
      };
      setCartItems(prev => [...prev, newItem]);
      setSelectedItemIndex(cartItems.length);
      toast.success(`${pluProduct.name} x${quantity} dodan`);
    } else {
      toast.error(`PLU koda ${pluCode} ni najdena`);
    }
  };

  const handleUpdateProduct = (ean: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.ean === ean ? { ...p, ...updates } : p
    ));
  };

  const handleShiftEnd = () => {
    setShowShiftEndDialog(true);
  };

  const handleEndShift = () => {
    toast.success('Izmena zaključena');
    handleLogout();
  };

  const handleEndDay = () => {
    toast.success('Blagajna zaključena za danes');
    handleLogout();
  };

  const handlePaymentMethod = (method: string) => {
    if (method === 'cash') {
      setScreen('cash');
    } else if (method === 'card') {
      setScreen('card');
    } else {
      toast.info(`${method} - funkcija v razvoju`);
    }
  };

  const handleCashComplete = (amountPaid: number) => {
    const transaction: Transaction = {
      id: Date.now().toString().slice(-6),
      items: cartItems,
      subtotal,
      discount: totalDiscount,
      total,
      paymentMethod: 'gotovina',
      amountPaid,
      change: amountPaid - total,
      timestamp: new Date(),
      cashierId: currentCashier?.id || '',
      cashierName: currentCashier?.name || '',
      invoiceData: pendingInvoiceData,
    };
    setLastTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setScreen('complete');
    setPendingInvoiceData(undefined);
    toast.success(pendingInvoiceData ? 'Faktura zaključena' : 'Račun zaključen');
  };

  const handleCardComplete = () => {
    const transaction: Transaction = {
      id: Date.now().toString().slice(-6),
      items: cartItems,
      subtotal,
      discount: totalDiscount,
      total,
      paymentMethod: 'kartica',
      amountPaid: total,
      change: 0,
      timestamp: new Date(),
      cashierId: currentCashier?.id || '',
      cashierName: currentCashier?.name || '',
      invoiceData: pendingInvoiceData,
    };
    setLastTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setScreen('complete');
    setPendingInvoiceData(undefined);
    toast.success(pendingInvoiceData ? 'Faktura zaključena' : 'Račun zaključen');
  };

  const handleNewTransaction = () => {
    setCartItems([]);
    setSelectedItemIndex(null);
    setInputValue("");
    setLastTransaction(null);
    setPendingInvoiceData(undefined);
    setScreen('main');
  };

  const handlePrintCopy = () => {
    toast.success('Kopija računa se tiska...');
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      toast.warning('Dodajte artikle pred plačilom');
      return;
    }
    setScreen('payment');
  };

  const handleVatReceipt = () => {
    if (cartItems.length === 0) {
      toast.warning('Dodajte artikle pred nadaljevanjem');
      return;
    }
    setShowInvoiceDialog(true);
  };

  const handleInvoiceConfirm = (data: InvoiceData) => {
    setPendingInvoiceData(data);
    setScreen('payment');
    toast.success('Faktura pripravljena');
  };

  const handleInvoiceSkip = () => {
    setPendingInvoiceData(undefined);
    setScreen('payment');
  };

  // Login screen
  if (screen === 'login') {
    return <LoginScreen cashiers={cashiers} onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <POSHeader 
        cashier={currentCashier} 
        onLogout={handleLogout} 
        onShiftEnd={handleShiftEnd}
      />
      
      <main className="flex-1 p-4 overflow-hidden">
        {screen === 'main' && (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* Left panel - Cart items */}
            <div className="col-span-5 pos-panel overflow-hidden flex flex-col">
              <CartItemList
                items={cartItems}
                selectedIndex={selectedItemIndex}
                onSelectItem={setSelectedItemIndex}
              />
            </div>

            {/* Center panel - Action buttons */}
            <div className="col-span-4 flex flex-col gap-4">
              <TotalDisplay
                subtotal={subtotal}
                discount={totalDiscount}
                total={total}
                itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              />
              
              <div className="pos-panel p-3 flex-1 overflow-y-auto">
                <ActionButtons
                  onDiscount={handleDiscount}
                  onVoidTransaction={handleVoidTransaction}
                  onReturn={handleReturn}
                  onPriceCheck={handlePriceCheck}
                  onWeightCheck={handleWeightCheck}
                  onGiftVoucher={handleGiftVoucher}
                  onReceipts={handleReceipts}
                  onInventory={handleInventory}
                  onOpenDrawer={handleOpenDrawer}
                  onReports={handleReports}
                  onProductSearch={handleProductSearch}
                  onWeighing={handleWeighing}
                  onBakery={handleBakery}
                  onQuantity={handleQuantity}
                  onStorno={handleStorno}
                  hasItems={cartItems.length > 0}
                  hasSelectedItem={selectedItemIndex !== null}
                  isAdmin={isAdmin}
                />
              </div>
            </div>

            {/* Right panel - Keypad */}
            <div className="col-span-3 flex flex-col gap-4">
              <InputDisplay value={inputValue} label="EAN koda" />
              
              <div className="pos-panel p-4 flex-1">
                <NumericKeypad
                  onKeyPress={handleKeyPress}
                  onDelete={handleDelete}
                  onConfirm={handleConfirm}
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={cartItems.length === 0}
                className="pos-btn-confirm h-20 flex items-center justify-center gap-3 text-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-7 h-7" />
                <span>Plačilo</span>
              </button>
            </div>
          </div>
        )}

        {screen === 'payment' && (
          <PaymentScreen
            total={total}
            onPaymentMethod={handlePaymentMethod}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'cash' && (
          <CashPaymentScreen
            total={total}
            onComplete={handleCashComplete}
            onBack={() => setScreen('payment')}
          />
        )}

        {screen === 'card' && (
          <CardPaymentScreen
            total={total}
            onComplete={handleCardComplete}
            onBack={() => setScreen('payment')}
          />
        )}

        {screen === 'complete' && lastTransaction && (
          <CompletionScreen
            transaction={lastTransaction}
            onNewTransaction={handleNewTransaction}
            onPrintCopy={handlePrintCopy}
          />
        )}

        {screen === 'inventory' && (
          <InventoryScreen
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'transactions' && (
          <TransactionHistory
            transactions={transactions}
            onBack={() => setScreen('main')}
          />
        )}

        {screen === 'reports' && (
          <SalesReports
            transactions={transactions}
            cashiers={cashiers}
            onBack={() => setScreen('main')}
          />
        )}
      </main>

      {/* Dialogs */}
      {showDrawerDialog && currentCashier && (
        <DrawerCodeDialog
          drawerCode={currentCashier.drawerCode}
          onSuccess={() => {}}
          onClose={() => setShowDrawerDialog(false)}
        />
      )}

      {showManagerCodeDialog && (
        <ManagerCodeDialog
          title="Koda poslovodje za storno"
          onSuccess={handleStornoConfirmed}
          onClose={() => {
            setShowManagerCodeDialog(false);
            setPendingStornoIndex(null);
          }}
        />
      )}

      {showProductSearchDialog && (
        <ProductSearchDialog
          products={products}
          isAdmin={isAdmin}
          onSelectProduct={handleSelectProduct}
          onAddProduct={isAdmin ? handleAddProduct : undefined}
          onClose={() => setShowProductSearchDialog(false)}
        />
      )}

      {showQuantityDialog && selectedItemIndex !== null && cartItems[selectedItemIndex] && (
        <QuantityInputDialog
          currentQuantity={cartItems[selectedItemIndex].quantity}
          onConfirm={handleQuantityConfirm}
          onClose={() => setShowQuantityDialog(false)}
        />
      )}

      {showDiscountDialog && (
        <DiscountInputDialog
          onConfirm={handleApplyDiscount}
          onClose={() => setShowDiscountDialog(false)}
        />
      )}

      {showWeighingDialog && (
        <WeighingDialog
          onConfirm={handleWeighingConfirm}
          onClose={() => setShowWeighingDialog(false)}
        />
      )}

      {showBakeryDialog && (
        <BakeryDialog
          onConfirm={handleBakeryConfirm}
          onClose={() => setShowBakeryDialog(false)}
        />
      )}

      {showReturnDialog && (
        <ReturnDialog
          onConfirm={handleReturnConfirm}
          onClose={() => setShowReturnDialog(false)}
        />
      )}

      {showInvoiceDialog && (
        <InvoiceDialog
          onConfirm={handleInvoiceConfirm}
          onSkip={handleInvoiceSkip}
          onClose={() => setShowInvoiceDialog(false)}
        />
      )}

      {showShiftEndDialog && currentCashier && (
        <ShiftEndDialog
          cashier={currentCashier}
          transactions={transactions}
          onEndShift={handleEndShift}
          onEndDay={handleEndDay}
          onOpenDrawer={() => toast.success('Predal odprt')}
          onClose={() => setShowShiftEndDialog(false)}
        />
      )}

      {showReceiptsDialog && (
        <ReceiptsDialog
          transactions={transactions}
          onPrintReceipt={handlePrintReceipt}
          onPrintInvoice={handlePrintInvoice}
          onCopyToNew={handleCopyToNew}
          onVoidReceipt={handleVoidReceipt}
          onClose={() => setShowReceiptsDialog(false)}
        />
      )}

      {showPriceCheckDialog && (
        <PriceCheckDialog
          products={products}
          pluProducts={pluProducts}
          onClose={() => setShowPriceCheckDialog(false)}
        />
      )}

      {showWeightCheckDialog && (
        <WeightCheckDialog
          onClose={() => setShowWeightCheckDialog(false)}
        />
      )}

      {showGiftVoucherDialog && (
        <GiftVoucherDialog
          onConfirm={handleGiftVoucherConfirm}
          onClose={() => setShowGiftVoucherDialog(false)}
        />
      )}
    </div>
  );
};

export default Index;
