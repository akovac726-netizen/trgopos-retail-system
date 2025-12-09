import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Scale } from "lucide-react";

interface WeighingDialogProps {
  onConfirm: (pluCode: string, weight: number) => void;
  onClose: () => void;
}

const WeighingDialog = ({ onConfirm, onClose }: WeighingDialogProps) => {
  const [step, setStep] = useState<'plu' | 'weight'>('plu');
  const [pluCode, setPluCode] = useState("");
  const [weight, setWeight] = useState("0");

  const handleKeyPress = (key: string) => {
    if (step === 'plu') {
      if (pluCode.length < 5) {
        setPluCode(prev => prev + key);
      }
    } else {
      if (key === '.' && weight.includes('.')) return;
      setWeight(prev => prev === '0' ? key : prev + key);
    }
  };

  const handleDelete = () => {
    if (step === 'plu') {
      setPluCode(prev => prev.slice(0, -1));
    } else {
      setWeight(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
  };

  const handleConfirm = () => {
    if (step === 'plu') {
      if (pluCode.length >= 4) {
        setStep('weight');
      }
    } else {
      const w = parseFloat(weight);
      if (w > 0 && pluCode) {
        onConfirm(pluCode, w);
        onClose();
      }
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            {step === 'plu' ? 'Vnesite PLU kodo (9000+)' : 'Vnesite težo (kg)'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {step === 'plu' && (
            <div className="text-sm text-muted-foreground text-center">
              PLU kode za tehtanje se začnejo z 9000
            </div>
          )}
          
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span>{step === 'plu' ? pluCode || '____' : weight}</span>
            {step === 'weight' && <span className="text-2xl text-muted-foreground">kg</span>}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={step === 'plu' && key === '.'}
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
          
          {step === 'weight' && (
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

export default WeighingDialog;
