import { useState } from "react";
import { Delete, ArrowLeft } from "lucide-react";
import { CartItem, InvoiceData } from "@/types/pos";

interface PaymentTabProps {
  cartItems: CartItem[];
  subtotal: number;
  total: number;
  totalDiscount: number;
  onCashPayment: (amountPaid: number) => void;
  onCardPayment: () => void;
  onInvoice: () => void;
  onBack: () => void;
}

const PaymentTab = ({ cartItems, subtotal, total, totalDiscount, onCashPayment, onCardPayment, onInvoice, onBack }: PaymentTabProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'none' | 'cash' | 'card' | 'other'>('none');
  const [inputValue, setInputValue] = useState("");
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountPaid = parseFloat(inputValue) || 0;
  const change = amountPaid - total;

  const handleKeyPress = (key: string) => setInputValue(prev => prev + key);
  const handleDelete = () => setInputValue(prev => prev.slice(0, -1));

  const handleComplete = () => {
    if (paymentMethod === 'cash' && amountPaid >= total) {
      onCashPayment(amountPaid);
    } else if (paymentMethod === 'card') {
      onCardPayment();
    }
  };

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', ','],
  ];

  return (
    <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* LEFT - Receipt summary */}
      <div className="flex-[3] border border-gray-400 bg-white rounded p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="font-bold">Račun:</span>
          <span>št. rač. / {new Date().toLocaleDateString('sl-SI')}</span>
        </div>
        <div>Znesek računa: <strong>{formatPrice(subtotal)} €</strong></div>
        {totalDiscount > 0 && <div>Znesek popusta: <strong className="text-red-600">-{formatPrice(totalDiscount)} €</strong></div>}
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div className="font-bold">Skupaj za plačilo: {formatPrice(total)} €</div>
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div>Že plačano: {paymentMethod !== 'none' ? formatPrice(amountPaid) + ' €' : ''}</div>
        <div>Ostalo za plačilo: {formatPrice(Math.max(0, total - amountPaid))} €</div>
      </div>

      {/* CENTER - Payment method + actions */}
      <div className="flex-[3] flex flex-col gap-3">
        {/* Payment method display */}
        <div className="border border-gray-400 bg-white rounded p-3 text-center">
          <span className="font-bold text-sm">Način plačila: </span>
          <span className="text-sm">
            {paymentMethod === 'cash' ? 'Gotovina' : paymentMethod === 'card' ? 'Kartica' : paymentMethod === 'other' ? 'Drugi način' : ''}
          </span>
        </div>

        {/* "Za plačilo" panel */}
        <div className="border border-gray-400 bg-white rounded p-3 text-sm">
          <h3 className="font-bold mb-2">Za plačilo:</h3>
          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1">
            <div>Plačano: {amountPaid > 0 ? formatPrice(amountPaid) + ' €' : ''}</div>
            <div>Vračilo: {change > 0 ? formatPrice(change) + ' €' : ''}</div>
          </div>
        </div>

        {/* Input display */}
        <div className="border border-gray-400 bg-white rounded p-3">
          <div className="font-mono text-xl font-bold text-gray-800 min-h-[1.5rem]">{inputValue || ''}</div>
        </div>

        {/* Bottom action buttons */}
        <div className="flex gap-2">
          <button onClick={onBack}
            className="flex-1 h-16 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm flex flex-col items-center justify-center transition-colors">
            <ArrowLeft className="w-6 h-6 mb-1" />
            Prekliči plačevanje
          </button>
          <button onClick={onInvoice}
            className="flex-1 h-16 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold text-sm flex items-center justify-center transition-colors">
            Izpiši fakturo
          </button>
          <button onClick={handleComplete}
            disabled={paymentMethod === 'none' || (paymentMethod === 'cash' && amountPaid < total)}
            className="flex-1 h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center justify-center disabled:opacity-40 transition-colors">
            Zaključi, tiskaj račun
          </button>
        </div>

        {/* Payment method buttons */}
        <div className="flex gap-2">
          <button onClick={() => setPaymentMethod('cash')}
            className={`flex-1 h-14 rounded-lg font-bold text-sm border-2 transition-colors ${
              paymentMethod === 'cash' ? 'bg-gray-200 border-gray-600' : 'bg-white border-gray-400 hover:bg-gray-50'
            }`}>
            Gotovina
          </button>
          <button onClick={() => { setPaymentMethod('card'); }}
            className={`flex-1 h-14 rounded-lg font-bold text-sm text-white transition-colors ${
              paymentMethod === 'card' ? 'bg-purple-700 border-2 border-purple-900' : 'bg-purple-500 hover:bg-purple-600'
            }`}>
            Kartica
          </button>
          <button onClick={() => setPaymentMethod('other')}
            className={`flex-1 h-14 rounded-lg font-bold text-sm transition-colors ${
              paymentMethod === 'other' ? 'bg-sky-300 border-2 border-sky-600' : 'bg-sky-200 hover:bg-sky-300 border border-sky-400'
            }`}>
            Drugi način plačila
          </button>
        </div>
      </div>

      {/* RIGHT - Numeric keypad */}
      <div className="flex-[2] flex flex-col gap-2">
        {numKeys.map((row, ri) => (
          <div key={ri} className="flex gap-2 flex-1">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key === ',' ? '.' : key)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors"
              >
                {key}
              </button>
            ))}
            {ri === 3 && (
              <button
                onClick={handleDelete}
                className="flex-1 bg-sky-400 hover:bg-sky-500 border border-sky-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <Delete className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentTab;
