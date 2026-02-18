import { Banknote, CreditCard, FileText, SplitSquareHorizontal, ArrowLeft } from "lucide-react";

interface PaymentScreenProps {
  total: number;
  onPaymentMethod: (method: string) => void;
  onBack: () => void;
}

const PaymentScreen = ({ total, onPaymentMethod, onBack }: PaymentScreenProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const paymentMethods = [
    { id: 'cash', label: 'Gotovina', icon: Banknote, className: 'bg-green-500/20 hover:bg-green-500/30 text-green-700' },
    { id: 'card', label: 'Kartica', icon: CreditCard, className: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700' },
    { id: 'partial', label: 'Kombinirano plačilo', icon: SplitSquareHorizontal, className: 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-700' },
    { id: 'invoice', label: 'Plačilo na fakturo', icon: FileText, className: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-700' },
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="pos-btn-secondary p-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Izbira načina plačila</h2>
      </div>

      {/* Total amount display */}
      <div className="pos-panel p-8 text-center mb-8">
        <p className="text-muted-foreground text-lg mb-2">Za plačilo</p>
        <p className="pos-amount-display text-primary">{formatPrice(total)} €</p>
      </div>

      {/* Payment method buttons */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onPaymentMethod(method.id)}
            className={`h-24 flex items-center justify-center gap-4 text-xl font-semibold rounded-xl transition-colors ${method.className}`}
          >
            <method.icon className="w-8 h-8" />
            <span>{method.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentScreen;
