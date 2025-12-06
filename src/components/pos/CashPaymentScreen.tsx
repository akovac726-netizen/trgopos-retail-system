import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import NumericKeypad from "./NumericKeypad";

interface CashPaymentScreenProps {
  total: number;
  onComplete: (amountPaid: number) => void;
  onBack: () => void;
}

const CashPaymentScreen = ({ total, onComplete, onBack }: CashPaymentScreenProps) => {
  const [inputValue, setInputValue] = useState("");

  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const amountPaid = parseFloat(inputValue) || 0;
  const change = amountPaid - total;
  const canComplete = amountPaid >= total;

  const quickAmounts = [
    { value: 5, label: '5 €', type: 'bill' },
    { value: 10, label: '10 €', type: 'bill' },
    { value: 20, label: '20 €', type: 'bill' },
    { value: 50, label: '50 €', type: 'bill' },
    { value: 100, label: '100 €', type: 'bill' },
    { value: 200, label: '200 €', type: 'bill' },
  ];

  const coins = [
    { value: 0.01, label: '1c' },
    { value: 0.02, label: '2c' },
    { value: 0.05, label: '5c' },
    { value: 0.10, label: '10c' },
    { value: 0.20, label: '20c' },
    { value: 0.50, label: '50c' },
    { value: 1, label: '1 €' },
    { value: 2, label: '2 €' },
  ];

  const handleQuickAmount = (amount: number) => {
    const current = parseFloat(inputValue) || 0;
    setInputValue((current + amount).toFixed(2));
  };

  const handleKeyPress = (key: string) => {
    if (key.includes('x')) return;
    setInputValue(prev => prev + key);
  };

  const handleDelete = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleExactAmount = () => {
    setInputValue(total.toFixed(2));
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="pos-btn-secondary p-3">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Plačilo z gotovino</h2>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        {/* Left - Amount display */}
        <div className="space-y-4">
          <div className="pos-panel p-6">
            <p className="text-muted-foreground text-sm mb-1">Za plačilo</p>
            <p className="font-mono text-4xl font-bold text-primary">{formatPrice(total)} €</p>
          </div>
          
          <div className="pos-panel p-6">
            <p className="text-muted-foreground text-sm mb-1">Prejeto</p>
            <p className="font-mono text-4xl font-bold">{formatPrice(amountPaid)} €</p>
          </div>
          
          <div className={`pos-panel p-6 ${canComplete ? 'bg-success/10 border-success' : ''}`}>
            <p className="text-muted-foreground text-sm mb-1">Vračilo</p>
            <p className={`font-mono text-4xl font-bold ${canComplete ? 'text-success' : 'text-muted-foreground'}`}>
              {change > 0 ? formatPrice(change) : '0,00'} €
            </p>
          </div>

          <button
            onClick={handleExactAmount}
            className="w-full pos-btn-secondary h-14 text-lg"
          >
            Točen znesek
          </button>
        </div>

        {/* Center - Quick amounts */}
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">Bankovci</p>
          <div className="grid grid-cols-2 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount.value}
                onClick={() => handleQuickAmount(amount.value)}
                className="pos-btn-confirm h-16 text-xl font-bold"
              >
                {amount.label}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold text-muted-foreground mt-4">Kovanci</p>
          <div className="grid grid-cols-4 gap-2">
            {coins.map((coin) => (
              <button
                key={coin.value}
                onClick={() => handleQuickAmount(coin.value)}
                className="pos-btn-secondary h-12 text-sm font-semibold"
              >
                {coin.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right - Keypad */}
        <div className="space-y-4">
          <NumericKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onConfirm={() => canComplete && onComplete(amountPaid)}
            showQuantityButtons={false}
          />
          
          <button
            onClick={() => onComplete(amountPaid)}
            disabled={!canComplete}
            className="w-full pos-btn-confirm h-20 flex items-center justify-center gap-3 text-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-8 h-8" />
            <span>Zaključi račun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashPaymentScreen;
