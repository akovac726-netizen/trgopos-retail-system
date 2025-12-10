import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Delete, CornerDownLeft, Cookie } from "lucide-react";

// Import bakery images
import kruhBeli from "@/assets/bakery/kruh-beli.png";
import kruhCrni from "@/assets/bakery/kruh-crni.png";
import kruhSemeni from "@/assets/bakery/kruh-semeni.png";
import kruhKoruzni from "@/assets/bakery/kruh-koruzni.png";
import zemljeBele from "@/assets/bakery/zemlje-bele.png";
import zemljeCrne from "@/assets/bakery/zemlje-crne.png";
import zemljeSemeni from "@/assets/bakery/zemlje-semeni.png";
import kajzarice from "@/assets/bakery/kajzarice.png";
import lepinje from "@/assets/bakery/lepinje.png";
import maleLepinje from "@/assets/bakery/male-lepinje.png";

interface BakeryProduct {
  plu: string;
  name: string;
  price: number;
  image: string;
}

const bakeryProducts: BakeryProduct[] = [
  { plu: '1001', name: 'Kruh beli', price: 1.89, image: kruhBeli },
  { plu: '1002', name: 'Kruh črni', price: 2.19, image: kruhCrni },
  { plu: '1003', name: 'Kruh z semeni', price: 2.49, image: kruhSemeni },
  { plu: '1004', name: 'Kruh koruzni', price: 2.29, image: kruhKoruzni },
  { plu: '1005', name: 'Domače bele žemlje', price: 0.39, image: zemljeBele },
  { plu: '1006', name: 'Domače črne žemlje', price: 0.45, image: zemljeCrne },
  { plu: '1007', name: 'Domače semeni žemlje', price: 0.49, image: zemljeSemeni },
  { plu: '1008', name: 'Domače kajzarice', price: 0.35, image: kajzarice },
  { plu: '1009', name: 'Domače lepinje', price: 0.59, image: lepinje },
  { plu: '1010', name: 'Domače male lepinje', price: 0.45, image: maleLepinje },
];

interface BakeryDialogProps {
  onConfirm: (pluCode: string, quantity: number) => void;
  onClose: () => void;
}

const BakeryDialog = ({ onConfirm, onClose }: BakeryDialogProps) => {
  const [selectedProduct, setSelectedProduct] = useState<BakeryProduct | null>(null);
  const [quantity, setQuantity] = useState("1");

  const handleKeyPress = (key: string) => {
    if (key === '.') return; // No decimals for bakery quantity
    setQuantity(prev => prev === '0' || prev === '1' ? key : prev + key);
  };

  const handleDelete = () => {
    setQuantity(prev => prev.length > 1 ? prev.slice(0, -1) : '1');
  };

  const handleConfirm = () => {
    if (selectedProduct) {
      const qty = parseInt(quantity);
      if (qty > 0) {
        onConfirm(selectedProduct.plu, qty);
        onClose();
      }
    }
  };

  const handleQuickSelect = (product: BakeryProduct, qty: number) => {
    onConfirm(product.plu, qty);
    onClose();
  };

  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'C'];
  const quickQuantities = [1, 2, 3, 4, 5, 6];

  // Product selection view
  if (!selectedProduct) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Dopeka - izberite izdelek
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bakeryProducts.map((product) => (
              <button
                key={product.plu}
                onClick={() => setSelectedProduct(product)}
                className="flex flex-col items-center p-3 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted mb-2">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-xs text-muted-foreground">PLU {product.plu}</span>
                <span className="font-medium text-sm text-center leading-tight">{product.name}</span>
                <span className="text-primary font-bold">{product.price.toFixed(2)} €</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Quantity input view
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            {selectedProduct.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Selected product */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-muted-foreground">PLU {selectedProduct.plu}</p>
              <p className="text-primary font-bold">{selectedProduct.price.toFixed(2)} €/kos</p>
            </div>
          </div>

          {/* Quick quantity buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickQuantities.map((qty) => (
              <button
                key={qty}
                onClick={() => handleQuickSelect(selectedProduct, qty)}
                className="h-12 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
              >
                {qty}x
              </button>
            ))}
          </div>
          
          <div className="text-center text-4xl font-bold py-4 bg-muted rounded-lg flex items-center justify-center gap-2">
            <span>{quantity}</span>
            <span className="text-2xl text-muted-foreground">kos</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => key === 'C' ? setQuantity('1') : handleKeyPress(key)}
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
              className="h-14 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <CornerDownLeft className="w-5 h-5" />
              <span>Potrdi</span>
            </button>
          </div>
          
          <button
            onClick={() => setSelectedProduct(null)}
            className="w-full h-10 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Nazaj na izbiro
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BakeryDialog;
