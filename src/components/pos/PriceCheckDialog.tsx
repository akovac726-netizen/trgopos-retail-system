import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Tag } from "lucide-react";
import { Product } from "@/types/inventory";

interface PriceCheckDialogProps {
  products: Product[];
  pluProducts: Record<string, { name: string; pricePerKg?: number; pricePerUnit?: number }>;
  onClose: () => void;
}

const PriceCheckDialog = ({ products, pluProducts, onClose }: PriceCheckDialogProps) => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{ name: string; price: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleKeyPress = (key: string) => {
    if (code.length < 13) {
      setCode(prev => prev + key);
      setResult(null);
      setNotFound(false);
    }
  };

  const handleDelete = () => {
    setCode(prev => prev.slice(0, -1));
    setResult(null);
    setNotFound(false);
  };

  const handleConfirm = () => {
    if (!code) return;

    // Check regular products by EAN
    const product = products.find(p => p.ean === code);
    if (product) {
      setResult({ name: product.name, price: `${product.price.toFixed(2)} €` });
      return;
    }

    // Check PLU products
    const pluProduct = pluProducts[code];
    if (pluProduct) {
      if (pluProduct.pricePerKg) {
        setResult({ name: pluProduct.name, price: `${pluProduct.pricePerKg.toFixed(2)} €/kg` });
      } else if (pluProduct.pricePerUnit) {
        setResult({ name: pluProduct.name, price: `${pluProduct.pricePerUnit.toFixed(2)} €/kos` });
      }
      return;
    }

    setNotFound(true);
  };

  const handleClear = () => {
    setCode("");
    setResult(null);
    setNotFound(false);
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'C'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Preveri ceno
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Vnesite EAN ali PLU kodo artikla
          </div>

          <div className="text-center text-3xl font-bold py-4 bg-muted rounded-lg font-mono">
            {code || '____________'}
          </div>

          {result && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-lg font-medium">{result.name}</p>
              <p className="text-2xl font-bold text-primary mt-1">{result.price}</p>
            </div>
          )}

          {notFound && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center text-destructive">
              Artikel ni najden
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => key === 'C' ? handleClear() : handleKeyPress(key)}
                className={`h-14 text-xl font-medium rounded-lg transition-colors ${
                  key === 'C' 
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-600' 
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
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
              disabled={!code}
              className="h-14 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <CornerDownLeft className="w-5 h-5" />
              <span>Preveri</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceCheckDialog;
