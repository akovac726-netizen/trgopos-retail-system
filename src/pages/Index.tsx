import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CartItem, POSScreen, Transaction, Cashier, InvoiceData } from "@/types/pos";
import { Product } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
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
import LoginScreen from "@/components/pos/LoginScreen";
import DrawerCodeDialog from "@/components/pos/DrawerCodeDialog";
import ManagerCodeDialog from "@/components/pos/ManagerCodeDialog";
import ProductSearchDialog from "@/components/pos/ProductSearchDialog";
import QuantityInputDialog from "@/components/pos/QuantityInputDialog";
import DiscountInputDialog from "@/components/pos/DiscountInputDialog";
import ReturnDialog from "@/components/pos/ReturnDialog";
import ShiftEndDialog from "@/components/pos/ShiftEndDialog";
import ReceiptsDialog from "@/components/pos/ReceiptsDialog";
import PriceCheckDialog from "@/components/pos/PriceCheckDialog";
import BackOfficeDashboard from "@/components/backoffice/BackOfficeDashboard";
import PartnerInvoiceDialog from "@/components/pos/PartnerInvoiceDialog";
import PartialPaymentDialog from "@/components/pos/PartialPaymentDialog";
import { ShoppingCart } from "lucide-react";

// Cashiers data
const cashiers: Cashier[] = [
  { id: '7001', name: 'Dženan Kedić', password: '7001', role: 'admin', drawerCode: '2082' },
  { id: '7002', name: 'Eva Zakrajšek', password: '7002', role: 'cashier', drawerCode: '4268' },
];

const getProductsLookup = (products: Product[]): Record<string, { name: string; price: number }> => {
  return products.reduce((acc, p) => {
    acc[p.ean] = { name: p.name, price: p.price };
    return acc;
  }, {} as Record<string, { name: string; price: number }>);
};

const Index = () => {
  const [appMode, setAppMode] = useState<'login' | 'pos' | 'backoffice'>('login');
  const [screen, setScreen] = useState<POSScreen>('main');
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceData | undefined>();
  
  // Dialog states
  const [showManagerCodeDialog, setShowManagerCodeDialog] = useState(false);
  const [showProductSearchDialog, setShowProductSearchDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showShiftEndDialog, setShowShiftEndDialog] = useState(false);
  const [showReceiptsDialog, setShowReceiptsDialog] = useState(false);
  const [showPriceCheckDialog, setShowPriceCheckDialog] = useState(false);
  const [showPartnerInvoiceDialog, setShowPartnerInvoiceDialog] = useState(false);
  const [showPartialPaymentDialog, setShowPartialPaymentDialog] = useState(false);
  const [pendingStornoIndex, setPendingStornoIndex] = useState<number | null>(null);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (!error && data) {
        setProducts((data as any[]).map(p => ({
          ean: p.ean,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
          minStock: p.min_stock,
          category: p.category,
        })));
      }
    };
    fetchProducts();

    const channel = supabase
      .channel('pos-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
    setAppMode('pos');
    setScreen('main');
  };

  const handleBackOfficeLogin = () => {
    setAppMode('backoffice');
  };

  const handleLogout = () => {
    setCurrentCashier(null);
    setCartItems([]);
    setSelectedItemIndex(null);
    setInputValue("");
    setAppMode('login');
    setScreen('main');
    toast.success('Uspešna odjava');
  };

  const handleKeyPress = (key: string) => {
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
        setCartItems(prev => {
          setSelectedItemIndex(prev.length);
          return [...prev, newItem];
        });
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
      toast.success(`Popust ${discount}% dodan na artikel`);
    } else {
      const newItems = cartItems.map(item => {
        const originalPrice = item.originalPrice || item.price;
        if (isPercentage) {
          return { ...item, originalPrice, discount, price: originalPrice * (1 - discount / 100) };
        } else {
          const newPrice = Math.max(0, originalPrice - discount);
          return { ...item, originalPrice, discount: ((originalPrice - newPrice) / originalPrice) * 100, price: newPrice };
        }
      });
      setCartItems(newItems);
      toast.success(`Popust ${discount}% dodan na vse artikle`);
    }
  };

  // Storno: only selected item, requires manager code
  const handleStorno = () => {
    if (selectedItemIndex === null) { toast.warning('Izberite artikel za storno'); return; }
    setPendingStornoIndex(selectedItemIndex);
    setShowManagerCodeDialog(true);
  };

  const handleStornoConfirmed = () => {
    if (pendingStornoIndex !== null && pendingStornoIndex >= 0) {
      const itemName = cartItems[pendingStornoIndex]?.name;
      setCartItems(cartItems.filter((_, i) => i !== pendingStornoIndex));
      setSelectedItemIndex(null);
      toast.success(`${itemName} storniran`);
    }
    setPendingStornoIndex(null);
  };

  const handleReturnConfirm = (ean: string, quantity: number, price: number) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      ean, name: `Vračilo (${ean})`, price, quantity, isReturn: true,
    };
    setCartItems(prev => [...prev, newItem]);
    toast.success(`Vračilo dodano: -${(price * quantity).toFixed(2)} €`);
  };

  const handlePrintReceipt = (transaction: Transaction) => { toast.success(`Račun #${transaction.id} se tiska...`); };
  const handlePrintInvoice = (transaction: Transaction) => { toast.success(`Faktura #${transaction.id} se tiska...`); };
  const handleCopyToNew = (transaction: Transaction) => {
    setCartItems(transaction.items.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) })));
    setShowReceiptsDialog(false);
    toast.success('Artikli kopirani v nov račun');
  };
  const handleVoidReceipt = (transaction: Transaction) => {
    setTransactions(prev => prev.filter(t => t.id !== transaction.id));
    toast.success(`Račun #${transaction.id} storniran`);
  };

  const handleSelectProduct = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.ean === product.ean && !item.isReturn);
    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += 1;
      setCartItems(newItems);
      setSelectedItemIndex(existingIndex);
    } else {
      const newItem: CartItem = { id: Date.now().toString(), ean: product.ean, name: product.name, price: product.price, quantity: 1 };
      setCartItems(prev => {
        setSelectedItemIndex(prev.length);
        return [...prev, newItem];
      });
    }
    toast.success(`${product.name} dodan`);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
      const newItems = [...cartItems];
      newItems[selectedItemIndex] = { ...newItems[selectedItemIndex], quantity };
      setCartItems(newItems);
      toast.success(`Količina spremenjena na ${quantity}`);
    }
  };

  const handleUpdateProduct = (ean: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.ean === ean ? { ...p, ...updates } : p));
  };

  const handleShiftEnd = () => { setShowShiftEndDialog(true); };
  const handleEndShift = () => { toast.success('Izmena zaključena'); handleLogout(); };
  const handleEndDay = () => { toast.success('Blagajna zaključena za danes'); handleLogout(); };

  const handlePaymentMethod = (method: string) => {
    if (method === 'cash') setScreen('cash');
    else if (method === 'card') setScreen('card');
    else if (method === 'invoice') setShowPartnerInvoiceDialog(true);
    else if (method === 'partial') setShowPartialPaymentDialog(true);
    else toast.info(`${method} - funkcija v razvoju`);
  };

  const createTransaction = (paymentMethod: string, amountPaid: number, change: number = 0): Transaction => ({
    id: Date.now().toString().slice(-6),
    items: cartItems,
    subtotal,
    discount: totalDiscount,
    total,
    paymentMethod,
    amountPaid,
    change,
    timestamp: new Date(),
    cashierId: currentCashier?.id || '',
    cashierName: currentCashier?.name || '',
    invoiceData: pendingInvoiceData,
  });

  const handleCashComplete = (amountPaid: number) => {
    const transaction = createTransaction('gotovina', amountPaid, amountPaid - total);
    setLastTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setScreen('complete');
    setPendingInvoiceData(undefined);
    toast.success(pendingInvoiceData ? 'Faktura zaključena' : 'Račun zaključen');
  };

  const handleCardComplete = () => {
    const transaction = createTransaction('kartica', total, 0);
    setLastTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setScreen('complete');
    setPendingInvoiceData(undefined);
    toast.success(pendingInvoiceData ? 'Faktura zaključena' : 'Račun zaključen');
  };

  const handlePartialPaymentComplete = (cashAmount: number, cardAmount: number, invoiceData?: InvoiceData) => {
    const transaction = createTransaction('gotovina+kartica', total, 0);
    if (invoiceData) transaction.invoiceData = invoiceData;
    setLastTransaction(transaction);
    setTransactions(prev => [transaction, ...prev]);
    setShowPartialPaymentDialog(false);
    setScreen('complete');
    setPendingInvoiceData(undefined);
    toast.success(`Plačilo: ${cashAmount.toFixed(2)}€ gotovina + ${cardAmount.toFixed(2)}€ kartica`);
  };

  const handlePartnerInvoiceConfirm = (invoiceData: InvoiceData, paymentMethod: string) => {
    setPendingInvoiceData(invoiceData);
    setShowPartnerInvoiceDialog(false);
    if (paymentMethod === 'cash') setScreen('cash');
    else if (paymentMethod === 'card') setScreen('card');
  };

  const handleNewTransaction = () => {
    setCartItems([]);
    setSelectedItemIndex(null);
    setInputValue("");
    setLastTransaction(null);
    setPendingInvoiceData(undefined);
    setScreen('main');
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) { toast.warning('Dodajte artikle pred plačilom'); return; }
    setScreen('payment');
  };

  // Login screen
  if (appMode === 'login') {
    return <LoginScreen cashiers={cashiers} onLogin={handleLogin} onBackOfficeLogin={handleBackOfficeLogin} />;
  }

  // BackOffice
  if (appMode === 'backoffice') {
    return <BackOfficeDashboard onLogout={handleLogout} />;
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
            <div className="col-span-5 pos-panel overflow-hidden flex flex-col">
              <CartItemList items={cartItems} selectedIndex={selectedItemIndex} onSelectItem={setSelectedItemIndex} />
            </div>

            <div className="col-span-4 flex flex-col gap-4">
              <TotalDisplay subtotal={subtotal} discount={totalDiscount} total={total} itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />
              
              <div className="pos-panel p-3 flex-1 overflow-y-auto">
                <ActionButtons
                  onDiscount={handleDiscount}
                  onReturn={() => setShowReturnDialog(true)}
                  onPriceCheck={() => setShowPriceCheckDialog(true)}
                  onReceipts={() => setShowReceiptsDialog(true)}
                  onOpenDrawer={() => setShowDrawerDialog(true)}
                  onProductSearch={() => setShowProductSearchDialog(true)}
                  onQuantity={() => {
                    if (selectedItemIndex === null) { toast.warning('Izberite artikel'); return; }
                    setShowQuantityDialog(true);
                  }}
                  onStorno={handleStorno}
                  hasItems={cartItems.length > 0}
                  hasSelectedItem={selectedItemIndex !== null}
                  isAdmin={isAdmin}
                />
              </div>
            </div>

            <div className="col-span-3 flex flex-col gap-4">
              <InputDisplay value={inputValue} label="EAN koda" />
              <div className="pos-panel p-4 flex-1">
                <NumericKeypad onKeyPress={handleKeyPress} onDelete={handleDelete} onConfirm={handleConfirm} />
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
          <PaymentScreen total={total} onPaymentMethod={handlePaymentMethod} onBack={() => setScreen('main')} />
        )}
        {screen === 'cash' && (
          <CashPaymentScreen total={total} onComplete={handleCashComplete} onBack={() => setScreen('payment')} />
        )}
        {screen === 'card' && (
          <CardPaymentScreen total={total} onComplete={handleCardComplete} onBack={() => setScreen('payment')} />
        )}
        {screen === 'complete' && lastTransaction && (
          <CompletionScreen transaction={lastTransaction} onNewTransaction={handleNewTransaction} onPrintCopy={() => toast.success('Kopija računa se tiska...')} />
        )}
      </main>

      {/* Dialogs */}
      {showDrawerDialog && currentCashier && (
        <DrawerCodeDialog drawerCode={currentCashier.drawerCode} onSuccess={() => {}} onClose={() => setShowDrawerDialog(false)} />
      )}
      {showManagerCodeDialog && (
        <ManagerCodeDialog title="Koda poslovodje za storno" onSuccess={handleStornoConfirmed} onClose={() => { setShowManagerCodeDialog(false); setPendingStornoIndex(null); }} />
      )}
      {showProductSearchDialog && (
        <ProductSearchDialog products={products} isAdmin={isAdmin} onSelectProduct={handleSelectProduct} onClose={() => setShowProductSearchDialog(false)} />
      )}
      {showQuantityDialog && selectedItemIndex !== null && cartItems[selectedItemIndex] && (
        <QuantityInputDialog currentQuantity={cartItems[selectedItemIndex].quantity} onConfirm={handleQuantityConfirm} onClose={() => setShowQuantityDialog(false)} />
      )}
      {showDiscountDialog && (
        <DiscountInputDialog onConfirm={handleApplyDiscount} onClose={() => setShowDiscountDialog(false)} />
      )}
      {showReturnDialog && (
        <ReturnDialog onConfirm={handleReturnConfirm} onClose={() => setShowReturnDialog(false)} />
      )}
      {showShiftEndDialog && currentCashier && (
        <ShiftEndDialog cashier={currentCashier} transactions={transactions} onEndShift={handleEndShift} onEndDay={handleEndDay} onOpenDrawer={() => toast.success('Predal odprt')} onClose={() => setShowShiftEndDialog(false)} />
      )}
      {showReceiptsDialog && (
        <ReceiptsDialog transactions={transactions} onPrintReceipt={handlePrintReceipt} onPrintInvoice={handlePrintInvoice} onCopyToNew={handleCopyToNew} onVoidReceipt={handleVoidReceipt} onClose={() => setShowReceiptsDialog(false)} />
      )}
      {showPriceCheckDialog && (
        <PriceCheckDialog products={products} pluProducts={{}} onClose={() => setShowPriceCheckDialog(false)} />
      )}
      {showPartnerInvoiceDialog && (
        <PartnerInvoiceDialog onConfirm={handlePartnerInvoiceConfirm} onClose={() => setShowPartnerInvoiceDialog(false)} />
      )}
      {showPartialPaymentDialog && (
        <PartialPaymentDialog total={total} onConfirm={handlePartialPaymentComplete} onClose={() => setShowPartialPaymentDialog(false)} />
      )}
    </div>
  );
};

export default Index;
