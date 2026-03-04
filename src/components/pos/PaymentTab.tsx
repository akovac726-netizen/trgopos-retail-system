import { useState } from "react";
import { Delete, ArrowLeft } from "lucide-react";
import { CartItem } from "@/types/pos";

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
  const [step, setStep] = useState<'select' | 'cash' | 'card'>('select');
  const [inputValue, setInputValue] = useState("");
  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountPaid = parseFloat(inputValue) || 0;
  const change = amountPaid - total;

  const handleKeyPress = (key: string) => setInputValue(prev => prev + key);
  const handleDelete = () => setInputValue(prev => prev.slice(0, -1));

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  // Payment method selection (Diapozitiv4)
  if (step === 'select') {
    return (
      <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
        {/* LEFT - Receipt list (same as blagajna) */}
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

        {/* RIGHT - Payment method buttons */}
        <div className="flex-[6] flex flex-col gap-3">
          {/* Payment methods grid */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setStep('cash')}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Gotovina
            </button>
            <button onClick={() => setStep('card')}
              className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Kartica
            </button>
            <button className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Darilna kartica
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Darilni bon
            </button>
            <button className="h-20 bg-white border-2 border-gray-500 rounded-xl font-bold text-base text-gray-800 hover:bg-gray-50 transition-colors">
              Dobropis podjetja
            </button>
          </div>

          <div className="flex-1" />

          {/* Izpiši fakturo */}
          <button onClick={onInvoice}
            className="h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-base transition-colors w-48">
            Izpiši fakturo
          </button>

          {/* Nazaj */}
          <button onClick={onBack}
            className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xl flex items-center justify-center gap-2 transition-colors w-48 mx-auto">
            <ArrowLeft className="w-6 h-6" />
            Nazaj
          </button>
        </div>
      </div>
    );
  }

  // Card terminal (Diapozitiv5)
  if (step === 'card') {
    return (
      <div className="h-full flex gap-3 p-3 relative" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
        {/* Background layout same as select but dimmed */}
        <div className="absolute inset-0 bg-black/30 z-10" />

        {/* Modal */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="bg-gray-200 border-2 border-gray-500 rounded-xl p-8 text-center min-w-[400px]">
            <h2 className="text-2xl font-bold tracking-widest mb-6">POS TERMINAL – NAKUP</h2>
            <div className="border-2 border-gray-600 bg-white rounded-lg p-8 mb-6">
              <p className="font-bold text-lg mb-4">ZNESEK (EUR)</p>
              <p className="text-5xl font-bold">{formatPrice(total)} €</p>
            </div>
            <button onClick={() => { onCardPayment(); }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-10 py-3 rounded-lg transition-colors mr-4">
              POTRDI
            </button>
            <button onClick={() => setStep('select')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-10 py-3 rounded-lg transition-colors">
              PREKLIČI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cash payment (Diapozitiv6)
  return (
    <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* LEFT - Receipt summary */}
      <div className="flex-[4] border-2 border-gray-600 bg-white rounded-lg p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="font-bold text-lg">Račun:</span>
          <span className="font-bold">št. rač. / {new Date().toLocaleDateString('sl-SI')}</span>
        </div>
        <div>Znesek računa: <strong>{formatPrice(subtotal)}</strong></div>
        {totalDiscount > 0 && <div>Znesek popusta: <strong className="text-red-600">-{formatPrice(totalDiscount)}</strong></div>}
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div className="font-bold">Skupaj za plačilo: {formatPrice(total)}</div>
        <div className="border-t border-dashed border-gray-400 pt-2" />
        <div>Že plačano: {amountPaid > 0 ? formatPrice(amountPaid) : ''}</div>
        <div>Ostalo za plačilo: {formatPrice(Math.max(0, total - amountPaid))}</div>
      </div>

      {/* RIGHT - Payment info + numpad + actions */}
      <div className="flex-[6] flex flex-col gap-3">
        {/* Za plačilo panel */}
        <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
          <h3 className="font-bold text-xl mb-2">Za plačilo:</h3>
          <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-sm">
            <div>Plačano: {amountPaid > 0 ? formatPrice(amountPaid) + ' €' : ''}</div>
            <div>Vračilo: {change > 0 ? formatPrice(change) + ' €' : ''}</div>
          </div>
        </div>

        <div className="flex gap-3 flex-1">
          {/* Numpad with input */}
          <div className="flex flex-col gap-2 flex-1">
            {/* Input display */}
            <div className="border-2 border-gray-600 bg-white rounded-lg p-3">
              <div className="font-mono text-xl font-bold text-gray-800 min-h-[1.5rem]">{inputValue || ''}</div>
            </div>

            {/* Numpad */}
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
                <button onClick={() => handleKeyPress('0')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                  0
                </button>
                <button onClick={() => handleKeyPress('.')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                  ,
                </button>
                <button onClick={handleDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <Delete className="w-7 h-7 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex flex-col gap-3 w-36">
            <button onClick={() => setStep('select')}
              className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Nazaj
            </button>
            <button onClick={() => { if (amountPaid >= total) onCashPayment(amountPaid); }}
              disabled={amountPaid < total}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm flex items-center justify-center text-center disabled:opacity-40 transition-colors p-2">
              Zaključi, tiskaj račun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTab;
