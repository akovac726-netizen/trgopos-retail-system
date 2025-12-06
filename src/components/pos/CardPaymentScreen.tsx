import { ArrowLeft, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

interface CardPaymentScreenProps {
  total: number;
  onComplete: () => void;
  onBack: () => void;
}

const CardPaymentScreen = ({ total, onComplete, onBack }: CardPaymentScreenProps) => {
  const [status, setStatus] = useState<'waiting' | 'processing' | 'complete'>('waiting');

  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Simulate card payment process
  useEffect(() => {
    if (status === 'processing') {
      const timer = setTimeout(() => {
        setStatus('complete');
        setTimeout(onComplete, 1500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);

  const handleStartPayment = () => {
    setStatus('processing');
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack} 
          className="pos-btn-secondary p-3"
          disabled={status !== 'waiting'}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Plačilo s kartico</h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="pos-panel p-12 text-center max-w-md w-full">
          <p className="text-muted-foreground text-lg mb-2">Za plačilo</p>
          <p className="pos-amount-display text-primary mb-8">{formatPrice(total)} €</p>

          {status === 'waiting' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-12 h-12 text-primary" />
              </div>
              <p className="text-lg mb-6">Pritisnite za začetek plačila</p>
              <button
                onClick={handleStartPayment}
                className="w-full pos-btn-confirm h-16 text-xl"
              >
                Začni plačilo
              </button>
            </>
          )}

          {status === 'processing' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-warning animate-spin" />
              </div>
              <p className="text-lg text-muted-foreground">
                Čakam na potrditev POS terminala...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Kupec naj sledi navodilom na terminalu
              </p>
            </>
          )}

          {status === 'complete' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <p className="text-lg text-success font-semibold">
                Plačilo uspešno!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Račun se pripravlja...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPaymentScreen;
