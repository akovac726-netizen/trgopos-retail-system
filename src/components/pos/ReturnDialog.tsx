import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, RotateCcw } from "lucide-react";

interface ReturnDialogProps {
  onConfirm: (ean: string, quantity: number, price: number) => void;
  onClose: () => void;
}

const ReturnDialog = ({ onConfirm, onClose }: ReturnDialogProps) => {
  const [step, setStep] = useState<'ean' | 'quantity' | 'price'>('ean');
  const [ean, setEan] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");

  const handleKeyPress = (key: string) => {
    if (step === 'ean') {
      if (ean.length < 13) {
        setEan(prev => prev + key);
      }
    } else if (step === 'quantity') {
      if (key === '.') return;
      setQuantity(prev => prev === '1' ? key : prev + key);
    } else {
      if (key === '.' && price.includes('.')) return;
      setPrice(prev => prev + key);
    }
  };

  const handleDelete = () => {
    if (step === 'ean') {
      setEan(prev => prev.slice(0, -1));
    } else if (step === 'quantity') {
      setQuantity(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
    } else {
      setPrice(prev => prev.slice(0, -1));
    }
  };

  const handleConfirm = () => {
    if (step === 'ean') {
      if (ean.length >= 8) {
        setStep('quantity');
      }
    } else if (step === 'quantity') {
      setStep('price');
    } else {
      const qty = parseInt(quantity);
      const p = parseFloat(price);
      if (qty > 0 && p > 0 && ean) {
        onConfirm(ean, qty, p);
        onClose();
      }
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  const getTitle = () => {
    switch (step) {
      case 'ean': return 'Vnesite EAN kodo vračila';
      case 'quantity': return 'Vnesite količino';
      case 'price': return 'Vnesite ceno artikla';
    }
  };

  const getValue = () => {
    switch (step) {
      case 'ean': return ean || '_____________';
      case 'quantity': return quantity;
      case 'price': return price || '0.00';
    }
  };

  const getSuffix = () => {
    switch (step) {
      case 'ean': return '';
      case 'quantity': return 'kos';
      case 'price': return '€';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-500" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-500/10 text-orange-600 p-3 rounded-lg text-center text-sm">
            Vnašanje vračila - znesek bo odštet od računa
          </div>
          
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span className={step === 'ean' ? 'font-mono text-2xl' : ''}>{getValue()}</span>
            {getSuffix() && <span className="text-2xl text-muted-foreground">{getSuffix()}</span>}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={step === 'quantity' && key === '.'}
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
              className="h-14 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CornerDownLeft className="w-5 h-5" />
              <span>{step === 'price' ? 'Potrdi vračilo' : 'Naprej'}</span>
            </button>
          </div>
          
          {step !== 'ean' && (
            <button
              onClick={() => setStep(step === 'quantity' ? 'ean' : 'quantity')}
              className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Nazaj
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDialog;
