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
}

const BlagajnaTab = ({
  cartItems, selectedItemIndex, inputValue, subtotal, total, totalDiscount, lastAddedItem,
  onSelectItem, onKeyPress, onDelete, onConfirm, onProceedToPayment,
  onOpenDrawer, onProductSearch, onPriceCheck, onQuantity, onDiscount, onReturn, onStorno,
  onGiftVoucher, onEmbalaza,
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
    <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* LEFT - Receipt list */}
      <div className="flex-[4] flex flex-col">
        {/* Header with scroll arrows */}
        <div className="flex items-center border-2 border-gray-600 bg-white rounded-t">
          <button onClick={scrollDown} className="p-2 hover:bg-gray-100 border-r border-gray-400">
            <ChevronDown className="w-7 h-7 text-gray-800" />
          </button>
          <div className="flex-1 px-3 py-2 text-sm font-medium">
            <div>Datum: {new Date().toLocaleDateString('sl-SI')}</div>
            <div>Številka računa:</div>
          </div>
          <button onClick={scrollUp} className="p-2 hover:bg-gray-100 border-l border-gray-400">
            <ChevronUp className="w-7 h-7 text-gray-800" />
          </button>
        </div>

        {/* Cart items */}
        <div ref={listRef} className="flex-1 border-2 border-t-0 border-gray-600 bg-white overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Skenirajte artikel ali vnesite EAN kodo
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={item.id} onClick={() => onSelectItem(idx)}
                className={`px-3 py-2 border-b border-gray-200 cursor-pointer text-sm flex justify-between transition-colors ${
                  item.isStornoed ? 'bg-red-50 line-through text-red-400' :
                  selectedItemIndex === idx ? 'bg-sky-100' : 'hover:bg-gray-50'
                }`}>
                <div className="flex-1">
                  {item.isStornoed && <span className="text-red-500 font-bold mr-1">–</span>}
                  <span className={`font-medium ${item.isStornoed ? 'text-red-400' : ''}`}>{item.name}</span>
                  {item.isStornoed && <span className="ml-2 text-red-500 text-xs font-bold">STORNO</span>}
                  {!item.isStornoed && item.discount && <span className="ml-2 text-red-500 text-xs">-{item.discount.toFixed(0)}%</span>}
                </div>
                <div className="flex gap-4 text-right">
                  <span>{item.isStornoed ? '-' : ''}{item.quantity}x</span>
                  <span className={`font-medium w-20 text-right ${item.isStornoed ? 'text-red-400' : ''}`}>{item.isStornoed ? '-' : ''}{formatPrice(item.price * item.quantity)} €</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total bar */}
        <div className="border-2 border-t-0 border-gray-600 bg-white rounded-b px-3 py-2 flex justify-between items-center">
          <span className="font-bold text-sm">Skupini znesek v EUR:</span>
          <span className="font-bold text-lg font-mono">{formatPrice(total)}</span>
        </div>
      </div>

      {/* RIGHT side */}
      <div className="flex-[6] flex flex-col gap-2">
        {/* Last added item info */}
        <div className="border-2 border-gray-600 bg-white rounded p-3">
          <h3 className="font-bold text-lg mb-1">Zadnji dodani artikel:</h3>
          <div className="border-t border-gray-400 pt-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div>EAN koda: <span className="font-medium">{lastAddedItem?.ean || ''}</span></div>
              <div>Količina: <span className="font-medium">{lastAddedItem?.quantity || ''}</span></div>
              <div>Prodajna cena: <span className="font-medium">{lastAddedItem ? formatPrice(lastAddedItem.price) : ''}</span></div>
              <div>Vrednost: <span className="font-medium">{lastAddedItem ? formatPrice(lastAddedItem.price * lastAddedItem.quantity) : ''}</span></div>
            </div>
          </div>
        </div>

        {/* Top action row: ODPRI BL. PREDAL + Preveri ceno + DARILNI BONI + Zaključi račun */}
        <div className="flex gap-2">
          <button onClick={onOpenDrawer}
            className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 rounded-lg font-bold text-sm transition-colors">
            ODPRI<br/>BL. PREDAL
          </button>
          <button onClick={onPriceCheck}
            className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-2 border-yellow-600 rounded-lg font-bold text-sm transition-colors">
            Preveri<br/>ceno
          </button>
          <button onClick={onGiftVoucher}
            className="flex-1 h-14 bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-700 rounded-lg font-bold text-sm transition-colors">
            DARILNI<br/>BONI
          </button>
          <button onClick={onProceedToPayment} disabled={cartItems.length === 0}
            className="flex-1 h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Zaključi<br/>račun
          </button>
        </div>

        {/* Bottom section: left buttons + numpad + right buttons */}
        <div className="flex gap-2 flex-1">
          {/* Left action buttons */}
          <div className="flex flex-col gap-2 w-28">
            <button onClick={onProductSearch}
              className="flex-1 bg-white border-2 border-gray-600 rounded-lg font-bold text-sm text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center">
              EAN koda
            </button>
            <button onClick={onEmbalaza}
              className="flex-1 bg-white border-2 border-gray-600 rounded-lg font-bold text-sm text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center">
              Embalaža
            </button>
            <button onClick={onReturn}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center">
              Vračilo
            </button>
          </div>

          {/* Numpad */}
          <div className="flex-1 flex flex-col gap-1.5 border-2 border-gray-400 rounded-lg p-2 bg-gray-100">
            {numKeys.map((row, ri) => (
              <div key={ri} className="flex gap-1.5 flex-1">
                {row.map(key => (
                  <button key={key} onClick={() => onKeyPress(key)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex gap-1.5 flex-1">
              <button onClick={() => onKeyPress('0')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                0
              </button>
              <button onClick={() => onKeyPress('.')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                ,
              </button>
              <button onClick={onDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
                <Delete className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex flex-col gap-2 w-28">
            <button onClick={onQuantity}
              className="flex-1 bg-white border-2 border-gray-600 rounded-lg font-bold text-sm text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center">
              Količina
            </button>
            <button onClick={onDiscount}
              className="flex-1 bg-white border-2 border-gray-600 rounded-lg font-bold text-sm text-gray-800 hover:bg-gray-50 transition-colors flex items-center justify-center">
              Popust
            </button>
            <button onClick={onStorno}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center">
              Storno
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlagajnaTab;
