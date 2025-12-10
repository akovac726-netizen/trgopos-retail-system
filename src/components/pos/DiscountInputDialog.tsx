import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Percent } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface DiscountInputDialogProps {
  onConfirm: (discount: number, isPercentage: boolean) => void;
  onClose: () => void;
}

const DiscountInputDialog = ({ onConfirm, onClose }: DiscountInputDialogProps) => {
  const [value, setValue] = useState("0");
  const [isPercentage, setIsPercentage] = useState(true);

  const handleKeyPress = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    setValue(prev => prev === '0' ? key : prev + key);
  };

  const handleDelete = () => {
    setValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleConfirm = () => {
    const discount = parseFloat(value);
    if (discount > 0) {
      if (isPercentage && discount > 100) {
        return;
      }
      onConfirm(discount, isPercentage);
      onClose();
    }
  };

  const handleQuickPercent = (pct: number) => {
    onConfirm(pct, true);
    onClose();
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'];
  const quickPercentages = [10, 20, 30, 40, 50];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Popust
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="percent" onValueChange={(v) => setIsPercentage(v === 'percent')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="percent">Odstotek %</TabsTrigger>
            <TabsTrigger value="amount">Znesek €</TabsTrigger>
          </TabsList>
          
          <TabsContent value="percent" className="mt-4 space-y-4">
            <div className="grid grid-cols-5 gap-2">
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
          </TabsContent>
          
          <TabsContent value="amount" className="mt-4">
            {/* Amount input uses manual entry */}
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Ali vnesite ročno:
          </div>
          
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span>{value}</span>
            <span className="text-2xl text-muted-foreground">{isPercentage ? '%' : '€'}</span>
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

export default DiscountInputDialog;
