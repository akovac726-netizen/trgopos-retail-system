import { useState } from "react";
import { CheckCircle2, Printer, RotateCcw, Receipt, CreditCard } from "lucide-react";
import { Transaction } from "@/types/pos";

interface CompletionScreenProps {
  transaction: Transaction;
  onNewTransaction: () => void;
  onPrintCopy: () => void;
  onAddLoyaltyPoints?: (code: string) => void;
}

const CompletionScreen = ({ transaction, onNewTransaction, onPrintCopy, onAddLoyaltyPoints }: CompletionScreenProps) => {
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [loyaltyCode, setLoyaltyCode] = useState("");

  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddPoints = () => {
    if (loyaltyCode.length >= 8 && onAddLoyaltyPoints) {
      onAddLoyaltyPoints(loyaltyCode);
      setShowLoyalty(false);
      setLoyaltyCode("");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in">
      <div className="pos-panel p-12 text-center max-w-lg w-full">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-success" />
        </div>

        <h2 className="text-3xl font-bold mb-2">Račun zaključen</h2>
        <p className="text-muted-foreground mb-8">Transakcija #{transaction.id}</p>

        <div className="space-y-4 text-left bg-muted/50 rounded-lg p-6 mb-8">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Skupaj:</span>
            <span className="font-mono font-bold">{formatPrice(transaction.total)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Način plačila:</span>
            <span className="font-semibold capitalize">{transaction.paymentMethod}</span>
          </div>
          {transaction.paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prejeto:</span>
                <span className="font-mono">{formatPrice(transaction.amountPaid)} €</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Vračilo:</span>
                <span className="font-mono font-bold">{formatPrice(transaction.change)} €</span>
              </div>
            </>
          )}
        </div>

        {/* Loyalty points section */}
        {showLoyalty ? (
          <div className="mb-6 bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Vnesite kodo darilne kartice (8-mest.):</p>
            <div className="flex gap-2">
              <input
                value={loyaltyCode}
                onChange={e => setLoyaltyCode(e.target.value.replace(/\D/g, '').slice(0, 13))}
                placeholder="Koda kartice..."
                className="flex-1 h-10 px-3 border-2 border-gray-300 rounded-lg font-mono text-lg"
                autoFocus
              />
              <button onClick={handleAddPoints} disabled={loyaltyCode.length < 8}
                className="px-4 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm disabled:opacity-40 transition-colors">
                Dodaj točke
              </button>
              <button onClick={() => { setShowLoyalty(false); setLoyaltyCode(''); }}
                className="px-3 h-10 bg-gray-300 hover:bg-gray-400 rounded-lg text-sm font-medium transition-colors">
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{Math.floor(transaction.total)} točk bo dodanih ({Math.floor(transaction.total)} € = {Math.floor(transaction.total)} točk)
            </p>
          </div>
        ) : onAddLoyaltyPoints && (
          <button onClick={() => setShowLoyalty(true)}
            className="mb-6 w-full h-12 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-amber-300">
            <CreditCard className="w-4 h-4" />
            Dodaj točke na darilno kartico
          </button>
        )}

        <div className="flex gap-4">
          <button
            onClick={onPrintCopy}
            className="flex-1 pos-btn-secondary h-16 flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Kopija računa</span>
          </button>
          <button
            onClick={onNewTransaction}
            className="flex-1 pos-btn-confirm h-16 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Nov račun</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletionScreen;
