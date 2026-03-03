import { useState } from "react";
import { toast } from "sonner";
import { Cashier, Transaction } from "@/types/pos";
import { ClosingReport } from "./ShiftEndDialog";
import DrawerCodeDialog from "./DrawerCodeDialog";

interface ZakljucekTabProps {
  cashier: Cashier;
  cashiers: Cashier[];
  transactions: Transaction[];
  closingHistory: ClosingReport[];
  onEndShift: (report: ClosingReport) => void;
  onEndDay: (report: ClosingReport) => void;
  onOpenDrawer: () => void;
}

const ZakljucekTab = ({ cashier, cashiers, transactions, closingHistory, onEndShift, onEndDay, onOpenDrawer }: ZakljucekTabProps) => {
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
  const formatDate = now.toLocaleDateString('sl-SI');
  const formatTime = now.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });

  const buildReport = (type: string): ClosingReport => ({
    id: Date.now().toString(),
    type,
    cashier: cashier.name,
    cashierId: cashier.id,
    date: new Date().toLocaleString('sl-SI'),
    total: totalRevenue,
    cash: totalCash,
    card: totalCard,
    other: totalOther,
    transactionCount: todayTransactions.length,
    itemCount: totalItems,
  });

  const handleClosingAction = (action: 'shift' | 'day') => {
    setPendingAction(action);
    setShowDrawerDialog(true);
  };

  const handleDrawerSuccess = () => {
    const type = pendingAction === 'shift' ? 'Zaključek izmene' : 'Dnevni zaključek';
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
    <div className="h-full flex gap-6 p-4" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* Left - Active cashiers history */}
      <div className="flex-1 flex flex-col">
        <div className="border-2 border-gray-600 rounded-lg bg-white">
          <div className="text-center py-3 border-b border-gray-400">
            <h3 className="font-bold text-lg">Zgodovina aktivnih blagajnikov</h3>
          </div>
          <div className="p-4 min-h-[200px] space-y-1">
            {cashiers.map((c, i) => (
              <p key={c.id} className="text-sm">{i + 1}. {c.name} ({c.id})</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Closing info and actions */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Closing info panel */}
        <div className="border-2 border-gray-600 rounded-lg bg-white p-4">
          <h3 className="font-bold text-lg mb-3">Zaključek blagajne</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Številka blagajne:</strong> 1</p>
            <p><strong>Status blagajne:</strong> Aktivna</p>
            <p><strong>Datum:</strong> {formatDate} <span className="ml-4"><strong>Ura:</strong> {formatTime}</span></p>
            <p><strong>Promet:</strong> {totalRevenue.toFixed(2)} €</p>
            <p><strong>Št. računov:</strong> {todayTransactions.length}</p>
          </div>
        </div>

        {/* Open drawer button */}
        <button
          onClick={onOpenDrawer}
          className="h-14 bg-white border-2 border-gray-600 rounded-lg font-bold text-lg text-gray-800 hover:bg-gray-50 transition-colors"
        >
          ODPRI BL. PREDAL
        </button>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClosingAction('shift')}
            className="h-20 bg-amber-400 hover:bg-amber-500 rounded-lg font-bold text-sm text-gray-800 flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <span className="text-2xl">🧾</span>
            <span>Izkupiček blagajnika</span>
          </button>
          <button
            onClick={() => handleClosingAction('day')}
            className="h-20 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-sm text-white flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span>Zaključi blagajno</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZakljucekTab;
