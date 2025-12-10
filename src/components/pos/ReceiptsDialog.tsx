import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Receipt, 
  Search, 
  Printer, 
  FileText, 
  Copy, 
  XCircle,
  Eye,
  ChevronLeft
} from "lucide-react";
import { Transaction } from "@/types/pos";
import ManagerCodeDialog from "./ManagerCodeDialog";

interface ReceiptsDialogProps {
  transactions: Transaction[];
  onPrintReceipt: (transaction: Transaction) => void;
  onPrintInvoice: (transaction: Transaction) => void;
  onCopyToNew: (transaction: Transaction) => void;
  onVoidReceipt: (transaction: Transaction) => void;
  onClose: () => void;
}

const ReceiptsDialog = ({ 
  transactions, 
  onPrintReceipt, 
  onPrintInvoice,
  onCopyToNew,
  onVoidReceipt,
  onClose 
}: ReceiptsDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showManagerCode, setShowManagerCode] = useState(false);
  const [pendingAction, setPendingAction] = useState<'copy' | 'void' | null>(null);

  const filteredTransactions = transactions.filter(t => 
    t.id.includes(searchQuery) ||
    t.cashierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('sl-SI', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sl-SI');
  };

  const handleCopyToNew = () => {
    if (!selectedTransaction) return;
    setPendingAction('copy');
    setShowManagerCode(true);
  };

  const handleVoidReceipt = () => {
    if (!selectedTransaction) return;
    setPendingAction('void');
    setShowManagerCode(true);
  };

  const handleManagerCodeSuccess = () => {
    if (!selectedTransaction) return;
    if (pendingAction === 'copy') {
      onCopyToNew(selectedTransaction);
    } else if (pendingAction === 'void') {
      onVoidReceipt(selectedTransaction);
    }
    setPendingAction(null);
    setShowManagerCode(false);
    onClose();
  };

  if (showManagerCode) {
    return (
      <ManagerCodeDialog
        title={pendingAction === 'copy' ? 'Koda poslovodje za kopiranje' : 'Koda poslovodje za storno'}
        onSuccess={handleManagerCodeSuccess}
        onClose={() => {
          setShowManagerCode(false);
          setPendingAction(null);
        }}
      />
    );
  }

  // Detail view
  if (selectedTransaction) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              Račun #{selectedTransaction.id}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Receipt info */}
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Datum:</span>
                <span>{formatDate(selectedTransaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Čas:</span>
                <span>{formatTime(selectedTransaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blagajnik:</span>
                <span>{selectedTransaction.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Način plačila:</span>
                <span className="capitalize">{selectedTransaction.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border rounded-lg divide-y">
              {selectedTransaction.items.map((item, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x @ {item.price.toFixed(2)} €
                    </p>
                  </div>
                  <span className="font-medium">
                    {(item.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-muted rounded-lg p-4">
              {selectedTransaction.discount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Popust:</span>
                  <span className="text-destructive">-{selectedTransaction.discount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>SKUPAJ:</span>
                <span>{selectedTransaction.total.toFixed(2)} €</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => onPrintReceipt(selectedTransaction)}
              >
                <Printer className="w-4 h-4 mr-2" />
                Tiskaj račun
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => onPrintInvoice(selectedTransaction)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Izpiši fakturo
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={handleCopyToNew}
              >
                <Copy className="w-4 h-4 mr-2" />
                Kopiraj v nov
              </Button>
              <Button
                variant="destructive"
                className="h-12"
                onClick={handleVoidReceipt}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Storniraj račun
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // List view
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Računi
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Išči po št. računa ali blagajniku..."
              className="pl-10"
            />
          </div>

          {/* Transactions list */}
          <div className="max-h-[400px] overflow-y-auto border rounded-lg divide-y">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Ni najdenih računov
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTransaction(t)}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="font-medium">Račun #{t.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(t.timestamp)} {formatTime(t.timestamp)} • {t.cashierName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{t.total.toFixed(2)} €</span>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptsDialog;
