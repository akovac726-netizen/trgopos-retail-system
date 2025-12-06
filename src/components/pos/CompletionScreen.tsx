import { CheckCircle2, Printer, RotateCcw, Receipt } from "lucide-react";
import { Transaction } from "@/types/pos";

interface CompletionScreenProps {
  transaction: Transaction;
  onNewTransaction: () => void;
  onPrintCopy: () => void;
}

const CompletionScreen = ({ transaction, onNewTransaction, onPrintCopy }: CompletionScreenProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
