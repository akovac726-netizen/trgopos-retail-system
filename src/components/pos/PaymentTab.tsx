import { useState, useEffect, useRef } from "react";
import { Delete, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CartItem } from "@/types/pos";
import GiftCardRedeemFlow from "./GiftCardRedeemFlow";
import bargeldImg from "@/assets/bargeld-rueckgabe.png";

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
  onBonPayment?: (codes: string[]) => void;
  onGiftCardPayment?: (code: string) => void;
  onGiftCardPointsRedeem?: (cardId: string, pointsUsed: number, discountAmount: number) => void;
  onGiftCardBalancePayment?: (cardId: string, amount: number) => void;
  onGiftCardPartialBalance?: (cardId: string, cardAmount: number, remainingTotal: number) => void;
  keyboardEnabled?: boolean;
  isSelfCheckout?: boolean;
}

const PaymentTab = ({ cartItems, subtotal, total, totalDiscount, receiptNumber, registerId, onCashPayment, onCardPayment, onInvoice, onBack, onBonPayment, onGiftCardPayment, onGiftCardPointsRedeem, onGiftCardBalancePayment, onGiftCardPartialBalance, keyboardEnabled, isSelfCheckout }: PaymentTabProps) => {
  const [step, setStep] = useState<'select' | 'cash' | 'card' | 'bon' | 'giftcard'>('select');
  const [cardWaiting, setCardWaiting] = useState(false);
  const [cardType, setCardType] = useState<'debit' | 'credit' | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [bonCode, setBonCode] = useState("");
  const [addedBonCodes, setAddedBonCodes] = useState<string[]>([]);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardPinStep, setGiftCardPinStep] = useState(false);
  const lastEnterRef = useRef<number>(0);
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountPaid = parseFloat(inputValue.replace(',', '.')) || 0;
  const change = Math.round((amountPaid - total) * 100) / 100;

  const handleKeyPress = (key: string) => {
    if (step === 'bon') setBonCode(prev => prev + key);
    else setInputValue(prev => prev + key);
  };
  const handleDelete = () => {
    if (step === 'bon') setBonCode(prev => prev.slice(0, -1));
    else { setInputValue(prev => prev.slice(0, -1)); setConfirmed(false); }
  };

  const handleConfirm = () => {
    const paid = parseFloat(inputValue.replace(',', '.')) || 0;
    if (paid > 0) {
      if (paid < total) {
        // Insufficient funds - show warning and go back to payment selection
        toast.warning(`Premalo gotovine! Vnesli ste ${formatPrice(paid)} €, račun znaša ${formatPrice(total)} €. Izberite dodatno plačilno sredstvo.`);
        setStep('select');
        setInputValue("");
        setConfirmed(false);
        return;
      }
      setConfirmed(true);
      setShowChangeDialog(true);
    }
  };

  // Keyboard support
  useEffect(() => {
    if (!keyboardEnabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (step === 'select') {
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
          if (bonCode.length >= 4 && !addedBonCodes.includes(bonCode)) {
            setAddedBonCodes(prev => [...prev, bonCode]); setBonCode("");
          }
        }
        else if (e.key === 'Escape') { e.preventDefault(); setStep('select'); }
        return;
      }
      if (step === 'giftcard') {
        if (e.key >= '0' && e.key <= '9') { e.preventDefault(); setGiftCardCode(prev => prev + e.key); }
        else if (e.key === 'Backspace') { e.preventDefault(); setGiftCardCode(prev => prev.slice(0, -1)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (giftCardCode.length >= 8 && onGiftCardPayment) onGiftCardPayment(giftCardCode); }
        else if (e.key === 'Escape') { e.preventDefault(); setStep('select'); }
        return;
      }
      if (step === 'cash') {
        if (e.key >= '0' && e.key <= '9') { e.preventDefault(); setInputValue(prev => prev + e.key); setConfirmed(false); }
        else if (e.key === '.' || e.key === ',') { e.preventDefault(); setInputValue(prev => prev + '.'); setConfirmed(false); }
        else if (e.key === 'Backspace') { e.preventDefault(); setInputValue(prev => prev.slice(0, -1)); setConfirmed(false); }
        else if (e.key === 'Enter') {
          e.preventDefault();
          const now = Date.now();
          const currentAmountPaid = parseFloat(inputValue.replace(',', '.')) || 0;
          if (confirmed && currentAmountPaid >= total && (now - lastEnterRef.current) < 800) {
            onCashPayment(currentAmountPaid);
          } else if (currentAmountPaid > 0) { handleConfirm(); }
          lastEnterRef.current = now;
        } else if (e.key === 'Escape') { e.preventDefault(); setStep('select'); }
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardEnabled, step, cardWaiting, inputValue, confirmed, bonCode, addedBonCodes, giftCardCode, total, cartItems, onCashPayment, onCardPayment, onBack, onBonPayment, onGiftCardPayment]);

  const numKeys = [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']];
  const bg = '#e8f4f8';

  // LEFT panel - receipt info (shared across payment screens)
  const LeftPanel = () => (
    <div className="flex-[4] flex flex-col p-4">
      <div className="border-2 border-gray-800 bg-white p-4">
        <h2 className="text-2xl font-bold mb-4">Račun:</h2>
        <div className="space-y-2">
          <div className="flex justify-between border-2 border-gray-800 px-3 py-2">
            <span className="font-medium">Plačano:</span>
            <span className="font-bold">{confirmed ? formatPrice(amountPaid) : formatPrice(0)}</span>
          </div>
          <div className="flex justify-between border-2 border-gray-800 px-3 py-2">
            <span className="font-medium">Za plačati:</span>
            <span className="font-bold">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ===== PAYMENT SELECTION - matches Diapozitiv 6 =====
  if (step === 'select') {
    return (
      <div className="h-full flex overflow-hidden" style={{ background: bg }}>
        <LeftPanel />
        <div className="flex-[6] flex flex-col p-4">
          {/* Header: Plačilna sredstva with arrows */}
          <div className="flex items-center justify-between border-2 border-gray-800 bg-white px-4 py-3 mb-4">
            <span className="text-2xl font-bold">←</span>
            <h2 className="text-xl font-bold">Plačilna sredstva</h2>
            <span className="text-2xl font-bold">→</span>
          </div>

          {/* Three red gradient buttons */}
          <div className="space-y-3 mb-4">
            <button onClick={() => setStep('cash')}
              className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
              style={{ background: 'linear-gradient(180deg, #e05050, #a03030)' }}>
              <span className="text-3xl font-bold">€</span>
              <span>Plačilo z gotovino</span>
            </button>
            <button onClick={() => setStep('card')}
              className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
              style={{ background: 'linear-gradient(180deg, #d04545, #902828)' }}>
              <span className="text-3xl">▢</span>
              <span>Plačilo s kartico</span>
            </button>
            <button onClick={() => onInvoice()}
              className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
              style={{ background: 'linear-gradient(180deg, #c03535, #802020)' }}>
              <span className="text-3xl">☰</span>
              <span>Drugi način plačila</span>
            </button>
          </div>

          {/* Bottom row: Zurück + Polovično plačilo */}
          <div className="flex items-center gap-4 mb-4">
            <button onClick={onBack}
              className="px-6 py-3 border-2 border-gray-800 bg-white hover:bg-gray-100 font-bold text-base transition-colors rounded">
              &lt; Zurück
            </button>
            <div className="flex-1" />
            <button onClick={() => setShowPartialDialog(true)}
              className="px-6 py-3 rounded-lg font-bold text-base text-white border-2 border-orange-600 transition-colors"
              style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
              Polovično<br/>plačilo
            </button>
          </div>

          <div className="flex-1" />

          {/* Pomoč button */}
          <div className="flex justify-end">
            <button className="px-4 py-2 border-2 border-orange-500 rounded-lg font-bold text-sm transition-colors"
              style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)', color: 'white' }}>
              😊 Pomoč
            </button>
          </div>
        </div>

        {/* Partial payment dialog overlay */}
        {showPartialDialog && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPartialDialog(false)}>
            <div className="bg-white border-2 border-gray-800 rounded-xl p-6 min-w-[340px]" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-center mb-4 border-b-2 border-gray-800 pb-2">Polovično plačilo</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setShowPartialDialog(false); /* TODO: partial gotovina+kartica */ }}
                  className="h-14 rounded-lg font-bold text-sm text-white border-2 border-orange-500 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
                  Gotovina in<br/>kartica
                </button>
                <button onClick={() => { setShowPartialDialog(false); /* TODO: partial kartica+kartica */ }}
                  className="h-14 rounded-lg font-bold text-sm text-white border-2 border-orange-500 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
                  Kartica in<br/>kartica
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== CASH PAYMENT - matches Diapozitiv 8 =====
  if (step === 'cash') {
    return (
      <div className="h-full flex overflow-hidden" style={{ background: bg }}>
        <LeftPanel />
        <div className="flex-[6] flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center gap-3 border-2 border-gray-800 bg-white px-4 py-3 mb-4">
            <span className="text-3xl font-bold">€</span>
            <h2 className="text-xl font-bold">Plačilo z gotovino</h2>
          </div>

          {/* Input display + numpad + action buttons */}
          <div className="border-2 border-gray-800 bg-white rounded-lg p-3 flex-1 flex flex-col">
            {/* Input field */}
            <div className="border-2 border-gray-800 bg-white rounded-lg p-3 mb-3">
              <div className="font-mono text-xl font-bold text-gray-800 min-h-[1.5rem]">{inputValue || ''}</div>
            </div>

            {/* Numpad + right actions */}
            <div className="flex gap-2 flex-1">
              {/* Numpad 3x4 */}
              <div className="flex-[3] flex flex-col gap-1.5">
                {numKeys.map((row, ri) => (
                  <div key={ri} className="flex gap-1.5 flex-1">
                    {row.map(key => (
                      <button key={key} onClick={() => handleKeyPress(key)}
                        className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                        style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-1.5 flex-1">
                  <button onClick={() => handleKeyPress('0')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>0</button>
                  <button onClick={() => handleKeyPress(',')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>,</button>
                  <button onClick={handleDelete}
                    className="flex-1 rounded-lg font-bold text-base text-white border-2 border-red-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #e08080, #c05050)' }}>del</button>
                </div>
              </div>

              {/* Right column: PREKLIČI + Zaključi */}
              <div className="flex-[1] flex flex-col gap-1.5">
                <button onClick={() => { setStep('select'); setInputValue(""); setConfirmed(false); }}
                  className="flex-1 rounded-lg font-bold text-sm text-white border-2 border-red-600 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>
                  PREKLIČI
                </button>
                <button onClick={handleConfirm}
                  disabled={amountPaid <= 0 || amountPaid < total}
                  className="flex-[2] rounded-lg font-bold text-sm text-gray-800 border-2 border-green-400 transition-colors disabled:opacity-40 flex flex-col items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(180deg, #d4e8c0, #b0c898)' }}>
                  <span>Zaključi,</span>
                  <span>tiskaj račun</span>
                  <span className="text-lg">☑</span>
                </button>
              </div>
            </div>
          </div>

          {/* Zurück */}
          <button onClick={() => { setStep('select'); setInputValue(""); setConfirmed(false); }}
            className="mt-3 px-6 py-3 border-2 border-gray-800 bg-white hover:bg-gray-100 font-bold text-base transition-colors rounded self-start">
            &lt; Zurück
          </button>

          <div className="flex-1" />
          <div className="flex justify-end mt-2">
            <button className="px-4 py-2 border-2 border-orange-500 rounded-lg font-bold text-sm transition-colors"
              style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)', color: 'white' }}>
              😊 Pomoč
            </button>
          </div>
        </div>

        {/* Change dialog - matches Diapozitiv 9 */}
        {showChangeDialog && amountPaid >= total && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowChangeDialog(false)}>
            <div className="bg-white border-2 border-gray-800 rounded-xl overflow-hidden flex" onClick={e => e.stopPropagation()} style={{ minWidth: 500 }}>
              <img src={bargeldImg} alt="Bargeldrückgabe" className="w-48 h-48 object-cover" />
              <div className="flex-1 p-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-red-600 mb-3 border-b-2 border-gray-800 pb-2">Bargeldrückgabe</h3>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">Znesek:</span>
                  <span className="font-bold text-2xl font-mono">{formatPrice(change > 0 ? change : 0)}</span>
                </div>
                <button onClick={() => { setShowChangeDialog(false); onCashPayment(amountPaid); }}
                  className="h-12 rounded-lg font-bold text-base text-gray-800 border-2 border-gray-800 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  ☑ Potrdi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== CARD PAYMENT - matches Diapozitiv 10 + 11 =====
  if (step === 'card') {
    return (
      <div className="h-full flex overflow-hidden" style={{ background: bg }}>
        <LeftPanel />
        <div className="flex-[6] flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center gap-3 border-2 border-gray-800 bg-white px-4 py-3 mb-4">
            <span className="text-3xl">▢</span>
            <h2 className="text-xl font-bold">Plačilo s kartico</h2>
          </div>

          {/* Card type selection */}
          <div className="flex gap-3 mb-4">
            <button onClick={() => setCardType('debit')}
              className={`flex-1 h-12 rounded-lg font-bold text-sm border-2 transition-colors ${cardType === 'debit' ? 'bg-sky-200 border-sky-600' : 'bg-white border-gray-400 hover:bg-gray-50'}`}>
              Gotovinska<br/>kartica
            </button>
            <button onClick={() => setCardType('credit')}
              className={`flex-1 h-12 rounded-lg font-bold text-sm border-2 transition-colors ${cardType === 'credit' ? 'bg-sky-200 border-sky-600' : 'bg-white border-gray-400 hover:bg-gray-50'}`}>
              Kreditna<br/>kartica
            </button>
          </div>

          {/* Numpad area */}
          <div className="border-2 border-gray-800 bg-white rounded-lg p-3 flex-1 flex flex-col">
            <div className="border-2 border-gray-800 bg-white rounded-lg p-3 mb-3">
              <div className="font-mono text-xl font-bold text-gray-800 min-h-[1.5rem]">{formatPrice(total)}</div>
            </div>

            <div className="flex gap-2 flex-1">
              <div className="flex-[3] flex flex-col gap-1.5">
                {numKeys.map((row, ri) => (
                  <div key={ri} className="flex gap-1.5 flex-1">
                    {row.map(key => (
                      <button key={key}
                        className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                        style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-1.5 flex-1">
                  <button className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>0</button>
                  <button className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>,</button>
                  <button className="flex-1 rounded-lg font-bold text-base text-white border-2 border-red-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #e08080, #c05050)' }}>del</button>
                </div>
              </div>

              <div className="flex-[1] flex flex-col gap-1.5">
                <button onClick={() => { setCardWaiting(false); setStep('select'); setCardType(null); }}
                  className="flex-1 rounded-lg font-bold text-sm text-white border-2 border-red-600 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>
                  PREKLIČI
                </button>
                <button onClick={() => { setCardWaiting(true); onCardPayment(); }}
                  disabled={cardWaiting}
                  className="flex-[2] rounded-lg font-bold text-sm text-gray-800 border-2 border-green-400 transition-colors disabled:opacity-40 flex flex-col items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(180deg, #d4e8c0, #b0c898)' }}>
                  <span>Zaključi,</span>
                  <span>tiskaj račun</span>
                  <span className="text-lg">☑</span>
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => { setStep('select'); setCardType(null); }}
            className="mt-3 px-6 py-3 border-2 border-gray-800 bg-white hover:bg-gray-100 font-bold text-base transition-colors rounded self-start">
            &lt; Zurück
          </button>

          <div className="flex-1" />
          <div className="flex justify-end mt-2">
            <button className="px-4 py-2 border-2 border-orange-500 rounded-lg font-bold text-sm transition-colors"
              style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)', color: 'white' }}>
              😊 Pomoč
            </button>
          </div>
        </div>

        {/* POS Terminal overlay - matches Diapozitiv 11 */}
        {cardWaiting && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div className="bg-sky-100 border-2 border-gray-800 rounded-xl p-8 text-center min-w-[420px]">
              <h2 className="text-2xl font-bold tracking-[0.3em] mb-6">P O S  T E R M I N A L – N A K U P</h2>
              <div className="border-2 border-gray-600 rounded-lg p-6 mb-6" style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                <p className="font-bold text-lg mb-3">ZNESEK (EUR)</p>
                <p className="text-5xl font-bold">{formatPrice(total)} €</p>
              </div>
              <button onClick={() => { setCardWaiting(false); setStep('select'); }}
                className="px-8 py-3 rounded-lg font-bold text-xl text-white border-2 border-red-700 transition-colors"
                style={{ background: 'linear-gradient(180deg, #e05050, #c02020)' }}>
                PREKLIČI
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== BON PAYMENT (unchanged logic) =====
  if (step === 'bon') {
    const hasVoucherInCart = cartItems.some(i => i.name.toLowerCase().includes('bon') || i.name.toLowerCase().includes('darilni'));
    const bonDiscount = addedBonCodes.length * 10;

    return (
      <div className="h-full flex gap-3 p-3 overflow-hidden" style={{ background: bg }}>
        <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-2">
          <div className="font-bold text-lg">Plačilo z darilnim bonom</div>
          <div>Skupaj: <strong>{formatPrice(total)} €</strong></div>
          {addedBonCodes.length > 0 && (
            <>
              <div className="font-bold text-purple-700">Dodani boni ({addedBonCodes.length}x 10,00 €):</div>
              {addedBonCodes.map((c, i) => (
                <div key={i} className="flex justify-between"><span className="font-mono text-xs">{c}</span>
                  <button onClick={() => setAddedBonCodes(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-xs font-bold">Odstrani</button>
                </div>
              ))}
              <div>Popust: <strong className="text-green-700">-{formatPrice(bonDiscount)} €</strong></div>
            </>
          )}
          {hasVoucherInCart && <div className="bg-red-100 border border-red-400 rounded p-3 text-red-700 font-bold text-sm">⚠ Z bonom NI MOGOČE plačati bona!</div>}
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
                  {row.map(key => (<button key={key} onClick={() => handleKeyPress(key)} className="flex-1 rounded-lg font-bold text-2xl border-2 border-sky-400" style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>{key}</button>))}
                </div>
              ))}
              <div className="flex gap-2 flex-1">
                <button onClick={() => handleKeyPress('0')} className="flex-1 rounded-lg font-bold text-2xl border-2 border-sky-400" style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>0</button>
                <button onClick={() => handleKeyPress(',')} className="flex-1 rounded-lg font-bold text-2xl border-2 border-sky-400" style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>,</button>
                <button onClick={handleDelete} className="flex-1 rounded-lg font-bold text-base text-white border-2 border-red-400" style={{ background: 'linear-gradient(180deg, #e08080, #c05050)' }}>del</button>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-36">
              <button onClick={() => { setStep('select'); setAddedBonCodes([]); setBonCode(""); }} className="h-14 rounded-lg font-bold text-sm text-white border-2 border-red-600" style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>← Nazaj</button>
              <button onClick={() => { if (bonCode.length >= 4 && !addedBonCodes.includes(bonCode)) { setAddedBonCodes(prev => [...prev, bonCode]); setBonCode(""); } }}
                disabled={bonCode.length < 4 || hasVoucherInCart || addedBonCodes.includes(bonCode)} className="h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm disabled:opacity-40">+ Dodaj bon</button>
              <button onClick={() => { if (addedBonCodes.length > 0 && onBonPayment) onBonPayment(addedBonCodes); }}
                disabled={addedBonCodes.length === 0} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm disabled:opacity-40">Potrdi plačilo</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gift card
  if (step === 'giftcard') {
    return (
      <GiftCardRedeemFlow total={total} registerId={registerId || 1} isSelfCheckout={isSelfCheckout}
        onApplyDiscount={(pointsUsed, discountAmount, cardId) => { if (onGiftCardPointsRedeem) onGiftCardPointsRedeem(cardId, pointsUsed, discountAmount); setStep('select'); }}
        onPayWithBalance={(cardId, amount) => { if (onGiftCardBalancePayment) onGiftCardBalancePayment(cardId, amount); }}
        onPartialBalancePayment={(cardId, cardAmount, remainingTotal) => { if (onGiftCardPartialBalance) onGiftCardPartialBalance(cardId, cardAmount, remainingTotal); }}
        onCancel={() => setStep('select')} />
    );
  }

  return null;
};

export default PaymentTab;
