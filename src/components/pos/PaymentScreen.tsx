import { Banknote, CreditCard, Gift, FileText, MoreHorizontal, ArrowLeft } from "lucide-react";

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
    { id: 'cash', label: 'Gotovina', icon: Banknote },
    { id: 'card', label: 'Kartica', icon: CreditCard },
    { id: 'gift', label: 'Darilna kartica', icon: Gift },
    { id: 'credit', label: 'Dobropis', icon: FileText },
    { id: 'other', label: 'Drugo', icon: MoreHorizontal },
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
      <div className="grid grid-cols-1 gap-4 flex-1">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => onPaymentMethod(method.id)}
            className="pos-btn-confirm h-20 flex items-center justify-center gap-4 text-xl"
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
