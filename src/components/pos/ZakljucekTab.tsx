import { useState } from "react";
import { toast } from "sonner";
import { Cashier, Transaction } from "@/types/pos";
import { ClosingReport } from "./ShiftEndDialog";
import DrawerCodeDialog from "./DrawerCodeDialog";
import { Receipt, BookOpen } from "lucide-react";

interface ZakljucekTabProps {
  cashier: Cashier;
  cashiers: Cashier[];
  transactions: Transaction[];
  closingHistory: ClosingReport[];
  registerId: number;
  onEndShift: (report: ClosingReport) => void;
  onEndDay: (report: ClosingReport) => void;
  onOpenDrawer: () => void;
}

const ZakljucekTab = ({ cashier, cashiers, transactions, closingHistory, registerId, onEndShift, onEndDay, onOpenDrawer }: ZakljucekTabProps) => {
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'shift' | 'day' | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTransactions = transactions.filter(t => new Date(t.timestamp) >= today);
  const totalCash = todayTransactions.filter(t => t.paymentMethod === 'gotovina').reduce((s, t) => s + t.total, 0);
  const totalCard = todayTransactions.filter(t => t.paymentMethod === 'kartica').reduce((s, t) => s + t.total, 0);
  const totalOther = todayTransactions.filter(t => t.paymentMethod !== 'gotovina' && t.paymentMethod !== 'kartica').reduce((s, t) => s + t.total, 0);
  const totalRevenue = todayTransactions.reduce((s, t) => s + t.total, 0);
  const totalItems = todayTransactions.reduce((s, t) => s + t.items.reduce((is, i) => is + i.quantity, 0), 0);

  const now = new Date();
  const formatDateStr = now.toLocaleDateString('sl-SI');
  const formatTimeStr = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

  const buildReport = (type: string): ClosingReport => ({
    id: Date.now().toString(), type, cashier: cashier.name, cashierId: cashier.id,
    date: new Date().toLocaleString('sl-SI'), total: totalRevenue, cash: totalCash,
    card: totalCard, other: totalOther, transactionCount: todayTransactions.length, itemCount: totalItems,
  });

  const handleClosingAction = (action: 'shift' | 'day') => {
    setPendingAction(action);
    setShowDrawerDialog(true);
  };

  const handleDrawerSuccess = () => {
    const type = pendingAction === 'shift' ? 'Izkupiček' : 'Zaključek blagajne';
    const report = buildReport(type);
    if (pendingAction === 'shift') onEndShift(report);
    else onEndDay(report);
  };

  if (showDrawerDialog) {
    return <DrawerCodeDialog
      drawerCode={cashier.drawerCode}
      onSuccess={handleDrawerSuccess}
      onClose={() => { setShowDrawerDialog(false); setPendingAction(null); }}
    />;
  }

  return (
    <div className="h-full flex items-center justify-center gap-8 p-6 overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* Left - Today's summary */}
      <div className="flex flex-col w-80">
        <div className="border-2 border-gray-600 rounded-t-lg bg-amber-300 text-center py-3">
          <h3 className="font-bold text-lg">Dnevni pregled<br />Blagajna {registerId}</h3>
        </div>
        <div className="border-2 border-t-0 border-gray-600 bg-white rounded-b-lg p-4 min-h-[250px] space-y-2">
          <div className="flex justify-between text-sm"><span>Gotovina:</span><strong>{totalCash.toFixed(2)} €</strong></div>
          <div className="flex justify-between text-sm"><span>Kartica:</span><strong>{totalCard.toFixed(2)} €</strong></div>
          {totalOther > 0 && <div className="flex justify-between text-sm"><span>Ostalo:</span><strong>{totalOther.toFixed(2)} €</strong></div>}
          <div className="border-t border-gray-300 pt-2 flex justify-between text-sm"><span>Št. računov:</span><strong>{todayTransactions.length}</strong></div>
          <div className="flex justify-between text-sm"><span>Št. artiklov:</span><strong>{totalItems}</strong></div>
          <div className="border-t border-gray-300 pt-2 flex justify-between text-base font-bold"><span>SKUPAJ:</span><span>{totalRevenue.toFixed(2)} €</span></div>
        </div>
      </div>

      {/* Right - Closing info and actions */}
      <div className="flex flex-col gap-4 w-80">
        {/* Closing info */}
        <div className="border-2 border-gray-600 rounded-lg bg-white p-4">
          <h3 className="font-bold text-xl mb-3">Zaključek blagajne</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Številka blagajne:</strong> {registerId}</p>
            <p><strong>Blagajnik:</strong> {cashier.name}</p>
            <p><strong>Status blagajne:</strong> <span className="text-green-600 font-bold">Aktivna</span></p>
            <p><strong>Datum:</strong> {formatDateStr} <span className="ml-4"><strong>Ura:</strong> {formatTimeStr}</span></p>
          </div>
        </div>

        {/* Open drawer */}
        <button onClick={onOpenDrawer}
          className="h-14 bg-white border-2 border-gray-600 rounded-lg font-bold text-lg text-gray-800 hover:bg-gray-50 transition-colors">
          ODPRI BL. PREDAL
        </button>

        {/* Action buttons - Izkupiček (amber, no logout) + Zaključi (red, logout + lock) */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleClosingAction('shift')}
            className="h-24 bg-amber-400 hover:bg-amber-500 rounded-lg font-bold text-sm text-gray-800 flex flex-col items-center justify-center gap-2 transition-colors border-2 border-amber-500">
            <Receipt className="w-8 h-8" />
            <span>Izkupiček<br />blagajnika</span>
          </button>
          <button onClick={() => handleClosingAction('day')}
            className="h-24 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm text-white flex flex-col items-center justify-center gap-2 transition-colors border-2 border-red-700">
            <BookOpen className="w-8 h-8" />
            <span>Zaključi<br />blagajno</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Izkupiček = tisk poročila (brez odjave)<br />
          Zaključi = zaklene blagajno za danes
        </p>
      </div>
    </div>
  );
};

export default ZakljucekTab;
