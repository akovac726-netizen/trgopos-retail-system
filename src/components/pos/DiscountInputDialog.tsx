import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Percent } from "lucide-react";

interface DiscountInputDialogProps {
  onConfirm: (discount: number, isPercentage: boolean) => void;
  onClose: () => void;
}

const DiscountInputDialog = ({ onConfirm, onClose }: DiscountInputDialogProps) => {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<'quick' | 'manual'>('quick');

  const quickPercentages = [10, 20, 30, 50];

  const handleKeyPress = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    setValue(prev => prev === '' ? key : prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    const discount = parseFloat(value);
    if (!isNaN(discount) && discount > 0 && discount <= 100) {
      onConfirm(discount, true);
      onClose();
    }
  };

  const handleQuickPercent = (pct: number) => {
    onConfirm(pct, true);
    onClose();
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Popust
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quick percentages */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Hitri popusti:</p>
            <div className="grid grid-cols-4 gap-2">
              {quickPercentages.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleQuickPercent(pct)}
                  className="h-14 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-lg transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ali ročno</span>
            </div>
          </div>

          {/* Manual entry display */}
          <div className="text-center text-4xl font-bold py-3 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span>{value || '0'}</span>
            <span className="text-2xl text-muted-foreground">%</span>
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
              className="h-12 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Delete className="w-4 h-4" />
              <span>Briši</span>
            </button>
            <button
              onClick={handleConfirm}
              disabled={!value || parseFloat(value) <= 0 || parseFloat(value) > 100}
              className="h-12 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>Potrdi</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountInputDialog;
