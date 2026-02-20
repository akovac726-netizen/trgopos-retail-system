import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Banknote, CreditCard, Receipt, Printer, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Transaction, Cashier } from "@/types/pos";
import DrawerCodeDialog from "./DrawerCodeDialog";

export interface ClosingReport {
  id: string;
  type: string;
  cashier: string;
  cashierId: string;
  date: string;
  total: number;
  cash: number;
  card: number;
  other: number;
  transactionCount: number;
  itemCount: number;
}

interface ShiftEndDialogProps {
  cashier: Cashier;
  transactions: Transaction[];
  closingHistory: ClosingReport[];
  onEndShift: (report: ClosingReport) => void;
  onEndDay: (report: ClosingReport) => void;
  onClose: () => void;
}

const ShiftEndDialog = ({ 
  cashier, 
  transactions, 
  closingHistory,
  onEndShift, 
  onEndDay, 
  onClose 
}: ShiftEndDialogProps) => {
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'shift' | 'day' | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [recapReport, setRecapReport] = useState<ClosingReport | null>(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  // Filter transactions for current cashier today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const cashierTransactions = transactions.filter(t => 
    t.cashierId === cashier.id && 
    new Date(t.timestamp) >= today
  );

  const totalCash = cashierTransactions
    .filter(t => t.paymentMethod === 'gotovina')
    .reduce((sum, t) => sum + t.total, 0);

  const totalCard = cashierTransactions
    .filter(t => t.paymentMethod === 'kartica')
    .reduce((sum, t) => sum + t.total, 0);

  const totalOther = cashierTransactions
    .filter(t => t.paymentMethod !== 'gotovina' && t.paymentMethod !== 'kartica')
    .reduce((sum, t) => sum + t.total, 0);

  const totalRevenue = cashierTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalItems = cashierTransactions.reduce((sum, t) => 
    sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Cash in drawer = cash received minus card (card goes to terminal)
  const cashInDrawer = totalCash + totalOther;

  const handleEndShift = () => {
    setPendingAction('shift');
    setShowDrawerDialog(true);
  };

  const handleEndDay = () => {
    setPendingAction('day');
    setShowDrawerDialog(true);
  };

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
    transactionCount: cashierTransactions.length,
    itemCount: totalItems,
  });

  const generateClosingPDF = (report: ClosingReport) => {
    const now = new Date();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${report.type}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:20mm;color:#111;max-width:80mm;margin:0 auto;}
      h1{font-size:16pt;margin-bottom:2mm;text-align:center;}
      .sub{color:#666;font-size:9pt;margin-bottom:6mm;text-align:center;}
      .divider{border-top:1px dashed #999;margin:4mm 0;}
      .row{display:flex;justify-content:space-between;font-size:10pt;padding:1mm 0;}
      .row.bold{font-weight:bold;font-size:12pt;}
      .section-title{font-weight:bold;font-size:10pt;margin-top:4mm;margin-bottom:2mm;}
      .total-box{border:2px solid #333;padding:4mm;margin-top:4mm;text-align:center;}
      .total-box .amount{font-size:20pt;font-weight:bold;}
      .total-box .label{font-size:9pt;color:#666;}
      .footer{text-align:center;font-size:8pt;color:#999;margin-top:8mm;}
    </style></head><body>
    <h1>${report.type}</h1>
    <div class="sub">${now.toLocaleDateString('sl-SI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br/>
    ${now.toLocaleTimeString('sl-SI')}</div>
    
    <div class="divider"></div>
    <div class="row"><span>Blagajnik:</span><span>${report.cashier}</span></div>
    <div class="row"><span>Koda:</span><span>${report.cashierId}</span></div>
    <div class="divider"></div>
    
    <div class="section-title">REKAPITULACIJA PO PLAČILIH</div>
    <div class="row"><span>Gotovina:</span><span>${report.cash.toFixed(2)} €</span></div>
    <div class="row"><span>Kartica:</span><span>${report.card.toFixed(2)} €</span></div>
    ${report.other > 0 ? `<div class="row"><span>Ostalo:</span><span>${report.other.toFixed(2)} €</span></div>` : ''}
    <div class="divider"></div>
    
    <div class="section-title">PODATKI</div>
    <div class="row"><span>Št. računov:</span><span>${report.transactionCount}</span></div>
    <div class="row"><span>Št. artiklov:</span><span>${report.itemCount}</span></div>
    <div class="divider"></div>

    <div class="row"><span>Gotovina v predalu:</span><span>${(report.cash + report.other).toFixed(2)} €</span></div>
    <div class="row"><span>Odbiti (kartica):</span><span>-${report.card.toFixed(2)} €</span></div>
    
    <div class="total-box">
      <div class="label">SKUPNI PROMET</div>
      <div class="amount">${report.total.toFixed(2)} €</div>
    </div>
    
    <div class="footer">Dokument generiran: ${now.toLocaleString('sl-SI')}</div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;
    const win = window.open('', '_blank', 'width=400,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleDrawerSuccess = () => {
    const type = pendingAction === 'shift' ? 'Zaključek izmene' : 'Dnevni zaključek';
    const report = buildReport(type);
    setRecapReport(report);
    setShowRecap(true);
    setPendingAction(null);
  };

  const handleConfirmClosing = () => {
    if (!recapReport) return;
    generateClosingPDF(recapReport);
    if (recapReport.type === 'Zaključek izmene') {
      onEndShift(recapReport);
    } else {
      onEndDay(recapReport);
    }
  };

  if (showDrawerDialog) {
    return (
      <DrawerCodeDialog
        drawerCode={cashier.drawerCode}
        onSuccess={handleDrawerSuccess}
        onClose={() => {
          setShowDrawerDialog(false);
          setPendingAction(null);
        }}
      />
    );
  }

  // Recap screen after drawer code
  if (showRecap && recapReport) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              {recapReport.type} – Rekapitulacija
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="text-sm text-muted-foreground">{recapReport.date}</div>
              <div className="text-sm text-muted-foreground">Blagajnik: {recapReport.cashier}</div>
              
              <div className="border-t border-border pt-3 space-y-2">
                <h4 className="font-semibold text-sm">Rekapitulacija po plačilih</h4>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Banknote className="w-4 h-4" /> Gotovina:
                  </span>
                  <span className="font-medium">{recapReport.cash.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="w-4 h-4" /> Kartica:
                  </span>
                  <span className="font-medium">{recapReport.card.toFixed(2)} €</span>
                </div>
                {recapReport.other > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ostalo:</span>
                    <span className="font-medium">{recapReport.other.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Št. računov:</span>
                  <span className="font-medium">{recapReport.transactionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Št. artiklov:</span>
                  <span className="font-medium">{recapReport.itemCount}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Gotovina v predalu:</span>
                  <span>{(recapReport.cash + recapReport.other).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Odbiti (kartica):</span>
                  <span>-{recapReport.card.toFixed(2)} €</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">SKUPNI PROMET:</span>
                  <span className="font-bold text-primary">{recapReport.total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConfirmClosing}
              className="w-full h-14 text-base"
            >
              <Printer className="w-5 h-5 mr-2" />
              Potrdi in natisni zaključek
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Main closing dialog with history and current state
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Blagajniški zaključek
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current state */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Trenutno stanje – {cashier.name}
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Št. računov:</span>
                <span className="font-medium">{cashierTransactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Št. artiklov:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Banknote className="w-4 h-4" /> Gotovina:
                </span>
                <span className="font-medium">{totalCash.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" /> Kartica:
                </span>
                <span className="font-medium">{totalCard.toFixed(2)} €</span>
              </div>
              {totalOther > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ostalo:</span>
                  <span className="font-medium">{totalOther.toFixed(2)} €</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gotovina v predalu:</span>
                <span className="font-medium">{cashInDrawer.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-lg mt-1">
                <span className="font-semibold">SKUPAJ PROMET:</span>
                <span className="font-bold text-primary">{totalRevenue.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full h-14 justify-start gap-3 text-base"
              onClick={handleEndDay}
            >
              <Calculator className="w-5 h-5" />
              <div className="text-left">
                <span className="block">Zaključi blagajno</span>
                <span className="text-xs opacity-70">Dnevni zaključek – shrani in natisni</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={handleEndShift}
            >
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Zaključi izmeno</span>
            </Button>
          </div>

          {/* History */}
          {closingHistory.length > 0 && (
            <div className="border-t border-border pt-3">
              <button
                onClick={() => setExpandedHistory(!expandedHistory)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                {expandedHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Pretekli zaključki ({closingHistory.length})
              </button>
              {expandedHistory && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                  {closingHistory.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{r.type}</p>
                        <p className="text-xs text-muted-foreground">{r.date} · {r.cashier}</p>
                      </div>
                      <span className="font-bold">{r.total.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftEndDialog;
