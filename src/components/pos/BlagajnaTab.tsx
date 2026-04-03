import { useState, useRef } from "react";
import { CartItem } from "@/types/pos";
import { Product } from "@/types/inventory";

interface BlagajnaTabProps {
  cartItems: CartItem[];
  selectedItemIndex: number | null;
  inputValue: string;
  subtotal: number;
  total: number;
  totalDiscount: number;
  lastAddedItem: CartItem | null;
  onSelectItem: (index: number) => void;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onProceedToPayment: () => void;
  onOpenDrawer: () => void;
  onProductSearch: () => void;
  onPriceCheck: () => void;
  onQuantity: () => void;
  onDiscount: () => void;
  onReturn: () => void;
  onStorno: () => void;
  onGiftVoucher: () => void;
  onEmbalaza: (ean: string) => void;
  products?: Product[];
  isSelfCheckout?: boolean;
  // Inline mode props
  quantityMode?: boolean;
  discountMode?: boolean;
  selectedItem?: CartItem | null;
  onQuantityConfirm?: (qty: number) => void;
  onQuantityCancel?: () => void;
  onDiscountConfirm?: (discount: number, isPercentage: boolean) => void;
  onDiscountCancel?: () => void;
}

const BlagajnaTab = ({
  cartItems, selectedItemIndex, inputValue, subtotal, total, totalDiscount, lastAddedItem,
  onSelectItem, onKeyPress, onDelete, onConfirm, onProceedToPayment,
  onOpenDrawer, onProductSearch, onPriceCheck, onQuantity, onDiscount, onReturn, onStorno,
  onGiftVoucher, onEmbalaza, isSelfCheckout,
  quantityMode, discountMode, selectedItem,
  onQuantityConfirm, onQuantityCancel, onDiscountConfirm, onDiscountCancel,
}: BlagajnaTabProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Inline quantity state
  const [qtyValue, setQtyValue] = useState("");
  // Inline discount state
  const [discountValue, setDiscountValue] = useState("");
  // Embalaža mode state
  const [showEmbalaza, setShowEmbalaza] = useState(false);

  const scrollUp = () => listRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  const scrollDown = () => listRef.current?.scrollBy({ top: 100, behavior: 'smooth' });

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  const inlineMode = quantityMode || discountMode || showEmbalaza;

  // Quantity handlers
  const handleQtyKey = (key: string) => {
    if (key === '.' && qtyValue.includes('.')) return;
    setQtyValue(prev => prev + key);
  };
  const handleQtyDelete = () => setQtyValue(prev => prev.slice(0, -1));
  const handleQtyClear = () => setQtyValue("");
  const handleQtyConfirm = () => {
    const qty = parseFloat(qtyValue);
    if (qty > 0 && onQuantityConfirm) {
      onQuantityConfirm(qty);
      setQtyValue("");
    }
  };

  // Discount handlers
  const handleDiscountKey = (key: string) => {
    if (key === '.' && discountValue.includes('.')) return;
    setDiscountValue(prev => prev + key);
  };
  const handleDiscountDelete = () => setDiscountValue(prev => prev.slice(0, -1));
  const handleDiscountClear = () => setDiscountValue("");
  const handleDiscountQuick = (pct: number) => {
    if (onDiscountConfirm) {
      onDiscountConfirm(pct, true);
      setDiscountValue("");
    }
  };
  const handleDiscountManualConfirm = () => {
    const d = parseFloat(discountValue);
    if (!isNaN(d) && d > 0 && d <= 100 && onDiscountConfirm) {
      onDiscountConfirm(d, true);
      setDiscountValue("");
    }
  };

  return (
    <div className="h-full flex gap-0 overflow-hidden" style={{ background: '#e8f4f8' }}>
      {/* LEFT panel - Article list */}
      <div className="flex-[5] flex flex-col min-h-0 p-3 pr-0">
        {/* Column headers */}
        <div className="flex items-center border-2 border-gray-800 bg-white">
          <div className="flex-[3] px-3 py-2 font-bold text-sm border-r border-gray-400">Artikel</div>
          <div className="flex-[2] px-3 py-2 font-bold text-sm text-center border-r border-gray-400">Količina</div>
          <div className="flex-[2] px-3 py-2 font-bold text-sm text-right">Cena</div>
          <div className="flex flex-col border-l-2 border-gray-800">
            <button onClick={scrollUp} className="px-2 py-1 bg-sky-400 hover:bg-sky-500 text-white font-bold text-lg">∧</button>
          </div>
        </div>

        {/* Cart items */}
        <div ref={listRef} className="flex-1 border-2 border-t-0 border-gray-800 bg-white overflow-y-auto relative">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Skenirajte artikel ali vnesite EAN kodo
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.id} onClick={() => onSelectItem(idx)}
                className={`px-3 py-2 border-b border-gray-200 cursor-pointer text-sm flex items-center transition-colors ${
                  item.isStornoed ? 'bg-red-50 line-through text-red-400' :
                  selectedItemIndex === idx ? 'bg-sky-100' : 'hover:bg-gray-50'
                }`}>
                <div className="flex-[3]">
                  {item.isStornoed && <span className="text-red-500 font-bold mr-1">–</span>}
                  <span className={`font-medium ${item.isStornoed ? 'text-red-400' : ''}`}>{item.name}</span>
                  {item.isStornoed && <span className="ml-2 text-red-500 text-xs font-bold">STORNO</span>}
                  {!item.isStornoed && item.discount && <span className="ml-2 text-red-500 text-xs">-{item.discount.toFixed(0)}%</span>}
                </div>
                <div className="flex-[2] text-center">{item.isStornoed ? '-' : ''}{item.quantity}x</div>
                <div className={`flex-[2] text-right font-medium ${item.isStornoed ? 'text-red-400' : ''}`}>
                  {item.isStornoed ? '-' : ''}{formatPrice(item.price * item.quantity)} €
                </div>
              </div>
            ))
          )}
          <button onClick={scrollDown}
            className="absolute bottom-1 right-1 w-8 h-8 bg-sky-400 hover:bg-sky-500 text-white font-bold text-lg flex items-center justify-center">
            ∨
          </button>
        </div>

        {/* Total */}
        <div className="border-2 border-t-0 border-gray-800 bg-gray-100 px-3 py-2 flex justify-between items-center">
          <span className="font-bold text-base">Vsota:</span>
          <span className="font-bold text-xl font-mono">{formatPrice(total)} EUR</span>
        </div>

        {/* Na plačilo button */}
        <button onClick={onProceedToPayment} disabled={cartItems.length === 0}
          className="mt-1 w-full h-14 font-bold text-2xl text-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-2 border-yellow-600"
          style={{ background: 'linear-gradient(180deg, #ffe066, #ffc800)' }}>
          Na plačilo
        </button>
      </div>

      {/* RIGHT panel */}
      <div className="flex-[5] flex flex-col gap-2 p-3 min-h-0">

        {/* ====== QUANTITY MODE ====== */}
        {quantityMode && (
          <>
            {/* Top: Artikel info + quantity input */}
            <div className="border-2 border-gray-600 rounded-lg bg-gray-200 p-3">
              <div className="font-bold text-base mb-2">Artikel:</div>
              <div className="flex items-center gap-2 mb-3">
                <input type="text" value={qtyValue} readOnly placeholder=""
                  className="w-20 h-9 px-3 border-2 border-gray-800 text-center font-bold text-lg bg-white" />
                <span className="font-medium text-sm">kos</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { onQuantityCancel?.(); setQtyValue(""); }}
                  className="flex-1 h-10 rounded-lg font-bold text-sm text-white border-2 border-red-600 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>
                  Prekliči
                </button>
                <button onClick={handleQtyConfirm}
                  disabled={!qtyValue || parseFloat(qtyValue) <= 0}
                  className="flex-1 h-10 rounded-lg font-bold text-sm text-gray-800 border-2 border-green-400 transition-colors disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg, #c5e8a0, #a8d86e)' }}>
                  Potrdi
                </button>
              </div>
            </div>

            {/* Numpad for quantity - NO right column */}
            <div className="flex-1 flex flex-col border-2 border-gray-600 rounded-lg p-2 bg-white min-h-0">
              <div className="flex gap-1 mb-2">
                <input type="text" value={qtyValue} readOnly placeholder="Vnesi količino"
                  className="flex-1 h-9 px-3 border-2 border-gray-800 text-sm font-medium bg-white" />
                <button onClick={handleQtyDelete} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">←</button>
                <button onClick={handleQtyClear} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">C</button>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {numKeys.map((row, ri) => (
                  <div key={ri} className="flex gap-1 flex-1">
                    {row.map(key => (
                      <button key={key} onClick={() => handleQtyKey(key)}
                        className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                        style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-1 flex-1">
                  <button onClick={() => handleQtyKey('0')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                    0
                  </button>
                  <button onClick={() => handleQtyKey('00')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                    00
                  </button>
                  <button onClick={() => handleQtyKey(',')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-300 bg-sky-50 transition-colors">
                    ,
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====== DISCOUNT MODE ====== */}
        {discountMode && (
          <>
            {/* Top: Artikel info + preset discounts */}
            <div className="border-2 border-gray-600 rounded-lg bg-gray-200 p-3">
              <div className="font-bold text-base mb-2">Artikel:</div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[10, 20, 30, 50].map(pct => (
                  <button key={pct} onClick={() => handleDiscountQuick(pct)}
                    className="h-10 rounded-lg font-bold text-sm text-white border-2 border-purple-500 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b090d0, #8060b0)' }}>
                    {pct} %
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { onDiscountCancel?.(); setDiscountValue(""); }}
                  className="flex-1 h-10 rounded-lg font-bold text-sm text-white border-2 border-red-600 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>
                  Prekliči
                </button>
                <button onClick={() => {/* toggle manual mode - already shown below */}}
                  className="flex-1 h-10 rounded-lg font-bold text-sm text-white border-2 border-orange-500 transition-colors"
                  style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
                  Ročni vnos
                </button>
                <button onClick={handleDiscountManualConfirm}
                  disabled={!discountValue || parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100}
                  className="flex-1 h-10 rounded-lg font-bold text-sm text-gray-800 border-2 border-green-400 transition-colors disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg, #c5e8a0, #a8d86e)' }}>
                  Potrdi
                </button>
              </div>
            </div>

            {/* Numpad for discount - NO right column */}
            <div className="flex-1 flex flex-col border-2 border-gray-600 rounded-lg p-2 bg-white min-h-0">
              <div className="flex gap-1 mb-2">
                <input type="text" value={discountValue} readOnly placeholder="Ročno vnesen popust"
                  className="flex-1 h-9 px-3 border-2 border-gray-800 text-sm font-medium bg-white" />
                <button onClick={handleDiscountDelete} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">←</button>
                <button onClick={handleDiscountClear} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">C</button>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {numKeys.map((row, ri) => (
                  <div key={ri} className="flex gap-1 flex-1">
                    {row.map(key => (
                      <button key={key} onClick={() => handleDiscountKey(key)}
                        className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                        style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                        {key}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex gap-1 flex-1">
                  <button onClick={() => handleDiscountKey('0')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                    0
                  </button>
                  <button onClick={() => handleDiscountKey('00')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                    00
                  </button>
                  <button onClick={() => handleDiscountKey(',')}
                    className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-300 bg-sky-50 transition-colors">
                    ,
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====== NORMAL MODE ====== */}
        {!inlineMode && (
          <>
            {/* Top action buttons - 3x3 grid matching PDF */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={isSelfCheckout ? undefined : onReturn} disabled={isSelfCheckout}
                className={`h-12 rounded-lg font-bold text-sm border-2 transition-colors ${isSelfCheckout ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' : 'text-white border-red-600'}`}
                style={!isSelfCheckout ? { background: 'linear-gradient(180deg, #f08080, #e05050)' } : {}}>
                Vračilo
              </button>
              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />

              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />

              <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
              <button onClick={isSelfCheckout ? undefined : onDiscount} disabled={isSelfCheckout}
                className={`h-12 rounded-lg font-bold text-sm border-2 transition-colors ${isSelfCheckout ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' : 'text-white border-purple-600'}`}
                style={!isSelfCheckout ? { background: 'linear-gradient(180deg, #b090d0, #8060b0)' } : {}}>
                Popust
              </button>
              <button onClick={() => setShowEmbalaza(true)}
                className="h-12 rounded-lg font-bold text-xs border-2 border-sky-400 bg-white text-gray-800 hover:bg-sky-50 transition-colors">
                Vrečka<br/>(embalaža)
              </button>
            </div>

            {/* Numpad section with EAN input */}
            <div className="flex-1 flex flex-col border-2 border-gray-600 rounded-lg p-2 bg-white min-h-0">
              <div className="flex gap-1 mb-2">
                <input type="text" value={inputValue} readOnly placeholder="Vnesite EAN šifro izdelka"
                  className="flex-1 h-9 px-3 border-2 border-gray-800 text-sm font-medium bg-white" />
                <button onClick={onDelete} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">←</button>
                <button onClick={() => { /* clear all input */ }} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">C</button>
              </div>

              <div className="flex-1 flex gap-1 min-h-0">
                <div className="flex-[3] flex flex-col gap-1">
                  {numKeys.map((row, ri) => (
                    <div key={ri} className="flex gap-1 flex-1">
                      {row.map(key => (
                        <button key={key} onClick={() => onKeyPress(key)}
                          className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                          style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="flex gap-1 flex-1">
                    <button onClick={() => onKeyPress('0')}
                      className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                      style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                      0
                    </button>
                    <button onClick={() => onKeyPress('00')}
                      className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-400 transition-colors"
                      style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                      00
                    </button>
                    <button onClick={() => onKeyPress(',')}
                      className="flex-1 rounded-lg font-bold text-xl text-gray-800 border-2 border-sky-300 bg-sky-50 transition-colors">
                      ,
                    </button>
                  </div>
                </div>

                {/* Right column: Storno, Količina, Potrdi */}
                <div className="flex-[1] flex flex-col gap-1">
                  <button onClick={onStorno}
                    className="flex-1 rounded-lg font-bold text-sm text-white border-2 border-red-600 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #f06060, #d03030)' }}>
                    Storno
                  </button>
                  <button onClick={onQuantity}
                    className="flex-1 rounded-lg font-bold text-sm text-white border-2 border-orange-500 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
                    Količina
                  </button>
                  <button onClick={onConfirm}
                    className="flex-[2] rounded-lg font-bold text-sm text-gray-800 border-2 border-green-400 transition-colors"
                    style={{ background: 'linear-gradient(180deg, #c5e8a0, #a8d86e)' }}>
                    Potrdi
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlagajnaTab;
