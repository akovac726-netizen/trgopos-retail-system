import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Banknote, CreditCard, Check, SplitSquareHorizontal } from "lucide-react";
import { InvoiceData } from "@/types/pos";
import { toast } from "sonner";

interface PartialPaymentDialogProps {
  total: number;
  onConfirm: (cashAmount: number, cardAmount: number, invoiceData?: InvoiceData) => void;
  onClose: () => void;
}

const PartialPaymentDialog = ({ total, onConfirm, onClose }: PartialPaymentDialogProps) => {
  const [cashInput, setCashInput] = useState("");

  const formatPrice = (price: number) =>
    price.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cashAmount = parseFloat(cashInput) || 0;
  const cardAmount = Math.max(0, total - cashAmount);
  const isValid = cashAmount > 0 && cashAmount < total;

  const handleKeyPress = (key: string) => {
    if (key === '.' && cashInput.includes('.')) return;
    setCashInput(prev => prev === '' ? key : prev + key);
  };

  const handleDelete = () => {
    setCashInput(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (!isValid) {
      toast.error('Znesek gotovine mora biti večji od 0 in manjši od skupnega zneska');
      return;
    }
    onConfirm(cashAmount, cardAmount);
  };

  const quickAmounts = [5, 10, 20, 50].filter(a => a < total);
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="w-5 h-5" />
            Kombinirano plačilo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Za plačilo skupaj</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(total)} €</p>
          </div>

          {/* Split display */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-lg p-3 text-center border-2 ${cashAmount > 0 ? 'border-green-500 bg-green-500/10' : 'border-border bg-muted/50'}`}>
              <Banknote className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs text-muted-foreground">Gotovina</p>
              <p className="text-xl font-bold">{formatPrice(cashAmount)} €</p>
            </div>
            <div className={`rounded-lg p-3 text-center border-2 ${cardAmount > 0 && cashAmount > 0 ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-muted/50'}`}>
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs text-muted-foreground">Kartica</p>
              <p className="text-xl font-bold">{formatPrice(cashAmount > 0 ? cardAmount : 0)} €</p>
            </div>
          </div>

          {/* Quick amounts */}
          {quickAmounts.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setCashInput(amt.toString())}
                  className="h-10 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors"
                >
                  {amt}€
                </button>
              ))}
            </div>
          )}

          {/* Cash input display */}
          <div className="text-center text-3xl font-bold py-3 bg-muted rounded-lg">
            <span className="text-muted-foreground text-lg mr-1">Gotovina:</span>
            {cashInput || '0'} €
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="h-12 text-lg font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDelete}
              className="h-12 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium transition-colors"
            >
              Briši
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isValid}
              className="h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              Potrdi
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartialPaymentDialog;
