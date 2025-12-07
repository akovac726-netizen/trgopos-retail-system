import { ArrowLeft } from "lucide-react";
import { Transaction } from "@/types/pos";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onBack: () => void;
}

const TransactionHistory = ({ transactions, onBack }: TransactionHistoryProps) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('sl-SI', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sl-SI', { 
      day: 'numeric', 
      month: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Zgodovina transakcij</h2>
      </div>

      {/* Transactions list */}
      <div className="pos-panel flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Ni transakcij
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Datum</th>
                  <th className="text-left p-3">Ura</th>
                  <th className="text-left p-3">Blagajnik</th>
                  <th className="text-right p-3">Artiklov</th>
                  <th className="text-left p-3">Način</th>
                  <th className="text-right p-3">Znesek</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, index) => (
                  <tr 
                    key={tx.id}
                    className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="p-3 font-mono text-sm">{tx.id}</td>
                    <td className="p-3 text-sm">{formatDate(tx.timestamp)}</td>
                    <td className="p-3 font-mono text-sm">{formatTime(tx.timestamp)}</td>
                    <td className="p-3 text-sm">{tx.cashierName}</td>
                    <td className="p-3 text-right font-mono text-sm">
                      {tx.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="p-3 text-sm capitalize">{tx.paymentMethod}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {tx.total.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="mt-4 pos-panel p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Skupaj transakcij</p>
              <p className="text-2xl font-bold font-mono">{transactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skupaj artiklov</p>
              <p className="text-2xl font-bold font-mono">
                {transactions.reduce((sum, tx) => 
                  sum + tx.items.reduce((s, item) => s + item.quantity, 0), 0
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skupaj promet</p>
              <p className="text-2xl font-bold font-mono text-pos-confirm">
                {transactions.reduce((sum, tx) => sum + tx.total, 0).toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
