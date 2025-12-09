import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft } from "lucide-react";

interface QuantityInputDialogProps {
  currentQuantity: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
}

const QuantityInputDialog = ({ currentQuantity, onConfirm, onClose }: QuantityInputDialogProps) => {
  const [value, setValue] = useState(currentQuantity.toString());

  const handleKeyPress = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    setValue(prev => prev === '0' ? key : prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleConfirm = () => {
    const qty = parseFloat(value);
    if (qty > 0) {
      onConfirm(qty);
      onClose();
    }
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vnesite količino</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg">
            {value}
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="h-14 text-xl font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
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
              <span>Potrdi</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuantityInputDialog;
