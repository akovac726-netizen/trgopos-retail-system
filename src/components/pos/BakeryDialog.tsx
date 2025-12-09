import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Cookie } from "lucide-react";

interface BakeryDialogProps {
  onConfirm: (pluCode: string, quantity: number) => void;
  onClose: () => void;
}

const BakeryDialog = ({ onConfirm, onClose }: BakeryDialogProps) => {
  const [step, setStep] = useState<'plu' | 'quantity'>('plu');
  const [pluCode, setPluCode] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleKeyPress = (key: string) => {
    if (step === 'plu') {
      if (pluCode.length < 5) {
        setPluCode(prev => prev + key);
      }
    } else {
      if (key === '.') return; // No decimals for bakery quantity
      setQuantity(prev => prev === '0' || prev === '1' ? key : prev + key);
    }
  };

  const handleDelete = () => {
    if (step === 'plu') {
      setPluCode(prev => prev.slice(0, -1));
    } else {
      setQuantity(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
    }
  };

  const handleConfirm = () => {
    if (step === 'plu') {
      if (pluCode.length >= 4) {
        setStep('quantity');
      }
    } else {
      const qty = parseInt(quantity);
      if (qty > 0 && pluCode) {
        onConfirm(pluCode, qty);
        onClose();
      }
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];
  const quickQuantities = [1, 2, 3, 4, 5, 6];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            {step === 'plu' ? 'Vnesite PLU kodo dopeke (1000+)' : 'Vnesite količino'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'plu' && (
            <div className="text-sm text-muted-foreground text-center">
              PLU kode za dopeko se začnejo z 1000
            </div>
          )}
          
          {step === 'quantity' && (
            <div className="grid grid-cols-3 gap-2">
              {quickQuantities.map((qty) => (
                <button
                  key={qty}
                  onClick={() => {
                    onConfirm(pluCode, qty);
                    onClose();
                  }}
                  className="h-12 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                >
                  {qty}x
                </button>
              ))}
            </div>
          )}
          
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span>{step === 'plu' ? pluCode || '____' : quantity}</span>
            {step === 'quantity' && <span className="text-2xl text-muted-foreground">kos</span>}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={key === '.'}
                className="h-14 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-30"
              >
                {key}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDelete}
              className="h-14 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Delete className="w-5 h-5" />
              <span>Briši</span>
            </button>
            <button
              onClick={handleConfirm}
              className="h-14 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CornerDownLeft className="w-5 h-5" />
              <span>{step === 'plu' ? 'Naprej' : 'Potrdi'}</span>
            </button>
          </div>
          
          {step === 'quantity' && (
            <button
              onClick={() => setStep('plu')}
              className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Nazaj na PLU
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BakeryDialog;
