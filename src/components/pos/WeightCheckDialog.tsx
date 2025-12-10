import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scale, RefreshCw } from "lucide-react";

interface WeightCheckDialogProps {
  onClose: () => void;
}

const WeightCheckDialog = ({ onClose }: WeightCheckDialogProps) => {
  const [weight, setWeight] = useState(0);
  const [isStable, setIsStable] = useState(true);

  // Simulate weight reading (in real system would connect to scale)
  useEffect(() => {
    // Simulate initial weight detection
    const timer = setTimeout(() => {
      setWeight(0.000);
      setIsStable(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleTare = () => {
    setIsStable(false);
    setTimeout(() => {
      setWeight(0.000);
      setIsStable(true);
    }, 300);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Preveri težo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground text-center">
            Položite artikel na tehtnico
          </div>

          {/* Weight display */}
          <div className="bg-muted rounded-xl p-8">
            <div className="text-center">
              <div className={`text-5xl font-mono font-bold transition-opacity ${isStable ? 'opacity-100' : 'opacity-50'}`}>
                {weight.toFixed(3)}
              </div>
              <div className="text-2xl text-muted-foreground mt-2">kg</div>
            </div>
            
            <div className="flex justify-center mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isStable 
                  ? 'bg-green-500/20 text-green-600' 
                  : 'bg-amber-500/20 text-amber-600'
              }`}>
                {isStable ? 'Stabilno' : 'Merjenje...'}
              </span>
            </div>
          </div>

          {/* Tare button */}
          <button
            onClick={handleTare}
            className="w-full h-14 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Tariranje (postavi na 0)</span>
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Opomba: V produkciji se tehtnica poveže preko USB/RS232
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeightCheckDialog;
