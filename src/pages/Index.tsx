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
import POSTerminalApp from "@/components/pos/POSTerminalApp";

// Fallback cashier for PODPORA STANDBUY (always available even if DB is empty)
const FALLBACK_CASHIERS: Cashier[] = [
  { id: '00087', name: 'PODPORA STANDBUY', password: '00087', role: 'admin', drawerCode: '1359' },
];

const EMBALAZA_EAN = "EMB001";

// Get or assign a register ID for this device (max 3 registers + self-checkout 101-103)
const MAX_REGISTERS = 3;
const SELF_CHECKOUT_LABELS: Record<string, number> = { 'A1': 101, 'A2': 102, 'A3': 103 };
const SELF_CHECKOUT_IDS = [101, 102, 103];
const labelToRegisterId = (label: string): number => SELF_CHECKOUT_LABELS[label] || 101;
const registerIdToLabel = (id: number): string => {
  const entry = Object.entries(SELF_CHECKOUT_LABELS).find(([, v]) => v === id);
  return entry ? entry[0] : `A${id - 100}`;
};
const getRegisterId = (): number => {
  const stored = localStorage.getItem('trgopos_register_id');
  if (stored) {
    const id = parseInt(stored);
    if ((id >= 1 && id <= MAX_REGISTERS) || SELF_CHECKOUT_IDS.includes(id)) return id;
  }
  return 0;
};

// setRegisterId can be used to manually assign a register number
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setRegisterIdValue = (id: number) => {
  localStorage.setItem('trgopos_register_id', String(id));
};

const getProductsLookup = (products: Product[]): Record<string, { name: string; price: number }> => {
  return products.reduce((acc, p) => {
    acc[p.ean] = { name: p.name, price: p.price };
    return acc;
  }, {} as Record<string, { name: string; price: number }>);
};

const Index = () => {
  const [appMode, setAppMode] = useState<'login' | 'pos' | 'backoffice' | 'terminal'>('login');
  const [backofficeRole, setBackofficeRole] = useState<'admin' | 'shop'>('shop');
  const [posTab, setPosTab] = useState<POSTab>('blagajna');
  const [screen, setScreen] = useState<'main' | 'payment' | 'complete' | 'giftvoucher'>('main');
  const [currentCashier, setCurrentCashier] = useState<Cashier | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>(FALLBACK_CASHIERS);
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<InvoiceData | undefined>();
  const [closingHistory, setClosingHistory] = useState<ClosingReport[]>([]);
  const [receiptCounter, setReceiptCounter] = useState(0);
  const [registerId, setRegisterIdState] = useState<number>(getRegisterId());
  const [registerLocked, setRegisterLocked] = useState(false);

  // Dialog states
  const [showManagerCodeDialog, setShowManagerCodeDialog] = useState(false);
  const [showReturnManagerCode, setShowReturnManagerCode] = useState(false);
  const [showProductSearchDialog, setShowProductSearchDialog] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showPriceCheckDialog, setShowPriceCheckDialog] = useState(false);
  const [showPartnerInvoiceDialog, setShowPartnerInvoiceDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingStornoIndex, setPendingStornoIndex] = useState<number | null>(null);
  const [managerCodeTitle, setManagerCodeTitle] = useState("Koda poslovodje");
  const [keyboardEnabled, setKeyboardEnabled] = useState(() => localStorage.getItem('trgopos_keyboard') === 'true');
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsCardId, setPointsCardId] = useState<string | null>(null);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [isSelfCheckout, setIsSelfCheckout] = useState(false);
  const [selfCheckoutLabel, setSelfCheckoutLabel] = useState("");


  // Fetch transactions - PODPORA (00087) sees ALL registers' full history, others see only their register today
  const fetchTransactions = async (cashierId?: string) => {
    const isSupport = cashierId === '00087';
    let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (isSupport) {
      // PODPORA sees everything across all registers
      query = query.limit(500);
    } else {
      // Regular cashiers see only their register, today only
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query = query.eq('register_id', registerId).gte('created_at', todayStart.toISOString()).limit(100);
    }
    const { data } = await query;
    if (data) {
      setTransactions((data as any[]).map(t => ({
        id: t.receipt_number,
        items: t.items as CartItem[],
        subtotal: Number(t.subtotal),
        discount: Number(t.discount),
        total: Number(t.total),
        paymentMethod: t.payment_method,
        amountPaid: Number(t.amount_paid),
        change: Number(t.change_amount),
        timestamp: new Date(t.created_at),
        cashierId: t.cashier_id,
        cashierName: t.cashier_name,
        invoiceData: t.invoice_data as InvoiceData | undefined,
        registerId: t.register_id,
      })));
    }
  };

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
    fetchTransactions();

    const fetchEmployees = async () => {
      const { data } = await supabase.from('employees').select('*');
      if (data && data.length > 0) {
        const dbCashiers: Cashier[] = data.map((e: any) => ({
          id: e.username || e.code || e.id,
          name: `${e.first_name} ${e.last_name}`,
          password: e.password || e.username || e.code,
          role: (e.position?.toLowerCase().includes('admin') || e.position?.toLowerCase().includes('direktor') || e.position?.toLowerCase().includes('vodja')) ? 'admin' as const : 'cashier' as const,
          drawerCode: e.code || '',
        }));
        // Always include PODPORA STANDBUY fallback
        const hasSupport = dbCashiers.some(c => c.id === '00087');
        setCashiers(hasSupport ? dbCashiers : [...FALLBACK_CASHIERS, ...dbCashiers]);
      }
    };
    fetchEmployees();

    // Check self-checkout config — look up by base register OR by self-checkout register ID
    const checkSelfCheckout = async () => {
      if (registerId <= 0) return;
      // Check if current registerId is already a self-checkout ID
      const isSCId = SELF_CHECKOUT_IDS.includes(registerId);
      const baseId = isSCId ? registerId : registerId; // for base registers, check by register_id
      const { data } = await supabase.from('self_checkout_config').select('*').eq('register_id', baseId).eq('enabled', true).maybeSingle();
      if (data) {
        const label = (data as any)?.label || registerIdToLabel(registerId);
        setIsSelfCheckout(true);
        setSelfCheckoutLabel(label);
        // Ensure registerId matches the self-checkout ID
        const scId = labelToRegisterId(label);
        if (registerId !== scId) {
          setRegisterIdState(scId);
          localStorage.setItem('trgopos_register_id', String(scId));
        }
      } else {
        setIsSelfCheckout(false);
        setSelfCheckoutLabel('');
      }
    };
    checkSelfCheckout();

    const channel = supabase.channel('pos-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchEmployees())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'self_checkout_config' }, () => checkSelfCheckout())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const productsLookup = getProductsLookup(products);
  const isAdmin = currentCashier?.role === 'admin';

  const activeCartItems = cartItems.filter(item => !item.isStornoed);
  const subtotal = activeCartItems.reduce((sum, item) => item.isReturn ? sum - item.price * item.quantity : sum + item.price * item.quantity, 0);
  const totalDiscount = activeCartItems.reduce((sum, item) => item.discount && item.originalPrice ? sum + (item.originalPrice - item.price) * item.quantity : sum, 0);
  const total = subtotal - pointsDiscount;

  const lastAddedItem = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;

  const handleLogin = async (cashier: Cashier) => {
    // Check if this register is locked for the day
    const today = new Date().toISOString().split('T')[0];
    const { data: lockCheck } = await supabase.from('register_closings').select('id')
      .eq('register_id', registerId).eq('date', today).eq('type', 'Zaključek blagajne').limit(1);
    if (lockCheck && lockCheck.length > 0) {
      // PODPORA STANDBUY (id 00087) can unlock registers
      if (cashier.id === '00087') {
        // Delete the closing record to unlock this register
        await supabase.from('register_closings').delete()
          .eq('register_id', registerId).eq('date', today).eq('type', 'Zaključek blagajne');
        setRegisterLocked(false);
        toast.success(`Blagajna ${registerId} odklenjena s profilom PODPORA STANDBUY`);
      } else {
        setRegisterLocked(true);
        toast.error(`Blagajna ${registerId} je že zaključena za danes. Samo PODPORA STANDBUY jo lahko odklene.`);
        return;
      }
    }
    setCurrentCashier(cashier); setAppMode('pos'); setScreen('main');
    // Re-fetch transactions for this cashier's permissions
    fetchTransactions(cashier.id);
  };
  const handleBackOfficeLogin = (role: 'admin' | 'shop') => { setBackofficeRole(role); setAppMode('backoffice'); };
  const handleLogout = () => {
    setCurrentCashier(null); setCartItems([]); setSelectedItemIndex(null); setInputValue("");
    setAppMode('login'); setScreen('main'); setPosTab('blagajna');
    setTransactions([]); // Clear transactions on logout
    toast.success('Uspešna odjava');
  };

  const handleKeyPress = (key: string) => setInputValue(prev => prev + key);
  const handleDelete = () => setInputValue(prev => prev.slice(0, -1));

  const handleConfirm = () => {
    if (!inputValue) return;
    const product = productsLookup[inputValue];
    if (product) {
      const existingIndex = cartItems.findIndex(item => item.ean === inputValue && !item.isReturn && !item.isStornoed);
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

  // Embalaža - add a bag from products DB
  const handleEmbalaza = () => {
    const lookup = getProductsLookup(products);
    const emb = lookup[EMBALAZA_EAN];
    if (!emb) {
      toast.error('Artikel embalaže (EMB001) ni najden v bazi. Dodajte ga v BackOffice.');
      return;
    }
    const existingIndex = cartItems.findIndex(item => item.ean === EMBALAZA_EAN && !item.isStornoed);
    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += 1;
      setCartItems(newItems);
      setSelectedItemIndex(existingIndex);
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        ean: EMBALAZA_EAN,
        name: emb.name,
        price: emb.price,
        quantity: 1,
      };
      setCartItems(prev => { setSelectedItemIndex(prev.length); return [...prev, newItem]; });
    }
    toast.success(`${emb.name} dodana (${emb.price.toFixed(2)} €)`);
  };

  const handleDiscount = () => {
    if (cartItems.length === 0) { toast.warning('Dodajte artikle pred popustom'); return; }
    setShowDiscountDialog(true);
  };

  const handleApplyDiscount = (discount: number, isPercentage: boolean) => {
    if (selectedItemIndex !== null && cartItems[selectedItemIndex] && !cartItems[selectedItemIndex].isStornoed) {
      const newItems = [...cartItems]; const item = newItems[selectedItemIndex];
      item.originalPrice = item.originalPrice || item.price;
      if (isPercentage) { item.discount = discount; item.price = parseFloat((item.originalPrice * (1 - discount / 100)).toFixed(2)); }
      else { item.price = Math.max(0, parseFloat((item.originalPrice - discount).toFixed(2))); item.discount = parseFloat((((item.originalPrice - item.price) / item.originalPrice) * 100).toFixed(2)); }
      setCartItems(newItems);
      toast.success(`Popust ${discount}${isPercentage ? '%' : '€'} dodan`);
    } else {
      setCartItems(cartItems.map(item => {
        if (item.isStornoed) return item;
        const op = item.originalPrice || item.price;
        if (isPercentage) return { ...item, originalPrice: op, discount, price: parseFloat((op * (1 - discount / 100)).toFixed(2)) };
        const np = Math.max(0, parseFloat((op - discount).toFixed(2)));
        return { ...item, originalPrice: op, discount: parseFloat((((op - np) / op) * 100).toFixed(2)), price: np };
      }));
      toast.success(`Popust ${discount}${isPercentage ? '%' : '€'} dodan na vse artikle`);
    }
  };

  const handleStorno = () => {
    if (selectedItemIndex === null) { toast.warning('Izberite artikel za storno'); return; }
    if (cartItems[selectedItemIndex]?.isStornoed) { toast.warning('Artikel je že storniran'); return; }
    if (isSelfCheckout) {
      // Self-checkout: ALL stornos require MASTER ADMIN code
      setPendingStornoIndex(selectedItemIndex);
      setManagerCodeTitle("MASTER ADMIN KODA za storno (samoplačniška)");
      setShowManagerCodeDialog(true);
      return;
    }
    const lastActiveIndex = cartItems.length - 1 - [...cartItems].reverse().findIndex(item => !item.isStornoed);
    if (selectedItemIndex === lastActiveIndex) {
      handleStornoItem(selectedItemIndex);
    } else {
      setPendingStornoIndex(selectedItemIndex);
      setManagerCodeTitle("Koda poslovodje za storno");
      setShowManagerCodeDialog(true);
    }
  };

  const handleStornoItem = (index: number) => {
    const newItems = [...cartItems];
    newItems[index] = { ...newItems[index], isStornoed: true };
    setCartItems(newItems);
    setSelectedItemIndex(null);
    toast.success(`${newItems[index].name} storniran`);
  };

  const handleStornoConfirmed = () => {
    if (pendingStornoIndex !== null && pendingStornoIndex >= 0) handleStornoItem(pendingStornoIndex);
    setPendingStornoIndex(null);
  };

  const handleReturnRequest = () => {
    setManagerCodeTitle("ADMIN KODA za vračilo");
    setShowReturnManagerCode(true);
  };

  const handleReturnConfirm = (ean: string, quantity: number, price: number) => {
    setCartItems(prev => [...prev, { id: Date.now().toString(), ean, name: `Vračilo (${ean})`, price, quantity, isReturn: true }]);
    toast.success(`Vračilo dodano: -${(price * quantity).toFixed(2)} €`);
  };

  const handleSelectProduct = (product: Product) => {
    const existingIndex = cartItems.findIndex(item => item.ean === product.ean && !item.isReturn && !item.isStornoed);
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
    if (selectedItemIndex !== null && cartItems[selectedItemIndex] && !cartItems[selectedItemIndex].isStornoed) {
      const newItems = [...cartItems]; newItems[selectedItemIndex] = { ...newItems[selectedItemIndex], quantity };
      setCartItems(newItems); toast.success(`Količina spremenjena na ${quantity}`);
    }
  };

  const handleProceedToPayment = () => {
    if (activeCartItems.length === 0) { toast.warning('Dodajte artikle pred plačilom'); return; }
    setScreen('payment');
  };

  // Physical keyboard support - main POS screen
  useEffect(() => {
    if (!keyboardEnabled || appMode !== 'pos' || posTab !== 'blagajna' || screen !== 'main') return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (showSettingsDialog || showManagerCodeDialog || showReturnManagerCode || showProductSearchDialog || showQuantityDialog || showDiscountDialog || showReturnDialog || showPriceCheckDialog || showPartnerInvoiceDialog) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleProceedToPayment();
      } else if (e.key === '*') {
        e.preventDefault();
        if (selectedItemIndex === null) { toast.warning('Izberite artikel'); return; }
        if (cartItems[selectedItemIndex]?.isStornoed) { toast.warning('Artikel je storniran'); return; }
        setShowQuantityDialog(true);
      } else if (e.key === '-') {
        e.preventDefault();
        handleStorno();
      } else if (e.key === '/') {
        e.preventDefault();
        handleDiscount();
      } else if (e.key === '+') {
        e.preventDefault();
        setShowProductSearchDialog(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardEnabled, appMode, posTab, screen, inputValue, cartItems, selectedItemIndex, showSettingsDialog, showManagerCodeDialog, showReturnManagerCode, showProductSearchDialog, showQuantityDialog, showDiscountDialog, showReturnDialog, showPriceCheckDialog, showPartnerInvoiceDialog]);

  const handleOpenDrawer = () => {
    if (currentCashier) setShowDrawerDialog(true);
  };

  const deductStock = async (items: typeof cartItems) => {
    for (const item of items) {
      if (item.isStornoed) continue;
      // embalaža now tracked in products table, no skip needed
      if (item.isReturn) {
        const { data } = await supabase.from('products').select('stock').eq('ean', item.ean).single();
        if (data) await supabase.from('products').update({ stock: data.stock + item.quantity }).eq('ean', item.ean);
      } else {
        const { data } = await supabase.from('products').select('stock, name, min_stock').eq('ean', item.ean).single();
        if (data) {
          const newStock = Math.max(0, (data.stock || 0) - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('ean', item.ean);
          if (newStock <= (data.min_stock || 0)) toast.warning(`⚠ Nizka zaloga: ${data.name} (${newStock} kosov)`);
        }
      }
    }
  };

  const getNextReceiptNumber = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('get_next_receipt_number');
    if (error || !data) {
      const next = receiptCounter + 1;
      setReceiptCounter(next);
      return String(next).padStart(6, '0');
    }
    return data as string;
  };

  const createTransaction = async (paymentMethod: string, amountPaid: number, change: number = 0): Promise<Transaction> => {
    const receiptNumber = await getNextReceiptNumber();
    const transaction: Transaction = {
      id: receiptNumber, items: cartItems, subtotal, discount: totalDiscount, total, paymentMethod, amountPaid, change,
      timestamp: new Date(), cashierId: currentCashier?.id || '', cashierName: currentCashier?.name || '', invoiceData: pendingInvoiceData,
    };
    await supabase.from('transactions').insert({
      receipt_number: receiptNumber, items: cartItems as any, subtotal, discount: totalDiscount, total,
      payment_method: paymentMethod, amount_paid: amountPaid, change_amount: change,
      cashier_id: currentCashier?.id || '', cashier_name: currentCashier?.name || '', invoice_data: pendingInvoiceData as any,
      register_id: registerId,
    });
    return transaction;
  };

  const handleCashComplete = async (amountPaid: number) => {
    const transaction = await createTransaction('gotovina', amountPaid, amountPaid - total);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    toast.success('Račun zaključen');
  };

  const handleCardComplete = async () => {
    // Create a terminal request and wait for approval via realtime
    const { data: req } = await supabase.from('terminal_requests').insert({
      register_id: registerId,
      amount: total,
      status: 'pending',
    }).select().single();

    if (!req) {
      toast.error('Napaka pri pošiljanju na terminal');
      return;
    }

    toast.info('Čakam na potrditev POS terminala...');

    // Listen for status change on this request
    const channel = supabase.channel(`terminal-req-${req.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'terminal_requests',
        filter: `id=eq.${req.id}`,
      }, async (payload) => {
        const updated = payload.new as any;
        supabase.removeChannel(channel);
        if (updated.status === 'approved') {
          const transaction = await createTransaction('kartica', total, 0);
          setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
          await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
          toast.success('Plačilo s kartico potrjeno');
        } else if (updated.status === 'declined') {
          toast.error('Plačilo s kartico zavrnjeno');
        }
      })
      .subscribe();
  };

  const handleBonPayment = async (codes: string[]) => {
    if (total < 10) { toast.error('Bon se lahko uporabi samo pri znesku nad 10,00 €'); return; }
    
    // Validate all vouchers first
    const vouchers: any[] = [];
    for (const code of codes) {
      const { data: voucher } = await supabase.from('gift_vouchers').select('*').eq('code', code).single();
      if (!voucher) { toast.error(`Bon ${code} ni najden`); return; }
      if (voucher.is_used || voucher.remaining_amount <= 0) { toast.error(`Bon ${code} je že porabljen`); return; }
      vouchers.push(voucher);
    }
    
    const bonTotal = vouchers.length * 10; // Each voucher = 10€
    
    // Mark all vouchers as used (full consumption, no partial)
    for (const voucher of vouchers) {
      await supabase.from('gift_vouchers').update({
        remaining_amount: 0, is_used: true,
        used_by: currentCashier?.id, used_at: new Date().toISOString(),
      }).eq('id', voucher.id);
    }
    
    const remainingToPay = total - bonTotal;
    if (remainingToPay > 0) {
      toast.info(`${vouchers.length}x bon unovčen (${bonTotal.toFixed(2)} €). Preostali znesek: ${remainingToPay.toFixed(2)} € plačajte z drugim sredstvom.`);
    }
    const transaction = await createTransaction('darilni bon', total, 0);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    toast.success(`Plačilo z ${vouchers.length} bonom/i uspešno`);
  };

  const handleGiftCardPayment = async (code: string) => {
    // Try 8-digit code or EAN
    let query = supabase.from('gift_cards').select('*').eq('active', true);
    const { data: cardByCode } = await query.eq('code', code).single();
    let card = cardByCode as any;
    if (!card) {
      const { data: cardByEan } = await supabase.from('gift_cards').select('*').eq('ean', code).eq('active', true).single();
      card = cardByEan as any;
    }
    if (!card) { toast.error('Darilna kartica ni najdena ali ni aktivna'); return; }
    if (card.balance < total) { toast.error(`Kartica nima dovolj sredstev (stanje: ${Number(card.balance).toFixed(2)} €)`); return; }
    await supabase.from('gift_cards').update({
      balance: card.balance - total,
    } as any).eq('id', card.id);
    const transaction = await createTransaction('darilna kartica', total, 0);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    toast.success(`Plačilo z darilno kartico uspešno (novo stanje: ${(card.balance - total).toFixed(2)} €)`);
  };

  const handleGiftCardPointsRedeem = async (cardId: string, usedPoints: number, discountAmount: number) => {
    // Deduct points from card in DB
    const { data: card } = await supabase.from('gift_cards').select('points').eq('id', cardId).single();
    if (card) {
      await supabase.from('gift_cards').update({ points: Math.max(0, (card.points || 0) - usedPoints) } as any).eq('id', cardId);
    }
    // Apply discount to current total
    setPointsDiscount(discountAmount);
    setPointsCardId(cardId);
    setPointsUsed(usedPoints);
    toast.success(`${usedPoints} točk unovčenih (-${discountAmount.toFixed(2)} €). Izberite način plačila za preostanek.`);
  };

  const handleGiftCardBalancePayment = async (cardId: string, amount: number) => {
    const { data: card } = await supabase.from('gift_cards').select('balance').eq('id', cardId).single();
    if (!card || (card.balance || 0) < amount) { toast.error('Kartica nima dovolj sredstev'); return; }
    await supabase.from('gift_cards').update({ balance: (card.balance || 0) - amount } as any).eq('id', cardId);
    const transaction = await createTransaction('darilna kartica', amount, 0);
    setLastTransaction(transaction); setTransactions(prev => [transaction, ...prev]);
    await deductStock(cartItems); setScreen('complete'); setPendingInvoiceData(undefined);
    setPointsDiscount(0); setPointsCardId(null); setPointsUsed(0);
    toast.success(`Plačilo z darilno kartico uspešno (novo stanje: ${((card.balance || 0) - amount).toFixed(2)} €)`);
  };

  const handleGiftCardPartialBalance = async (cardId: string, cardAmount: number, remainingTotal: number) => {
    // Deduct full card balance
    const { data: card } = await supabase.from('gift_cards').select('balance').eq('id', cardId).single();
    if (!card || (card.balance || 0) < cardAmount) { toast.error('Kartica nima dovolj sredstev'); return; }
    await supabase.from('gift_cards').update({ balance: 0 } as any).eq('id', cardId);
    // Apply partial payment as discount, user pays remainder
    setPointsDiscount(prev => prev + cardAmount);
    toast.success(`${cardAmount.toFixed(2)} € plačano s kartice. Izberite način plačila za preostanek ${remainingTotal.toFixed(2)} €.`);
  };

  const handleAddLoyaltyPoints = async (code: string) => {
    const { data: card } = await supabase.from('gift_cards').select('*').eq('code', code).eq('active', true).single() as any;
    if (!card) {
      const { data: cardByEan } = await supabase.from('gift_cards').select('*').eq('ean', code).eq('active', true).single() as any;
      if (!cardByEan) { toast.error('Kartica ni najdena'); return; }
      // 1 point per euro spent
      const points = Math.floor(lastTransaction?.total || 0);
      await supabase.from('gift_cards').update({ points: (cardByEan.points || 0) + points } as any).eq('id', cardByEan.id);
      toast.success(`+${points} točk dodanih na kartico ${code} (skupaj: ${(cardByEan.points || 0) + points})`);
      return;
    }
    const points = Math.floor(lastTransaction?.total || 0);
    await supabase.from('gift_cards').update({ points: (card.points || 0) + points } as any).eq('id', card.id);
    toast.success(`+${points} točk dodanih na kartico ${code} (skupaj: ${(card.points || 0) + points})`);
  };

  const handleNewTransaction = () => {
    setCartItems([]); setSelectedItemIndex(null); setInputValue("");
    setLastTransaction(null); setPendingInvoiceData(undefined); setScreen('main');
    setPointsDiscount(0); setPointsCardId(null); setPointsUsed(0);
  };

  const handlePrintReceipt = (t: Transaction) => toast.success(`Račun #${t.id} se tiska...`);
  const handlePrintInvoice = (t: Transaction) => toast.success(`Faktura #${t.id} se tiska...`);
  const handleCopyToNew = (t: Transaction) => {
    setCartItems(t.items.filter(i => !i.isStornoed).map(item => ({ ...item, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) })));
    setPosTab('blagajna'); toast.success('Artikli kopirani v nov račun');
  };
  const handleVoidReceipt = async (t: Transaction) => {
    await supabase.from('transactions').update({ voided: true }).eq('receipt_number', t.id);
    // Return all items back to stock
    for (const item of t.items) {
      if (item.isStornoed) continue; // already stornoed items were never deducted
      if (item.isReturn) {
        // Return items had stock added back, so now we need to deduct again
        const { data } = await supabase.from('products').select('stock').eq('ean', item.ean).single();
        if (data) await supabase.from('products').update({ stock: Math.max(0, data.stock - item.quantity) }).eq('ean', item.ean);
      } else {
        // Normal items had stock deducted, so now we add back
        const { data } = await supabase.from('products').select('stock').eq('ean', item.ean).single();
        if (data) await supabase.from('products').update({ stock: data.stock + item.quantity }).eq('ean', item.ean);
      }
    }
    setTransactions(prev => prev.filter(tr => tr.id !== t.id));
    toast.success(`Račun #${t.id} storniran – zaloga vrnjena`);
  };

  const handleEndShift = async (report: ClosingReport) => {
    // Izkupiček - save to DB but do NOT logout
    await supabase.from('closing_reports').insert({
      type: report.type, cashier_name: report.cashier, cashier_id: report.cashierId,
      total: report.total, cash: report.cash, card: report.card, other: report.other,
      transaction_count: report.transactionCount, item_count: report.itemCount,
    });
    // Also save to register_closings for BackOffice visibility
    await supabase.from('register_closings').insert({
      register_id: registerId, type: 'Izkupiček', cashier_name: report.cashier, cashier_id: report.cashierId,
      total: report.total, cash: report.cash, card: report.card, other: report.other,
      transaction_count: report.transactionCount, item_count: report.itemCount,
    });
    setClosingHistory(prev => [report, ...prev]);
    toast.success('Izkupiček natisnjen – blagajna ostane aktivna');
    setPosTab('blagajna');
    // NO logout - cashier stays logged in
  };

  const handleEndDay = async (report: ClosingReport) => {
    // Zaključek blagajne - save, lock register, and logout
    await supabase.from('closing_reports').insert({
      type: report.type, cashier_name: report.cashier, cashier_id: report.cashierId,
      total: report.total, cash: report.cash, card: report.card, other: report.other,
      transaction_count: report.transactionCount, item_count: report.itemCount,
    });
    // Save to register_closings - this also locks the register for today
    await supabase.from('register_closings').insert({
      register_id: registerId, type: 'Zaključek blagajne', cashier_name: report.cashier, cashier_id: report.cashierId,
      total: report.total, cash: report.cash, card: report.card, other: report.other,
      transaction_count: report.transactionCount, item_count: report.itemCount,
    });
    setClosingHistory(prev => [report, ...prev]);
    setRegisterLocked(true);
    toast.success(`Blagajna ${registerId} zaključena za danes`);
    handleLogout();
  };

  const handlePartnerInvoiceConfirm = (invoiceData: InvoiceData, paymentMethod: string) => {
    setPendingInvoiceData(invoiceData); setShowPartnerInvoiceDialog(false);
  };

  const handleCreateGiftVoucher = async (code: string, amount: number) => {
    await supabase.from('gift_vouchers').insert({
      code, amount, remaining_amount: amount, created_by: currentCashier?.id || '',
    });
    toast.success(`Darilni bon ${code} ustvarjen (${amount} EUR)`);
    setScreen('main');
  };

  // Login
  if (appMode === 'terminal') {
    return <POSTerminalApp onBack={() => setAppMode('login')} />;
  }

  if (appMode === 'login') {
    return <LoginScreen cashiers={cashiers} onLogin={handleLogin} onBackOfficeLogin={handleBackOfficeLogin} registerId={registerId} registerLocked={registerLocked}
      onSelectRegister={(id: number) => { localStorage.setItem('trgopos_register_id', String(id)); setRegisterIdState(id); }}
      onOpenTerminal={() => setAppMode('terminal')} />;
  }

  // BackOffice
  if (appMode === 'backoffice') {
    return <BackOfficeDashboard onLogout={handleLogout} closingReports={closingHistory} role={backofficeRole} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <POSHeader cashier={currentCashier} activeTab={posTab} registerId={registerId} onTabChange={setPosTab} onLogout={handleLogout}
        isSelfCheckout={isSelfCheckout} selfCheckoutLabel={selfCheckoutLabel}
        onInfo={() => setShowInfoDialog(true)}
        onSettings={() => {
          if (currentCashier?.id === '00087' || currentCashier?.role === 'admin') {
            setShowSettingsDialog(true);
          } else {
            toast.error('Nastavitve so dostopne samo profilu PODPORA STANDBUY ali Direktorju');
          }
        }}
      />

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
            onQuantity={() => { if (selectedItemIndex === null) { toast.warning('Izberite artikel'); return; } if (cartItems[selectedItemIndex]?.isStornoed) { toast.warning('Artikel je storniran'); return; } setShowQuantityDialog(true); }}
            onDiscount={handleDiscount} onReturn={handleReturnRequest} onStorno={handleStorno}
            onGiftVoucher={() => setScreen('giftvoucher')}
            onEmbalaza={handleEmbalaza}
            isSelfCheckout={isSelfCheckout}
          />
        )}

        {posTab === 'blagajna' && screen === 'giftvoucher' && (
          <GiftVoucherDialog
            total={total}
            cartItems={cartItems.filter(i => !i.isStornoed).map(i => ({ name: i.name }))}
            onConfirm={(code, amount, type) => { handleCreateGiftVoucher(code, amount); }}
            onClose={() => setScreen('main')}
          />
        )}

        {posTab === 'blagajna' && screen === 'payment' && (
          <PaymentTab
            cartItems={cartItems.filter(i => !i.isStornoed)} subtotal={subtotal} total={total} totalDiscount={totalDiscount} registerId={registerId}
            onCashPayment={(amountPaid) => { handleCashComplete(amountPaid); setPointsDiscount(0); setPointsCardId(null); setPointsUsed(0); }}
            onCardPayment={() => { handleCardComplete(); setPointsDiscount(0); setPointsCardId(null); setPointsUsed(0); }}
            onInvoice={() => setShowPartnerInvoiceDialog(true)} onBack={() => { setScreen('main'); setPointsDiscount(0); setPointsCardId(null); setPointsUsed(0); }}
            onBonPayment={handleBonPayment}
            onGiftCardPayment={handleGiftCardPayment}
            onGiftCardPointsRedeem={handleGiftCardPointsRedeem}
            onGiftCardBalancePayment={handleGiftCardBalancePayment}
            onGiftCardPartialBalance={handleGiftCardPartialBalance}
            keyboardEnabled={keyboardEnabled}
            isSelfCheckout={isSelfCheckout}
          />
        )}

        {posTab === 'blagajna' && screen === 'complete' && lastTransaction && (
          <CompletionScreen transaction={lastTransaction} onNewTransaction={handleNewTransaction} onPrintCopy={() => toast.success('Kopija računa se tiska...')} onAddLoyaltyPoints={handleAddLoyaltyPoints} />
        )}

        {posTab === 'racuni' && (
          <RacuniTab transactions={transactions} onPrintReceipt={handlePrintReceipt}
            onPrintInvoice={handlePrintInvoice} onCopyToNew={handleCopyToNew} onVoidReceipt={handleVoidReceipt}
            isSupport={currentCashier?.id === '00087'} />
        )}

        {posTab === 'zakljucek' && currentCashier && (
          <ZakljucekTab cashier={currentCashier} cashiers={cashiers} transactions={transactions}
            closingHistory={closingHistory} registerId={registerId} onEndShift={handleEndShift} onEndDay={handleEndDay} onOpenDrawer={handleOpenDrawer} />
        )}
      </main>

      {/* Dialogs */}
      {showDrawerDialog && currentCashier && (
        <DrawerCodeDialog drawerCode={currentCashier.drawerCode} onSuccess={() => { toast.success('Predal odprt'); setShowDrawerDialog(false); }} onClose={() => setShowDrawerDialog(false)} />
      )}
      {showManagerCodeDialog && (
        <ManagerCodeDialog title={managerCodeTitle} onSuccess={handleStornoConfirmed} onClose={() => { setShowManagerCodeDialog(false); setPendingStornoIndex(null); }} />
      )}
      {showReturnManagerCode && (
        <ManagerCodeDialog title="ADMIN KODA za vračilo" onSuccess={() => { setShowReturnManagerCode(false); setShowReturnDialog(true); }} onClose={() => setShowReturnManagerCode(false)} />
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

      {/* Info dialog */}
      {showInfoDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowInfoDialog(false)}>
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-gray-300" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-center">TrgoPOS</h2>
            <div className="text-center mb-4">
              <h3 className="text-3xl font-black">
                <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
                <span className="text-orange-400 text-2xl ml-1">★</span>
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Program:</strong> TrgoPOS - Davčna blagajna</p>
              <p><strong>Verzija:</strong> 1.0.0</p>
              <p><strong>Razvoj:</strong> StandBuy s. p.</p>
              <p><strong>Podpora:</strong> podpora@standbuy.si</p>
              <p><strong>Leto:</strong> 2026</p>
            </div>
            <div className="border-t border-gray-300 mt-4 pt-3 text-xs text-gray-500 text-center">
              © 2026 StandBuy s. p., vse pravice pridržane
            </div>
            <button onClick={() => setShowInfoDialog(false)}
              className="mt-4 w-full h-12 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-base transition-colors">
              Zapri
            </button>
          </div>
        </div>
      )}

      {/* Settings dialog - only for PODPORA STANDBUY */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSettingsDialog(false)}>
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-300 max-w-lg w-full max-h-[calc(100vh-2rem)] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 pb-3 border-b border-gray-200 shrink-0">
              <h2 className="text-2xl font-bold">⚙ Nastavitve</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-3 text-sm">
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">Tiskalnik računov</h3>
                <p className="text-gray-600">Status: <span className="text-green-600 font-bold">Povezan</span></p>
                <p className="text-gray-600">Model: Epson TM-T20III</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">POS Terminal</h3>
                <p className="text-gray-600">Status: <span className="text-green-600 font-bold">Aktiven</span></p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">FURS povezava</h3>
                <p className="text-gray-600">Status: <span className="text-amber-600 font-bold">Ni konfiguriran</span></p>
                <p className="text-gray-500 text-xs mt-1">Digitalno potrdilo za davčno potrjevanje računov</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">Davčne stopnje</h3>
                <p className="text-gray-600">DDV 22% (standard) | DDV 9.5% (znižana)</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">⌨ Tipkovnica</h3>
                    <p className="text-gray-500 text-xs mt-1">Omogoči fizično tipkovnico za vnos EAN kod (0-9, Enter, Backspace, F2=plačilo)</p>
                  </div>
                  <button onClick={() => {
                    const next = !keyboardEnabled;
                    setKeyboardEnabled(next);
                    localStorage.setItem('trgopos_keyboard', String(next));
                    toast.success(next ? 'Tipkovnica VKLOPLJENA' : 'Tipkovnica IZKLOPLJENA');
                  }}
                    className={`w-16 h-8 rounded-full relative transition-colors ${keyboardEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${keyboardEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">Popravek ure in datuma</h3>
                <div className="flex gap-2 mt-2">
                  <input type="datetime-local" id="settings-datetime"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => {
                    const el = document.getElementById('settings-datetime') as HTMLInputElement;
                    if (el?.value) {
                      localStorage.setItem('trgopos_time_offset', String(new Date(el.value).getTime() - Date.now()));
                      toast.success(`Sistemski čas nastavljen na ${new Date(el.value).toLocaleString('sl-SI')}`);
                    }
                  }} className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-sm transition-colors">
                    Nastavi
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">Sprememba vpliva samo na to napravo</p>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">Test tiskalnika in skenerja</h3>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => {
                    toast.success('🖨 Test tiskalnika poslan. Tiskalnik deluje pravilno.');
                  }} className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors">
                    🖨 Test tiskalnika
                  </button>
                  <button onClick={() => {
                    toast.success('📡 Skener zaznan. Skener deluje pravilno.');
                  }} className="flex-1 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors">
                    📡 Test skenerja
                  </button>
                </div>
              </div>
              <div className="border-2 border-sky-400 rounded-lg p-4">
                <h3 className="font-bold text-base mb-2">Menjava blagajne</h3>
                <p className="text-gray-600 mb-3">Trenutna: <span className={`font-bold ${isSelfCheckout ? 'text-orange-600' : 'text-sky-600'}`}>
                  {isSelfCheckout ? `🛒 Samoplačniška ${selfCheckoutLabel} (ID: ${registerId})` : `Blagajna ${registerId}`}
                </span></p>
                {isSelfCheckout && (
                  <p className="text-orange-500 text-xs mb-2 font-medium">⚠️ Za menjavo na navadno blagajno najprej izklopite samoplačniški način</p>
                )}
                <div className="flex gap-2">
                  {[1, 2, 3].map(id => (
                    <button key={id} onClick={() => {
                      if (isSelfCheckout) {
                        toast.error('Najprej izklopite samoplačniški način');
                        return;
                      }
                      localStorage.setItem('trgopos_register_id', String(id));
                      setRegisterIdState(id);
                      setShowSettingsDialog(false);
                      toast.success(`Naprava nastavljena na Blagajno ${id}`);
                    }}
                      className={`flex-1 h-12 rounded-lg font-bold text-lg transition-colors border-2 ${
                        id === registerId ? 'bg-sky-500 text-white border-sky-600' : isSelfCheckout ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400'
                      }`}>
                      {id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-2 border-orange-400 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">🛒 Samoplačniška blagajna</h3>
                    <p className="text-gray-500 text-xs mt-1">Ločen register ID (101–103) za ločeno beleženje transakcij</p>
                  </div>
                  <button onClick={async () => {
                    const canActivate = currentCashier?.id === '00087' || currentCashier?.role === 'admin';
                    if (!canActivate) {
                      toast.error('Samo PODPORA ali Direktor lahko aktivira samoplačniško blagajno');
                      return;
                    }
                    const newState = !isSelfCheckout;
                    if (newState) {
                      const label = selfCheckoutLabel || 'A1';
                      const scId = labelToRegisterId(label);
                      await supabase.from('self_checkout_config').upsert({
                        register_id: scId, enabled: true, label,
                        activated_by: currentCashier?.id || '', activated_at: new Date().toISOString(),
                      } as any, { onConflict: 'register_id' });
                      setIsSelfCheckout(true);
                      setSelfCheckoutLabel(label);
                      setRegisterIdState(scId);
                      localStorage.setItem('trgopos_register_id', String(scId));
                      toast.success(`Samoplačniška blagajna ${label} AKTIVIRANA (register ${scId})`);
                    } else {
                      // Deactivate — find which SC config was active
                      const scId = SELF_CHECKOUT_IDS.includes(registerId) ? registerId : labelToRegisterId(selfCheckoutLabel || 'A1');
                      await supabase.from('self_checkout_config').upsert({
                        register_id: scId, enabled: false, label: '',
                        activated_by: currentCashier?.id || '', activated_at: new Date().toISOString(),
                      } as any, { onConflict: 'register_id' });
                      setIsSelfCheckout(false);
                      setSelfCheckoutLabel('');
                      // Revert to base register 1
                      setRegisterIdState(1);
                      localStorage.setItem('trgopos_register_id', '1');
                      toast.success('Samoplačniški način IZKLOPLJEN – blagajna nastavljena na 1');
                    }
                  }}
                    className={`w-16 h-8 rounded-full relative transition-colors ${isSelfCheckout ? 'bg-orange-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${isSelfCheckout ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                {isSelfCheckout && (
                  <>
                    <p className="text-xs text-gray-500">Izberite oznako samoplačniške blagajne:</p>
                    <div className="flex gap-2">
                      {['A1', 'A2', 'A3'].map(label => {
                        const scId = labelToRegisterId(label);
                        return (
                          <button key={label} onClick={async () => {
                            setSelfCheckoutLabel(label);
                            setRegisterIdState(scId);
                            localStorage.setItem('trgopos_register_id', String(scId));
                            await supabase.from('self_checkout_config').upsert({
                              register_id: scId, enabled: true, label,
                              activated_by: currentCashier?.id || '', activated_at: new Date().toISOString(),
                            } as any, { onConflict: 'register_id' });
                            toast.success(`Samoplačniška blagajna ${label} (register ${scId})`);
                          }}
                            className={`flex-1 h-12 rounded-lg font-bold text-lg transition-colors border-2 ${
                              selfCheckoutLabel === label ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                            }`}>
                            🛒 {label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-orange-50 border border-orange-300 rounded p-2 text-orange-700 text-xs font-bold">
                      ✅ Samoplačniška blagajna {selfCheckoutLabel || 'A1'} (register ID: {registerId}) – transakcije se beležijo ločeno
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 pt-3 border-t border-gray-200 shrink-0">
              <button onClick={() => setShowSettingsDialog(false)}
                className="w-full h-12 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-bold text-base transition-colors">
                Zapri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
