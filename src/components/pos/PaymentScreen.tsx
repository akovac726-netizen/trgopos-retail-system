import { Banknote, CreditCard, FileText, ArrowLeft } from "lucide-react";

interface PaymentScreenProps {
  total: number;
  onPaymentMethod: (method: string) => void;
  onBack: () => void;
}

const PaymentScreen = ({ total, onPaymentMethod, onBack }: PaymentScreenProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="h-full flex overflow-hidden" style={{ background: '#e8f4f8' }}>
      {/* LEFT panel - Receipt info */}
      <div className="flex-[4] flex flex-col p-4 border-r-2 border-sky-300">
        <div className="border-2 border-gray-800 bg-white p-4 mb-3">
          <h2 className="text-2xl font-bold mb-4">Račun:</h2>
          <div className="space-y-2">
            <div className="flex justify-between border-2 border-gray-800 px-3 py-2">
              <span className="font-medium">Plačano:</span>
              <span className="font-bold">{formatPrice(0)}</span>
            </div>
            <div className="flex justify-between border-2 border-gray-800 px-3 py-2">
              <span className="font-medium">Za plačati:</span>
              <span className="font-bold">{formatPrice(total)} €</span>
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>

      {/* RIGHT panel - Payment methods */}
      <div className="flex-[6] flex flex-col p-4">
        {/* Header: Plačilna sredstva */}
        <div className="flex items-center justify-between border-2 border-gray-800 bg-white px-4 py-3 mb-4">
          <span className="text-2xl font-bold">←</span>
          <h2 className="text-xl font-bold">Plačilna sredstva</h2>
          <span className="text-2xl font-bold">→</span>
        </div>

        {/* Payment buttons - red gradient matching PDF */}
        <div className="space-y-3 mb-4">
          <button onClick={() => onPaymentMethod('cash')}
            className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
            style={{ background: 'linear-gradient(180deg, #e05050, #a03030)' }}>
            <span className="text-3xl">€</span>
            <span>Plačilo z gotovino</span>
          </button>
          <button onClick={() => onPaymentMethod('card')}
            className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
            style={{ background: 'linear-gradient(180deg, #d04545, #902828)' }}>
            <span className="text-3xl">▭</span>
            <span>Plačilo s kartico</span>
          </button>
          <button onClick={() => onPaymentMethod('invoice')}
            className="w-full h-16 rounded-lg flex items-center gap-4 px-6 text-white font-bold text-xl transition-all hover:brightness-110 border-2 border-red-700"
            style={{ background: 'linear-gradient(180deg, #c03535, #802020)' }}>
            <span className="text-3xl">📃</span>
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
          <button onClick={() => onPaymentMethod('partial')}
            className="px-6 py-3 rounded-lg font-bold text-base text-white border-2 border-orange-600 transition-colors"
            style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)' }}>
            Polovično<br/>plačilo
          </button>
        </div>

        <div className="flex-1" />

        {/* Pomoč button bottom-right */}
        <div className="flex justify-end">
          <button className="px-4 py-2 border-2 border-orange-500 rounded-lg font-bold text-sm transition-colors"
            style={{ background: 'linear-gradient(180deg, #f0a050, #e08030)', color: 'white' }}>
            😊 Pomoč
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentScreen;
