import { useState } from "react";
import { Transaction } from "@/types/pos";
import ManagerCodeDialog from "./ManagerCodeDialog";
import { toast } from "sonner";

interface RacuniTabProps {
  transactions: Transaction[];
  onPrintReceipt: (transaction: Transaction) => void;
  onPrintInvoice: (transaction: Transaction) => void;
  onCopyToNew: (transaction: Transaction) => void;
  onVoidReceipt: (transaction: Transaction) => void;
}

const RacuniTab = ({ transactions, onPrintReceipt, onPrintInvoice, onCopyToNew, onVoidReceipt }: RacuniTabProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showManagerCode, setShowManagerCode] = useState(false);
  const [pendingAction, setPendingAction] = useState<'copy' | 'void' | null>(null);

  const filteredTransactions = transactions.filter(t =>
    t.id.includes(searchQuery) || t.cashierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => new Date(date).toLocaleString('sl-SI', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('sl-SI');

  const handleAction = (action: 'copy' | 'void') => {
    if (!selectedTransaction) { toast.warning('Izberite račun'); return; }
    setPendingAction(action);
    setShowManagerCode(true);
  };

  const handleManagerSuccess = () => {
    if (!selectedTransaction) return;
    if (pendingAction === 'copy') onCopyToNew(selectedTransaction);
    else if (pendingAction === 'void') onVoidReceipt(selectedTransaction);
    setPendingAction(null);
    setShowManagerCode(false);
    setSelectedTransaction(null);
  };

  if (showManagerCode) {
    return <ManagerCodeDialog
      title={pendingAction === 'copy' ? 'Koda poslovodje za kopiranje' : 'Koda poslovodje za storno'}
      onSuccess={handleManagerSuccess}
      onClose={() => { setShowManagerCode(false); setPendingAction(null); }}
    />;
  }

  return (
    <div className="h-full flex flex-col p-4" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* Title */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Računi:</h2>
        <div className="h-0.5 bg-sky-400 my-1" />
        <p className="text-center text-sm text-gray-600">Dnevna evidenca izdanih blagajniških računov</p>
      </div>

      {/* Table */}
      <div className="flex-1 border border-gray-400 bg-white rounded overflow-hidden flex flex-col mb-3">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-white border-b border-gray-400 text-sm font-bold text-gray-700">
          <div>Števila računa</div>
          <div>Datum in ura</div>
          <div>Blagajnik</div>
          <div>Znesek računa</div>
          <div>FuRS</div>
        </div>
        {/* Table body */}
        <div className="flex-1 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Ni računov</div>
          ) : (
            filteredTransactions.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTransaction(t)}
                className={`grid grid-cols-5 gap-2 px-3 py-2 text-sm cursor-pointer border-b border-gray-200 transition-colors ${
                  selectedTransaction?.id === t.id ? 'bg-sky-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">#{t.id}</div>
                <div>{formatDate(t.timestamp)} {formatTime(t.timestamp)}</div>
                <div>{t.cashierName}</div>
                <div className="font-medium">{t.total.toFixed(2)} €</div>
                <div className="text-gray-400">-</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action buttons - matching screenshot layout */}
      <div className="grid grid-cols-3 gap-2 mb-1">
        <button
          onClick={() => { if (selectedTransaction) toast.info(`Pregled računa #${selectedTransaction.id}`); else toast.warning('Izberite račun'); }}
          className="h-12 bg-white border-2 border-gray-400 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Pregled računa
        </button>
        <button
          onClick={() => { if (selectedTransaction) onPrintReceipt(selectedTransaction); else toast.warning('Izberite račun'); }}
          className="h-12 bg-white border-2 border-gray-400 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Tiskaj račun
        </button>
        <button
          onClick={() => setSearchQuery(prompt('Vnesite iskalni niz:') || '')}
          className="h-12 bg-white border-2 border-gray-400 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Najdi račun
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { if (selectedTransaction) onPrintInvoice(selectedTransaction); else toast.warning('Izberite račun'); }}
          className="h-12 bg-white border-2 border-gray-400 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Izpiši fakturo
        </button>
        <button
          onClick={() => handleAction('copy')}
          className="h-12 bg-white border-2 border-gray-400 rounded-lg font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Kopiraj v nov
        </button>
        <button
          onClick={() => handleAction('void')}
          className="h-12 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors"
        >
          Storniraj račun
        </button>
      </div>
    </div>
  );
};

export default RacuniTab;
