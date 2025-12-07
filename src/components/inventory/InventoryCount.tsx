import { useState } from "react";
import { Product } from "@/types/inventory";
import { toast } from "sonner";
import { Check, X, ChevronLeft, ChevronRight, Save } from "lucide-react";

interface InventoryCountProps {
  products: Product[];
  onComplete: (counts: { plu: string; counted: number }[]) => void;
  onCancel: () => void;
}

const InventoryCount = ({ products, onComplete, onCancel }: InventoryCountProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [inputValue, setInputValue] = useState("");

  const currentProduct = products[currentIndex];
  const progress = ((Object.keys(counts).length / products.length) * 100).toFixed(0);
  const countedCount = Object.keys(counts).length;

  const handleKeyPress = (key: string) => {
    setInputValue(prev => prev + key);
  };

  const handleConfirmCount = () => {
    const value = parseInt(inputValue);
    if (isNaN(value) || value < 0) {
      toast.error('Vnesite veljavno količino');
      return;
    }

    setCounts(prev => ({
      ...prev,
      [currentProduct.plu]: value
    }));

    setInputValue("");
    
    if (currentIndex < products.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setInputValue("");
    if (currentIndex < products.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setInputValue("");
    }
  };

  const handleNext = () => {
    if (currentIndex < products.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setInputValue("");
    }
  };

  const handleComplete = () => {
    if (countedCount === 0) {
      toast.error('Preštetje vsaj en artikel');
      return;
    }

    const countsArray = Object.entries(counts).map(([plu, counted]) => ({
      plu,
      counted
    }));
    
    onComplete(countsArray);
    toast.success(`Inventura zaključena: ${countedCount} artiklov preštetih`);
  };

  const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'C'];

  const currentCount = counts[currentProduct?.plu];
  const hasCount = currentCount !== undefined;

  return (
    <div className="flex-1 grid grid-cols-12 gap-4">
      {/* Left - Progress and summary */}
      <div className="col-span-4 flex flex-col gap-4">
        <div className="pos-panel p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Napredek inventure</span>
            <span className="font-bold">{progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-pos-confirm transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {countedCount} od {products.length} artiklov preštetih
          </p>
        </div>

        <div className="pos-panel p-4 flex-1 overflow-y-auto">
          <h3 className="font-semibold mb-3">Preštetji artikli</h3>
          <div className="space-y-2">
            {products.map((product, index) => {
              const counted = counts[product.plu];
              const isCounted = counted !== undefined;
              const diff = isCounted ? counted - product.stock : 0;
              
              return (
                <button
                  key={product.plu}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    index === currentIndex
                      ? 'bg-primary/10 ring-1 ring-primary'
                      : isCounted
                      ? 'bg-pos-confirm/10'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate">{product.name}</span>
                    {isCounted && (
                      <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                        diff === 0
                          ? 'bg-muted'
                          : diff > 0
                          ? 'bg-pos-confirm/20 text-pos-confirm'
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-muted hover:bg-muted/80 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Prekliči
          </button>
          <button
            onClick={handleComplete}
            disabled={countedCount === 0}
            className="flex-1 py-3 bg-pos-confirm hover:bg-pos-confirm/90 text-pos-confirm-foreground rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Zaključi
          </button>
        </div>
      </div>

      {/* Center - Current product */}
      <div className="col-span-5 pos-panel p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {products.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === products.length - 1}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {currentProduct && (
          <>
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground font-mono mb-2">
                PLU: {currentProduct.plu}
              </p>
              <h2 className="text-3xl font-bold">{currentProduct.name}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sistemska zaloga</p>
                <p className="text-4xl font-bold font-mono">{currentProduct.stock}</p>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                hasCount ? 'bg-pos-confirm/20' : 'bg-muted'
              }`}>
                <p className="text-sm text-muted-foreground mb-1">Preštetja količina</p>
                <p className={`text-4xl font-bold font-mono ${
                  hasCount ? 'text-pos-confirm' : 'text-muted-foreground'
                }`}>
                  {hasCount ? currentCount : '-'}
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="bg-muted rounded-lg p-4 text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">Vnos količine</p>
              <p className="text-5xl font-mono font-bold h-14">
                {inputValue || '0'}
              </p>
            </div>

            <div className="flex-1" />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSkip}
                className="py-4 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
              >
                Preskoči
              </button>
              <button
                onClick={handleConfirmCount}
                className="py-4 bg-pos-confirm hover:bg-pos-confirm/90 text-pos-confirm-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" />
                Potrdi
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right - Numpad */}
      <div className="col-span-3 pos-panel p-4 flex flex-col gap-2">
        {numpadKeys.map((key) => (
          <button
            key={key}
            onClick={() => key === 'C' ? setInputValue('') : handleKeyPress(key)}
            className={`flex-1 text-3xl font-bold rounded-lg transition-colors ${
              key === 'C'
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InventoryCount;
