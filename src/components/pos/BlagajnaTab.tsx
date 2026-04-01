import { ChevronUp, ChevronDown, Delete } from "lucide-react";
import { CartItem } from "@/types/pos";
import { useRef } from "react";

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
  onEmbalaza: () => void;
  isSelfCheckout?: boolean;
}

const BlagajnaTab = ({
  cartItems, selectedItemIndex, inputValue, subtotal, total, totalDiscount, lastAddedItem,
  onSelectItem, onKeyPress, onDelete, onConfirm, onProceedToPayment,
  onOpenDrawer, onProductSearch, onPriceCheck, onQuantity, onDiscount, onReturn, onStorno,
  onGiftVoucher, onEmbalaza, isSelfCheckout,
}: BlagajnaTabProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const scrollUp = () => listRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  const scrollDown = () => listRef.current?.scrollBy({ top: 100, behavior: 'smooth' });

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

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
          {/* Scroll down button at bottom-right of list */}
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

        {/* Na plačilo button - yellow, wide */}
        <button onClick={onProceedToPayment} disabled={cartItems.length === 0}
          className="mt-1 w-full h-14 font-bold text-2xl text-gray-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-2 border-yellow-600"
          style={{ background: 'linear-gradient(180deg, #ffe066, #ffc800)' }}>
          Na plačilo
        </button>
      </div>

      {/* RIGHT panel */}
      <div className="flex-[5] flex flex-col gap-2 p-3 min-h-0">
        {/* Top action buttons - 3x3 grid matching PDF */}
        <div className="grid grid-cols-3 gap-2">
          {/* Row 1: Vračilo + 2 empty */}
          <button onClick={isSelfCheckout ? undefined : onReturn} disabled={isSelfCheckout}
            className={`h-12 rounded-lg font-bold text-sm border-2 transition-colors ${isSelfCheckout ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' : 'text-white border-red-600'}`}
            style={!isSelfCheckout ? { background: 'linear-gradient(180deg, #f08080, #e05050)' } : {}}>
            Vračilo
          </button>
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />

          {/* Row 2: 2 empty + empty */}
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />

          {/* Row 3: empty + Popust + Vrečka(embalaža) */}
          <button className="h-12 rounded-lg font-bold text-sm border-2 border-sky-300 bg-sky-100/50" disabled />
          <button onClick={isSelfCheckout ? undefined : onDiscount} disabled={isSelfCheckout}
            className={`h-12 rounded-lg font-bold text-sm border-2 transition-colors ${isSelfCheckout ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' : 'text-white border-purple-600'}`}
            style={!isSelfCheckout ? { background: 'linear-gradient(180deg, #b090d0, #8060b0)' } : {}}>
            Popust
          </button>
          <button onClick={onEmbalaza}
            className="h-12 rounded-lg font-bold text-xs border-2 border-sky-400 bg-white text-gray-800 hover:bg-sky-50 transition-colors">
            Vrečka<br/>(embalaža)
          </button>
        </div>

        {/* Numpad section with EAN input */}
        <div className="flex-1 flex flex-col border-2 border-gray-600 rounded-lg p-2 bg-white min-h-0">
          {/* EAN input row */}
          <div className="flex gap-1 mb-2">
            <input type="text" value={inputValue} readOnly placeholder="Vnesite EAN šifro izdelka"
              className="flex-1 h-9 px-3 border-2 border-gray-800 text-sm font-medium bg-white" />
            <button onClick={onDelete} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">←</button>
            <button onClick={() => { /* clear all input */ }} className="w-10 h-9 border-2 border-gray-800 bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-lg">C</button>
          </div>

          {/* Numpad + right action column */}
          <div className="flex-1 flex gap-1 min-h-0">
            {/* 3x4 numpad */}
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
      </div>
    </div>
  );
};

export default BlagajnaTab;
