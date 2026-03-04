import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CartItem, POSScreen, Transaction, Cashier, InvoiceData } from "@/types/pos";
import { Product } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";
import POSHeader, { POSTab } from "@/components/pos/POSHeader";
import BlagajnaTab from "@/components/pos/BlagajnaTab";
import GiftVoucherDialog from "@/components/pos/GiftVoucherDialog";
import PaymentTab from "@/components/pos/PaymentTab";
import CompletionScreen from "@/components/pos/CompletionScreen";
import LoginScreen from "@/components/pos/LoginScreen";
import RacuniTab from "@/components/pos/RacuniTab";
import ZakljucekTab from "@/components/pos/ZakljucekTab";
import DrawerCodeDialog from "@/components/pos/DrawerCodeDialog";
import ManagerCodeDialog from "@/components/pos/ManagerCodeDialog";
import ProductSearchDialog from "@/components/pos/ProductSearchDialog";
import QuantityInputDialog from "@/components/pos/QuantityInputDialog";
import DiscountInputDialog from "@/components/pos/DiscountInputDialog";
import ReturnDialog from "@/components/pos/ReturnDialog";
import { ClosingReport } from "@/components/pos/ShiftEndDialog";
import PriceCheckDialog from "@/components/pos/PriceCheckDialog";
import BackOfficeDashboard from "@/components/backoffice/BackOfficeDashboard";
import PartnerInvoiceDialog from "@/components/pos/PartnerInvoiceDialog";

const cashiers: Cashier[] = [
  { id: '7001', name: 'Dženan Kedić', password: '7001', role: 'admin', drawerCode: '2082' },
  { id: '7002', name: 'Eva Zakrajšek', password: '7002', role: 'cashier', drawerCode: '4268' },
  { id: '8001', name: 'Študent 1', password: '8001', role: 'cashier', drawerCode: '0000' },
  { id: '8002', name: 'Študent 2', password: '8002', role: 'cashier', drawerCode: '0000' },
  { id: '8003', name: 'Študent 3', password: '8003', role: 'cashier', drawerCode: '0000' },
];

const getProductsLookup = (products: Product[]): Record<string, { name: string; price: number }> => {
  return products.reduce((acc, p) => {
    acc[p.ean] = { name: p.name, price: p.price };
    return acc;
  }, {} as Record<string, { name: string; price: number }>);
};

const Index = () => {
  const [appMode, setAppMode] = useState<'login' | 'pos' | 'backoffice'>('login');
  const [posTab, setPosTab] = useState<POSTab>('blagajna');
  const [screen, setScreen] = useState<'main' | 'payment' | 'complete' | 'giftvoucher'>('main');
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceData | undefined>();
  const [closingHistory, setClosingHistory] = useState<ClosingReport[]>([]);

  // Dialog states
  const [showManagerCodeDialog, setShowManagerCodeDialog] = useState(false);
  const [showProductSearchDialog, setShowProductSearchDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showPriceCheckDialog, setShowPriceCheckDialog] = useState(false);
  const [showPartnerInvoiceDialog, setShowPartnerInvoiceDialog] = useState(false);
  const [pendingStornoIndex, setPendingStornoIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (!error && data) {
        setProducts((data as any[]).map(p => ({
          ean: p.ean, name: p.name, price: Number(p.price), stock: p.stock, minStock: p.min_stock, category: p.category,
        })));
      }
    };
    fetchProducts();
    const channel = supabase.channel('pos-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const productsLookup = getProductsLookup(products);
  const isAdmin = currentCashier?.role === 'admin';

  const subtotal = cartItems.reduce((sum, item) => item.isReturn ? sum - item.price * item.quantity : sum + item.price * item.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, item) => item.discount && item.originalPrice ? sum + (item.originalPrice - item.price) * item.quantity : sum, 0);
  const total = subtotal;

  const lastAddedItem = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;

  const handleLogin = (cashier: Cashier) => { setCurrentCashier(cashier); setAppMode('pos'); setScreen('main'); };
  const handleBackOfficeLogin = (role?: 'admin' | 'shop') => { setAppMode('backoffice'); };
  const handleLogout = () => {
    setCurrentCashier(null); setCartItems([]); setSelectedItemIndex(null); setInputValue("");
    setAppMode('login'); setScreen('main'); setPosTab('blagajna');
    toast.success('Uspešna odjava');
  };

  const handleKeyPress = (key: string) => setInputValue(prev => prev + key);
  const handleDelete = () => setInputValue(prev => prev.slice(0, -1));

  const handleConfirm = () => {
    if (!inputValue) return;
    const product = productsLookup[inputValue];
    if (product) {
      const existingIndex = cartItems.findIndex(item => item.ean === inputValue && !item.isReturn);
      if (existingIndex >= 0) {
        const newItems = [...cartItems]; newItems[existingIndex].quantity += 1;
        setCartItems(newItems); setSelectedItemIndex(existingIndex);
      } else {
        const newItem: CartItem = { id: Date.now().toString(), ean: inputValue, name: product.name, price: product.price, quantity: 1 };
        setCartItems(prev => { setSelectedItemIndex(prev.length); return [...prev, newItem]; });
      }
      toast.success(`${product.name} dodan`);
    } else { toast.error('Artikel ni najden'); }
    setInputValue("");
  };

  const handleDiscount = () => {
    if (cartItems.length === 0) { toast.warning('Dodajte artikle pred popustom'); return; }
    setShowDiscountDialog(true);
  };

  const handleApplyDiscount = (discount: number, isPercentage: boolean) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
      const newItems = [...cartItems]; const item = newItems[selectedItemIndex];
      item.originalPrice = item.originalPrice || item.price;
      if (isPercentage) { item.discount = discount; item.price = item.originalPrice * (1 - discount / 100); }
      else { item.price = Math.max(0, item.originalPrice - discount); item.discount = ((item.originalPrice - item.price) / item.originalPrice) * 100; }
      setCartItems(newItems);
    } else {
      setCartItems(cartItems.map(item => {
        const op = item.originalPrice || item.price;
        if (isPercentage) return { ...item, originalPrice: op, discount, price: op * (1 - discount / 100) };
        const np = Math.max(0, op - discount);
        return { ...item, originalPrice: op, discount: ((op - np) / op) * 100, price: np };
      }));
    }
    toast.success(`Popust ${discount}% dodan`);
  };

  const handleStorno = () => {
    if (selectedItemIndex === null) { toast.warning('Izberite artikel za storno'); return; }
    setPendingStornoIndex(selectedItemIndex); setShowManagerCodeDialog(true);
  };

  const handleStornoConfirmed = () => {
    if (pendingStornoIndex !== null && pendingStornoIndex >= 0) {
      const name = cartItems[pendingStornoIndex]?.name;
      setCartItems(cartItems.filter((_, i) => i !== pendingStornoIndex)); setSelectedItemIndex(null);
      toast.success(`${name} storniran`);
    }
    setPendingStornoIndex(null);
  };

  const handleReturnConfirm = (ean: string, quantity: number, price: number) => {
    setCartItems(prev => [...prev, { id: Date.now().toString(), ean, name: `Vračilo (${ean})`, price, quantity, isReturn: true }]);
    toast.success(`Vračilo dodano: -${(price * quantity).toFixed(2)} €`);
  };

  const handleSelectProduct = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.ean === product.ean && !item.isReturn);
    if (existingIndex >= 0) {
      const newItems = [...cartItems]; newItems[existingIndex].quantity += 1;
      setCartItems(newItems); setSelectedItemIndex(existingIndex);
    } else {
      const newItem: CartItem = { id: Date.now().toString(), ean: product.ean, name: product.name, price: product.price, quantity: 1 };
      setCartItems(prev => { setSelectedItemIndex(prev.length); return [...prev, newItem]; });
    }
    toast.success(`${product.name} dodan`);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex]) {
      const newItems = [...cartItems]; newItems[selectedItemIndex] = { ...newItems[selectedItemIndex], quantity };
      setCartItems(newItems); toast.success(`Količina spremenjena na ${quantity}`);
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) { toast.warning('Dodajte artikle pred plačilom'); return; }
    setScreen('payment');
  };

  const handleOpenDrawer = () => {
    if (currentCashier) setShowDrawerDialog(true);
  };

  const deductStock = async (items: typeof cartItems) => {
    for (const item of items) {
      if (item.isReturn) {
        const { data } = await supabase.from('products').select('stock').eq('ean', item.ean as any).single();
        if (data) await supabase.from('products').update({ stock: (data as any).stock + item.quantity } as any).eq('ean', item.ean as any);
      } else {
        const { data } = await supabase.from('products').select('stock, name, min_stock').eq('ean', item.ean as any).single();
        if (data) {
          const d = data as any; const newStock = Math.max(0, (d.stock || 0) - item.quantity);
          await supabase.from('products').update({ stock: newStock } as any).eq('ean', item.ean as any);
          if (newStock <= (d.min_stock || 0)) toast.warning(`⚠ Nizka zaloga: ${d.name} (${newStock} kosov)`);
        }
      }
    }
  };

  const createTransaction = (paymentMethod: string, amountPaid: number, change: number = 0): Transaction => ({
    id: Date.now().toString().slice(-6), items: cartItems, subtotal, discount: totalDiscount, total,
    paymentMethod, amountPaid, change, timestamp: new Date(),
    cashierId: currentCashier?.id || '', cashierName: currentCashier?.name || '', invoiceData: pendingInvoiceData,
  });

  const handleCashComplete = async (amountPaid: number) => {
    const transaction = createTransaction('gotovina', amountPaid, amountPaid - total);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    toast.success('Račun zaključen');
  };

  const handleCardComplete = async () => {
    const transaction = createTransaction('kartica', total, 0);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    toast.success('Račun zaključen');
  };

  const handleNewTransaction = () => {
    setCartItems([]); setSelectedItemIndex(null); setInputValue("");
    setLastTransaction(null); setPendingInvoiceData(undefined); setScreen('main');
  };

  const handlePrintReceipt = (t: Transaction) => toast.success(`Račun #${t.id} se tiska...`);
  const handlePrintInvoice = (t: Transaction) => toast.success(`Faktura #${t.id} se tiska...`);
  const handleCopyToNew = (t: Transaction) => {
    setCartItems(t.items.map(item => ({ ...item, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) })));
    setPosTab('blagajna'); toast.success('Artikli kopirani v nov račun');
  };
  const handleVoidReceipt = (t: Transaction) => {
    setTransactions(prev => prev.filter(tr => tr.id !== t.id));
    toast.success(`Račun #${t.id} storniran`);
  };

  const handleEndShift = (report: ClosingReport) => { setClosingHistory(prev => [report, ...prev]); toast.success('Izmena zaključena'); handleLogout(); };
  const handleEndDay = (report: ClosingReport) => { setClosingHistory(prev => [report, ...prev]); toast.success('Blagajna zaključena'); handleLogout(); };

  const handlePartnerInvoiceConfirm = (invoiceData: InvoiceData, paymentMethod: string) => {
    setPendingInvoiceData(invoiceData); setShowPartnerInvoiceDialog(false);
  };

  // Login
  if (appMode === 'login') {
    return <LoginScreen cashiers={cashiers} onLogin={handleLogin} onBackOfficeLogin={(role) => handleBackOfficeLogin(role)} />;
  }

  // BackOffice
  if (appMode === 'backoffice') {
    return <BackOfficeDashboard onLogout={handleLogout} closingReports={closingHistory} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <POSHeader cashier={currentCashier} activeTab={posTab} onTabChange={setPosTab} onLogout={handleLogout} />

      <main className="flex-1 overflow-hidden">
        {posTab === 'blagajna' && screen === 'main' && (
          <BlagajnaTab
            cartItems={cartItems} selectedItemIndex={selectedItemIndex} inputValue={inputValue}
            subtotal={subtotal} total={total} totalDiscount={totalDiscount} lastAddedItem={lastAddedItem}
            onSelectItem={setSelectedItemIndex} onKeyPress={handleKeyPress} onDelete={handleDelete}
            onConfirm={handleConfirm} onProceedToPayment={handleProceedToPayment}
            onOpenDrawer={handleOpenDrawer}
            onProductSearch={() => setShowProductSearchDialog(true)}
            onPriceCheck={() => setShowPriceCheckDialog(true)}
            onQuantity={() => { if (selectedItemIndex === null) { toast.warning('Izberite artikel'); return; } setShowQuantityDialog(true); }}
            onDiscount={handleDiscount} onReturn={() => setShowReturnDialog(true)} onStorno={handleStorno}
            onGiftVoucher={() => setScreen('giftvoucher')}
          />
        )}

        {posTab === 'blagajna' && screen === 'giftvoucher' && (
          <GiftVoucherDialog
            total={total}
            cartItems={cartItems.map(i => ({ name: i.name }))}
            onConfirm={(code, amount, type) => {
              toast.success(`Bon ${code} uporabljen (${amount} EUR)`);
              setScreen('main');
            }}
            onClose={() => setScreen('main')}
          />
        )}

        {posTab === 'blagajna' && screen === 'payment' && (
          <PaymentTab
            cartItems={cartItems} subtotal={subtotal} total={total} totalDiscount={totalDiscount}
            onCashPayment={handleCashComplete} onCardPayment={handleCardComplete}
            onInvoice={() => setShowPartnerInvoiceDialog(true)} onBack={() => setScreen('main')}
          />
        )}

        {posTab === 'blagajna' && screen === 'complete' && lastTransaction && (
          <CompletionScreen transaction={lastTransaction} onNewTransaction={handleNewTransaction} onPrintCopy={() => toast.success('Kopija računa se tiska...')} />
        )}

        {posTab === 'racuni' && (
          <RacuniTab transactions={transactions} onPrintReceipt={handlePrintReceipt}
            onPrintInvoice={handlePrintInvoice} onCopyToNew={handleCopyToNew} onVoidReceipt={handleVoidReceipt} />
        )}

        {posTab === 'zakljucek' && currentCashier && (
          <ZakljucekTab cashier={currentCashier} cashiers={cashiers} transactions={transactions}
            closingHistory={closingHistory} onEndShift={handleEndShift} onEndDay={handleEndDay} onOpenDrawer={handleOpenDrawer} />
        )}
      </main>

      {/* Dialogs */}
      {showDrawerDialog && currentCashier && (
        <DrawerCodeDialog drawerCode={currentCashier.drawerCode} onSuccess={() => { toast.success('Predal odprt'); setShowDrawerDialog(false); }} onClose={() => setShowDrawerDialog(false)} />
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
      {showPriceCheckDialog && (
        <PriceCheckDialog products={products} pluProducts={{}} onClose={() => setShowPriceCheckDialog(false)} />
      )}
      {showPartnerInvoiceDialog && (
        <PartnerInvoiceDialog onConfirm={handlePartnerInvoiceConfirm} onClose={() => setShowPartnerInvoiceDialog(false)} />
      )}
    </div>
  );
};

export default Index;
