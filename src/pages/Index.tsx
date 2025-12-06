import { useState, useCallback } from "react";
import { toast } from "sonner";
import { CartItem, POSScreen, Transaction } from "@/types/pos";
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
import { ShoppingCart } from "lucide-react";

// Sample products database
const products: Record<string, { name: string; price: number }> = {
  '001': { name: 'Mleko 1L', price: 1.29 },
  '002': { name: 'Kruh beli', price: 1.49 },
  '003': { name: 'Maslo 250g', price: 2.89 },
  '004': { name: 'Jabolka 1kg', price: 1.99 },
  '005': { name: 'Jogurt naravni', price: 0.89 },
  '006': { name: 'Piščančje prsi 500g', price: 5.49 },
  '007': { name: 'Testenine 500g', price: 1.19 },
  '008': { name: 'Paradižnikova omaka', price: 1.79 },
  '009': { name: 'Voda 1.5L', price: 0.49 },
  '010': { name: 'Čokolada mlečna', price: 1.99 },
};

const Index = () => {
  const [screen, setScreen] = useState<POSScreen>('main');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = cartItems.reduce((sum, item) => {
    if (item.discount && item.originalPrice) {
      return sum + (item.originalPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
  const total = subtotal;

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

    const product = products[inputValue.padStart(3, '0')];
    if (product) {
      const existingIndex = cartItems.findIndex(item => item.plu === inputValue.padStart(3, '0'));
      
      if (existingIndex >= 0) {
        const newItems = [...cartItems];
        newItems[existingIndex].quantity += 1;
        setCartItems(newItems);
      } else {
        const newItem: CartItem = {
          id: Date.now().toString(),
          plu: inputValue.padStart(3, '0'),
          name: product.name,
          price: product.price,
          quantity: 1,
        };
        setCartItems(prev => [...prev, newItem]);
      }
      toast.success(`${product.name} dodan`);
    } else {
      toast.error('Artikel ni najden');
    }
    setInputValue("");
  };

  const handleDiscount = () => {
    toast.info('Popust na račun - funkcija v razvoju');
  };

  const handleItemDiscount = () => {
    if (selectedItemIndex === null) {
      toast.warning('Izberite artikel');
      return;
    }
    const newItems = [...cartItems];
    const item = newItems[selectedItemIndex];
    item.originalPrice = item.price;
    item.discount = 10;
    item.price = item.price * 0.9;
    setCartItems(newItems);
    toast.success('10% popust dodan');
  };

  const handlePriceChange = () => {
    toast.info('Sprememba cene - funkcija v razvoju');
  };

  const handleDelayPayment = () => {
    toast.info('Odlog plačila - funkcija v razvoju');
  };

  const handleVoidItem = () => {
    if (selectedItemIndex === null) {
      toast.warning('Izberite artikel za storno');
      return;
    }
    const newItems = cartItems.filter((_, i) => i !== selectedItemIndex);
    setCartItems(newItems);
    setSelectedItemIndex(null);
    toast.success('Artikel storniran');
  };

  const handleVoidTransaction = () => {
    setCartItems([]);
    setSelectedItemIndex(null);
    toast.success('Račun storniran');
  };

  const handleReturn = () => {
    toast.info('Vračilo - funkcija v razvoju');
  };

  const handleLoyaltyCard = () => {
    toast.info('Vnos članske kartice - funkcija v razvoju');
  };

  const handlePriceCheck = () => {
    toast.info('Informacija o ceni - funkcija v razvoju');
  };

  const handleCoupon = () => {
    toast.info('Uporaba kupona - funkcija v razvoju');
  };

  const handleReceipt = () => {
    toast.info('Kopija računa - funkcija v razvoju');
  };

  const handlePackaging = () => {
    toast.info('Embalaža - funkcija v razvoju');
  };

  const handleVatReceipt = () => {
    toast.info('DDV račun - funkcija v razvoju');
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
    };
    setLastTransaction(transaction);
    setScreen('complete');
    toast.success('Račun zaključen');
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
    };
    setLastTransaction(transaction);
    setScreen('complete');
    toast.success('Račun zaključen');
  };

  const handleNewTransaction = () => {
    setCartItems([]);
    setSelectedItemIndex(null);
    setInputValue("");
    setLastTransaction(null);
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <POSHeader />
      
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
              
              <div className="pos-panel p-4 flex-1 overflow-y-auto">
                <ActionButtons
                  onDiscount={handleDiscount}
                  onItemDiscount={handleItemDiscount}
                  onPriceChange={handlePriceChange}
                  onDelayPayment={handleDelayPayment}
                  onVoidItem={handleVoidItem}
                  onVoidTransaction={handleVoidTransaction}
                  onReturn={handleReturn}
                  onLoyaltyCard={handleLoyaltyCard}
                  onPriceCheck={handlePriceCheck}
                  onCoupon={handleCoupon}
                  onReceipt={handleReceipt}
                  onPackaging={handlePackaging}
                  onVatReceipt={handleVatReceipt}
                  hasItems={cartItems.length > 0}
                />
              </div>
            </div>

            {/* Right panel - Keypad */}
            <div className="col-span-3 flex flex-col gap-4">
              <InputDisplay value={inputValue} label="Vnos" />
              
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
      </main>
    </div>
  );
};

export default Index;
