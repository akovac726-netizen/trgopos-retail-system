import { ChevronUp, ChevronDown, Delete } from "lucide-react";
import { CartItem } from "@/types/pos";
import { Product } from "@/types/inventory";
import { useRef, useState } from "react";

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
}

const BlagajnaTab = ({
  cartItems, selectedItemIndex, inputValue, subtotal, total, totalDiscount, lastAddedItem,
  onSelectItem, onKeyPress, onDelete, onConfirm, onProceedToPayment,
  onOpenDrawer, onProductSearch, onPriceCheck, onQuantity, onDiscount, onReturn, onStorno,
}: BlagajnaTabProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const scrollUp = () => listRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  const scrollDown = () => listRef.current?.scrollBy({ top: 100, behavior: 'smooth' });

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', ','],
  ];

  return (
    <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* LEFT - Cart/Receipt list */}
      <div className="flex-[4] flex flex-col">
        {/* Header with date and scroll arrows */}
        <div className="flex items-center border border-gray-400 bg-white rounded-t">
          <button onClick={scrollDown} className="p-2 hover:bg-gray-100 border-r border-gray-400">
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="flex-1 px-3 py-2 text-sm font-medium">
            <div>Datum: {new Date().toLocaleDateString('sl-SI')}</div>
            <div>Številka računa: {cartItems.length > 0 ? '001' : ''}</div>
          </div>
          <button onClick={scrollUp} className="p-2 hover:bg-gray-100 border-l border-gray-400">
            <ChevronUp className="w-6 h-6" />
          </button>
        </div>

        {/* Cart items */}
        <div ref={listRef} className="flex-1 border border-t-0 border-gray-400 bg-white overflow-y-auto">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Skenirajte artikel ali vnesite EAN kodo
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onSelectItem(idx)}
                className={`px-3 py-2 border-b border-gray-200 cursor-pointer text-sm flex justify-between transition-colors ${
                  selectedItemIndex === idx ? 'bg-sky-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {item.discount && <span className="ml-2 text-red-500 text-xs">-{item.discount.toFixed(0)}%</span>}
                </div>
                <div className="flex gap-4 text-right">
                  <span>{item.quantity}x</span>
                  <span className="font-medium w-20 text-right">{formatPrice(item.price * item.quantity)} €</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total bar */}
        <div className="border border-t-0 border-gray-400 bg-white rounded-b px-3 py-2 flex justify-between items-center">
          <span className="font-bold text-sm">Skupni znesek v EUR:</span>
          <span className="font-bold text-lg font-mono">{formatPrice(total)}</span>
        </div>
      </div>

      {/* CENTER - Last item info + Action buttons */}
      <div className="flex-[4] flex flex-col gap-3">
        {/* Last added item info */}
        <div className="border border-gray-400 bg-white rounded p-3">
          <h3 className="font-bold text-base mb-2">Zadnji dodani artikel:</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div>EAN koda: <span className="font-medium">{lastAddedItem?.ean || ''}</span></div>
            <div>Količina: <span className="font-medium">{lastAddedItem?.quantity || ''}</span></div>
            <div>Prodajna cena: <span className="font-medium">{lastAddedItem ? formatPrice(lastAddedItem.price) : ''}</span></div>
            <div>Vrednost: <span className="font-medium">{lastAddedItem ? formatPrice(lastAddedItem.price * lastAddedItem.quantity) : ''}</span></div>
          </div>
        </div>

        {/* Red "Zaključi račun" button */}
        <button
          onClick={onProceedToPayment}
          disabled={cartItems.length === 0}
          className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Zaključi račun
        </button>

        {/* Open drawer */}
        <button
          onClick={onOpenDrawer}
          className="h-11 bg-white border-2 border-gray-500 rounded-lg font-bold text-sm text-gray-800 hover:bg-gray-50 transition-colors"
        >
          ODPRI BL. PREDAL
        </button>

        {/* Action buttons grid */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          <button onClick={onProductSearch}
            className="h-12 bg-sky-200 hover:bg-sky-300 border border-sky-400 rounded-lg font-bold text-sm text-sky-800 transition-colors">
            EAN KODA
          </button>
          <button onClick={onPriceCheck}
            className="h-12 bg-sky-200 hover:bg-sky-300 border border-sky-400 rounded-lg font-bold text-sm text-sky-800 transition-colors">
            PREVERI CENO
          </button>
          <button onClick={onQuantity}
            className="h-12 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 rounded-lg font-bold text-sm text-yellow-800 transition-colors">
            KOLIČINA
          </button>
          <button onClick={onDiscount}
            className="h-12 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 rounded-lg font-bold text-sm text-yellow-800 transition-colors">
            POPUST
          </button>
          <button onClick={onReturn}
            className="h-12 bg-green-200 hover:bg-green-300 border border-green-400 rounded-lg font-bold text-sm text-green-800 transition-colors">
            VRAČILO
          </button>
          <button onClick={onStorno}
            className="h-12 bg-red-200 hover:bg-red-300 border border-red-400 rounded-lg font-bold text-sm text-red-800 transition-colors">
            STORNO
          </button>
        </div>
      </div>

      {/* RIGHT - Numeric keypad */}
      <div className="flex-[3] flex flex-col gap-3">
        {/* Input display */}
        <div className="border border-gray-400 bg-white rounded p-3">
          <p className="text-xs text-gray-500 mb-1">EAN / PLU koda</p>
          <div className="font-mono text-2xl font-bold text-gray-800 min-h-[2rem]">
            {inputValue || ''}
          </div>
        </div>

        {/* Numpad */}
        <div className="flex-1 flex flex-col gap-2">
          {numKeys.map((row, ri) => (
            <div key={ri} className="flex gap-2 flex-1">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => onKeyPress(key === ',' ? '.' : key)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors"
                >
                  {key}
                </button>
              ))}
              {ri === 3 && (
                <button
                  onClick={onDelete}
                  className="flex-1 bg-sky-400 hover:bg-sky-500 border border-sky-500 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Delete className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* POTRDI button */}
        <button
          onClick={onConfirm}
          className="h-14 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-lg text-gray-700 flex items-center justify-center gap-2 transition-colors"
        >
          <span className="text-xl">↵</span> POTRDI
        </button>
      </div>
    </div>
  );
};

export default BlagajnaTab;
