import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, Calculator, DoorOpen, Calendar, Banknote, CreditCard, Receipt } from "lucide-react";
import { Transaction, Cashier } from "@/types/pos";
import DrawerCodeDialog from "./DrawerCodeDialog";

interface ShiftEndDialogProps {
  cashier: Cashier;
  transactions: Transaction[];
  onEndShift: () => void;
  onEndDay: () => void;
  onOpenDrawer: () => void;
  onClose: () => void;
}

const ShiftEndDialog = ({ 
  cashier, 
  transactions, 
  onEndShift, 
  onEndDay, 
  onOpenDrawer,
  onClose 
}: ShiftEndDialogProps) => {
  const [showDrawerDialog, setShowDrawerDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'shift' | 'day' | 'drawer' | null>(null);

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

  const handleOpenDrawer = () => {
    setPendingAction('drawer');
    setShowDrawerDialog(true);
  };

  const handleEndShift = () => {
    setPendingAction('shift');
    setShowDrawerDialog(true);
  };

  const handleEndDay = () => {
    setPendingAction('day');
    setShowDrawerDialog(true);
  };

  const handleDrawerSuccess = () => {
    if (pendingAction === 'drawer') {
      onOpenDrawer();
    } else if (pendingAction === 'shift') {
      onEndShift();
    } else if (pendingAction === 'day') {
      onEndDay();
    }
    setPendingAction(null);
    onClose();
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Zaključek - {cashier.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Izkupiček blagajnika (danes)
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Št. transakcij:</span>
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
                  <Banknote className="w-4 h-4" />
                  Gotovina:
                </span>
                <span className="font-medium">{totalCash.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  Kartica:
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
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">SKUPAJ:</span>
                <span className="font-bold text-primary">{totalRevenue.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-3"
              onClick={handleOpenDrawer}
            >
              <DoorOpen className="w-5 h-5 text-amber-600" />
              <span>Odpri blagajniški predal</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-3"
              onClick={handleEndShift}
            >
              <LogOut className="w-5 h-5 text-blue-600" />
              <span>Zaključi izmeno</span>
            </Button>

            <Button
              variant="destructive"
              className="w-full h-14 justify-start gap-3"
              onClick={handleEndDay}
            >
              <Calendar className="w-5 h-5" />
              <span>Zaključi blagajno (celoten dan)</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftEndDialog;
