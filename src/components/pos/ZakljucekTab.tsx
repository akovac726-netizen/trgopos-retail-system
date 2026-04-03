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
  activeSubTab?: 'zakljucek' | 'informacije';
  onSubTabChange?: (tab: 'zakljucek' | 'informacije') => void;
}

const ZakljucekTab = ({ cashier, cashiers, transactions, closingHistory, registerId, onEndShift, onEndDay, onOpenDrawer, activeSubTab = 'zakljucek', onSubTabChange }: ZakljucekTabProps) => {
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'shift' | 'day' | null>(null);
  const [localSubTab, setLocalSubTab] = useState<'zakljucek' | 'informacije'>(activeSubTab);
  const subTab = activeSubTab || localSubTab;
  const setSubTab = onSubTabChange || setLocalSubTab;

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
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e8f4f8' }}>
      {/* Top tabs: Zaključek | Informacije - matches Diapozitiv 12 */}
      <div className="border-2 border-gray-800 bg-white mx-3 mt-3">
        <div className="px-4 py-2 font-bold text-lg border-b border-gray-400">Glavni meni:</div>
        <div className="flex">
          <button onClick={() => setSubTab('zakljucek')}
            className={`px-6 py-2 font-bold text-base border-r border-gray-400 transition-colors ${subTab === 'zakljucek' ? 'bg-sky-200' : 'bg-white hover:bg-gray-100'}`}>
            Zaključek
          </button>
          <div className="flex-1" />
          <button onClick={() => setSubTab('informacije')}
            className={`px-6 py-2 font-bold text-base transition-colors ${subTab === 'informacije' ? 'bg-sky-200' : 'bg-white hover:bg-gray-100'}`}>
            Informacije
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-auto">
        {subTab === 'zakljucek' ? (
          <div className="flex gap-6 items-start justify-center h-full pt-4">
            {/* Left column - Today's summary + empty box */}
            <div className="flex flex-col gap-4 w-80">
              <div className="border-2 border-gray-600 rounded-lg bg-amber-300 text-center py-3">
                <h3 className="font-bold text-lg">Zgodovina aktivnih<br />blagajnikov</h3>
              </div>
              <div className="border-2 border-gray-600 bg-white rounded-lg min-h-[200px]">
                {/* Empty per PDF mockup */}
              </div>
            </div>

            {/* Right column - Closing info + actions */}
            <div className="flex flex-col gap-4 w-80">
              {/* Closing info */}
              <div className="border-2 border-gray-600 rounded-lg bg-white p-4">
                <h3 className="font-bold text-xl mb-3">Zaključek blagajne</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Številka blagajne:</strong> {registerId}</p>
                  <p><strong>Status blagajne:</strong> <span className="text-green-600 font-bold">Aktivna</span></p>
                  <p><strong>Datum:</strong> {formatDateStr} <span className="ml-4"><strong>Ura:</strong> {formatTimeStr}</span></p>
                </div>
              </div>

              {/* Open drawer */}
              <button onClick={onOpenDrawer}
                className="h-14 bg-white border-2 border-gray-600 rounded-lg font-bold text-lg text-gray-800 hover:bg-gray-50 transition-colors">
                ODPRI BL. PREDAL
              </button>

              {/* Action buttons */}
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
            </div>
          </div>
        ) : (
          /* Informacije tab - matches Diapozitiv 13 */
          <div className="border-2 border-gray-800 bg-white rounded-lg p-6 max-w-2xl mx-auto mt-4">
            <h3 className="text-xl font-bold mb-4 border-b-2 border-gray-800 pb-2">Informacije (zakonsko zaščiteni moduli):</h3>
            <table className="w-full text-base">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-bold w-48">Tip programa:</td>
                  <td className="py-3">TrgoPOS</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-bold align-top">Proizvajalec:</td>
                  <td className="py-3">
                    StandBuy CMP s.p.<br />
                    Spodnja Draga 36<br />
                    1295 Ivančna Gorica
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 font-bold">Verzija programa:</td>
                  <td className="py-3">1. 01. 001</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold">Funkcija programa:</td>
                  <td className="py-3">POS davčna blagajna</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZakljucekTab;
