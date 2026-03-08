import { useState, useEffect, useRef } from "react";
import { Delete, Loader2 } from "lucide-react";
import { CartItem } from "@/types/pos";
import GiftCardRedeemFlow from "./GiftCardRedeemFlow";

interface PaymentTabProps {
  cartItems: CartItem[];
  subtotal: number;
  total: number;
  totalDiscount: number;
  receiptNumber?: string;
  registerId?: number;
  onCashPayment: (amountPaid: number) => void;
  onCardPayment: () => void;
  onInvoice: () => void;
  onBack: () => void;
  onBonPayment?: (code: string, amount: number) => void;
  onGiftCardPayment?: (code: string) => void;
  onGiftCardPointsRedeem?: (cardId: string, pointsUsed: number, discountAmount: number) => void;
  onGiftCardBalancePayment?: (cardId: string, amount: number) => void;
  onGiftCardPartialBalance?: (cardId: string, cardAmount: number, remainingTotal: number) => void;
  keyboardEnabled?: boolean;
}

const PaymentTab = ({ cartItems, subtotal, total, totalDiscount, receiptNumber, registerId, onCashPayment, onCardPayment, onInvoice, onBack, onBonPayment, onGiftCardPayment, onGiftCardPointsRedeem, onGiftCardBalancePayment, onGiftCardPartialBalance, keyboardEnabled }: PaymentTabProps) => {
  const [step, setStep] = useState<'select' | 'cash' | 'card' | 'bon' | 'giftcard'>('select');
  const [cardWaiting, setCardWaiting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [bonCode, setBonCode] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardPinStep, setGiftCardPinStep] = useState(false);
  const lastEnterRef = useRef<number>(0);
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountPaid = parseFloat(inputValue) || 0;
  const change = amountPaid - total;

  const handleKeyPress = (key: string) => {
    if (step === 'bon') setBonCode(prev => prev + key);
    else setInputValue(prev => prev + key);
  };
  const handleDelete = () => {
    if (step === 'bon') setBonCode(prev => prev.slice(0, -1));
    else { setInputValue(prev => prev.slice(0, -1)); setConfirmed(false); }
  };

  const handleBanknote = (value: number) => {
    const current = parseFloat(inputValue) || 0;
    setInputValue((current + value).toFixed(2));
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (amountPaid > 0) setConfirmed(true);
  };

  // Keyboard support for payment screens
  useEffect(() => {
    if (!keyboardEnabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (step === 'select') {
        // On selection screen: 1=Gotovina, 2=Kartica, Escape=Nazaj
        if (e.key === '1') { e.preventDefault(); setStep('cash'); }
        else if (e.key === '2') { e.preventDefault(); setStep('card'); }
        else if (e.key === '3') { e.preventDefault(); setGiftCardCode(''); setGiftCardPin(''); setGiftCardPinStep(false); setStep('giftcard'); }
        else if (e.key === 'Escape') { e.preventDefault(); onBack(); }
        return;
      }

      if (step === 'card') {
        if (e.key === 'Enter' && !cardWaiting) { e.preventDefault(); setCardWaiting(true); onCardPayment(); }
        else if (e.key === 'Escape') { e.preventDefault(); setCardWaiting(false); setStep('select'); }
        return;
      }

      if (step === 'bon') {
        if (e.key >= '0' && e.key <= '9') { e.preventDefault(); setBonCode(prev => prev + e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); setBonCode(prev => prev.slice(0, -1)); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const hasVoucherInCart = cartItems.some(i => i.name.toLowerCase().includes('bon') || i.name.toLowerCase().includes('darilni'));
          if (!hasVoucherInCart && bonCode.length >= 4 && onBonPayment) onBonPayment(bonCode, total);
        }
        else if (e.key === 'Escape') { e.preventDefault(); setStep('select'); }
        return;
      }

      if (step === 'giftcard') {
        if (e.key >= '0' && e.key <= '9') { e.preventDefault(); setGiftCardCode(prev => prev + e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); setGiftCardCode(prev => prev.slice(0, -1)); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          if (giftCardCode.length >= 8 && onGiftCardPayment) onGiftCardPayment(giftCardCode);
        }
        else if (e.key === 'Escape') { e.preventDefault(); setStep('select'); }
        return;
      }

      // Cash payment screen
      if (step === 'cash') {
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          setInputValue(prev => prev + e.key);
          setConfirmed(false);
        } else if (e.key === '.' || e.key === ',') {
          e.preventDefault();
          setInputValue(prev => prev + '.');
          setConfirmed(false);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setInputValue(prev => prev.slice(0, -1));
          setConfirmed(false);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const now = Date.now();
          const currentAmountPaid = parseFloat(inputValue) || 0;
          if (confirmed && currentAmountPaid >= total && (now - lastEnterRef.current) < 800) {
            // Double Enter = Zaključi, tiskaj račun
            onCashPayment(currentAmountPaid);
          } else if (currentAmountPaid > 0) {
            // Single Enter = Potrdi
            setConfirmed(true);
          }
          lastEnterRef.current = now;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setStep('select');
        }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardEnabled, step, cardWaiting, inputValue, confirmed, bonCode, giftCardCode, total, cartItems, onCashPayment, onCardPayment, onBack, onBonPayment, onGiftCardPayment]);

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  const bg = "linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)";

  // Payment method selection - matches Diapozitiv4-6
  if (step === 'select') {
    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        {/* LEFT - Receipt list */}
        <div className="flex-[4] flex flex-col">
          <div className="flex items-center border-2 border-gray-600 bg-white rounded-t">
            <div className="p-2 border-r border-gray-400"><span className="text-xl">▼</span></div>
            <div className="flex-1 px-3 py-2 text-sm font-medium">
              <div>Datum: {new Date().toLocaleDateString('sl-SI')}</div>
              <div>Številka računa:</div>
            </div>
            <div className="p-2 border-l border-gray-400"><span className="text-xl">▲</span></div>
          </div>
          <div className="flex-1 border-2 border-t-0 border-gray-600 bg-white overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="px-3 py-2 border-b border-gray-200 text-sm flex justify-between">
                <span>{item.name}</span>
                <span>{item.quantity}x {formatPrice(item.price * item.quantity)} €</span>
              </div>
            ))}
          </div>
          <div className="border-2 border-t-0 border-gray-600 bg-white rounded-b px-3 py-2 flex justify-between items-center">
            <span className="font-bold text-sm">Skupini znesek v EUR:</span>
            <span className="font-bold text-lg font-mono">{formatPrice(total)}</span>
          </div>
        </div>

        {/* RIGHT - Payment buttons in 2 rows + invoice + back */}
        <div className="flex-[6] flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setStep('cash')}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Gotovina
            </button>
            <button onClick={() => setStep('card')}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Kartica
            </button>
            <button onClick={() => { setGiftCardCode(''); setGiftCardPin(''); setGiftCardPinStep(false); setStep('giftcard'); }}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Darilna<br/>kartica
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setStep('bon')}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Darilni bon
            </button>
            <button
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Dobropis<br/>podjetja
            </button>
          </div>

          <div className="flex-1" />

          <button onClick={onInvoice}
            className="h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-base transition-colors w-48">
            Izpiši fakturo
          </button>

          <button onClick={onBack}
            className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xl flex items-center justify-center gap-2 transition-colors w-48 mx-auto">
            ← Nazaj
          </button>
        </div>
      </div>
    );
  }

  // Card terminal - matches Diapozitiv5-7 (blue overlay with POTRDI + PREKLIČI)
  if (step === 'card') {
    return (
      <div className="h-full flex gap-3 p-3 relative overflow-hidden" style={{ background: bg }}>
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-sky-200 border-2 border-gray-500 rounded-xl p-8 text-center min-w-[420px]">
            <h2 className="text-2xl font-bold tracking-[0.3em] mb-6">POS TERMINAL – NAKUP</h2>
            <div className="border-2 border-gray-600 bg-white rounded-lg p-8 mb-6">
              <p className="font-bold text-lg mb-4">ZNESEK (EUR)</p>
              <p className="text-5xl font-bold">{formatPrice(total)} €</p>
            </div>
            {cardWaiting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
                <p className="font-bold text-gray-700">Čakam na potrditev terminala...</p>
                <button onClick={() => { setCardWaiting(false); setStep('select'); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-3 rounded-lg transition-colors mt-2">
                  PREKLIČI
                </button>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <button onClick={() => { setCardWaiting(true); onCardPayment(); }}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-3 rounded-lg transition-colors">
                  POTRDI
                </button>
                <button onClick={() => setStep('select')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-3 rounded-lg transition-colors">
                  PREKLIČI
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bon payment
  if (step === 'bon') {
    const hasVoucherInCart = cartItems.some(i => i.name.toLowerCase().includes('bon') || i.name.toLowerCase().includes('darilni'));

    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-2">
          <div className="font-bold text-lg">Plačilo z darilnim bonom</div>
          <div className="border-t border-dashed border-gray-400 pt-2" />
          <div>Skupaj za plačilo: <strong>{formatPrice(total)} €</strong></div>
          {hasVoucherInCart && (
            <div className="bg-red-100 border border-red-400 rounded p-3 text-red-700 font-bold text-sm mt-4">
              ⚠ Z bonom NI MOGOČE plačati nakupa novega bona!
            </div>
          )}
        </div>

        <div className="flex-[6] flex flex-col gap-3">
          <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
            <h3 className="font-bold text-base mb-2">Vnesi kodo darilnega bona:</h3>
            <div className="border-2 border-gray-600 bg-gray-50 rounded-lg p-3 font-mono text-xl min-h-[2rem]">{bonCode}</div>
          </div>

          <div className="flex gap-3 flex-1">
            <div className="flex flex-col gap-2 flex-1">
              {numKeys.map((row, ri) => (
                <div key={ri} className="flex gap-2 flex-1">
                  {row.map(key => (
                    <button key={key} onClick={() => handleKeyPress(key)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex gap-2 flex-1">
                <button onClick={() => handleKeyPress('0')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">0</button>
                <button onClick={() => handleKeyPress(',')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">,</button>
                <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <Delete className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-36">
              <button onClick={() => setStep('select')}
                className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
                ← Nazaj
              </button>
              <button onClick={() => {
                if (hasVoucherInCart) return;
                if (bonCode.length >= 4 && onBonPayment) onBonPayment(bonCode, total);
              }}
                disabled={bonCode.length < 4 || hasVoucherInCart}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center disabled:opacity-40 transition-colors p-2">
                Potrdi bon
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gift card payment - full flow with PIN and points
  if (step === 'giftcard') {
    return (
      <GiftCardRedeemFlow
        total={total}
        registerId={registerId || 1}
        onApplyDiscount={(pointsUsed, discountAmount, cardId) => {
          if (onGiftCardPointsRedeem) onGiftCardPointsRedeem(cardId, pointsUsed, discountAmount);
          setStep('select');
        }}
        onPayWithBalance={(cardId, amount) => {
          if (onGiftCardBalancePayment) onGiftCardBalancePayment(cardId, amount);
        }}
        onPartialBalancePayment={(cardId, cardAmount, remainingTotal) => {
          if (onGiftCardPartialBalance) onGiftCardPartialBalance(cardId, cardAmount, remainingTotal);
        }}
        onCancel={() => setStep('select')}
      />
    );
  }

  // Cash payment - matches Diapozitiv6-6
  const now = new Date();
  return (
    <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
      {/* LEFT - Receipt summary */}
      <div className="flex-[3] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="font-bold text-lg">Račun:</span>
          <span className="font-bold">št. rač. / datum</span>
        </div>
        <div>Znesek računa: <strong>{formatPrice(subtotal)}</strong></div>
        {totalDiscount > 0 && <div>Znesek popusta: <strong className="text-red-600">-{formatPrice(totalDiscount)}</strong></div>}
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div className="font-bold">Skupaj za plačilo: {formatPrice(total)}</div>
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div>Že plačano: {confirmed ? formatPrice(amountPaid) : ''}</div>
        <div>Ostalo za plačilo: {confirmed ? formatPrice(Math.max(0, total - amountPaid)) : formatPrice(total)}</div>
      </div>

      {/* RIGHT */}
      <div className="flex-[7] flex flex-col gap-3">
        {/* Za plačilo panel */}
        <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
          <h3 className="font-bold text-xl mb-1">Za plačilo:</h3>
          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-sm">
            <div>Plačano: {confirmed ? formatPrice(amountPaid) + ' €' : ''}</div>
            <div>Vračilo: {confirmed && change > 0 ? formatPrice(change) + ' €' : ''}</div>
          </div>
        </div>

        <div className="flex gap-3 flex-1">
          {/* BANKOVCI - matching image exactly */}
          <div className="flex flex-col gap-2 w-44">
            <div className="border-2 border-gray-600 bg-white rounded-lg p-2">
              <h4 className="font-bold text-center text-sm tracking-[0.2em] mb-2">B A N K O V C I</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {[200, 100, 50, 20, 10, 5].map(v => (
                  <button key={v} onClick={() => handleBanknote(v)}
                    className="h-10 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-lg transition-colors">
                    {v}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1.5 justify-center">
                {[2, 1].map(v => (
                  <button key={v} onClick={() => handleBanknote(v)}
                    className="w-14 h-10 bg-blue-700 hover:bg-blue-800 text-white rounded-full font-bold text-lg transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input display + Numpad */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="border-2 border-gray-600 bg-white rounded-lg p-3">
              <div className="font-mono text-xl font-bold text-gray-800 min-h-[1.5rem]">{inputValue || ''}</div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {numKeys.map((row, ri) => (
                <div key={ri} className="flex gap-1.5 flex-1">
                  {row.map(key => (
                    <button key={key} onClick={() => handleKeyPress(key)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex gap-1.5 flex-1">
                <button onClick={() => handleKeyPress('0')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">0</button>
                <button onClick={() => handleKeyPress('.')} className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">,</button>
                <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <Delete className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex flex-col gap-3 w-36">
            <button onClick={() => setStep('select')}
              className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
              ← Nazaj
            </button>
            <button onClick={handleConfirm}
              disabled={amountPaid <= 0}
              className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg flex items-center justify-center disabled:opacity-40 transition-colors">
              Potrdi
            </button>
            <button onClick={() => { if (confirmed && amountPaid >= total) onCashPayment(amountPaid); }}
              disabled={!confirmed || amountPaid < total}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center disabled:opacity-40 transition-colors p-2">
              Zaključi,<br />tiskaj račun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTab;
