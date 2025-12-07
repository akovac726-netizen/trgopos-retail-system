import { useState } from "react";
import { Product } from "@/types/inventory";
import { toast } from "sonner";
import { Plus, Minus, Save, X } from "lucide-react";

interface StockAdjustmentProps {
  product: Product;
  onSave: (plu: string, newStock: number) => void;
  onCancel: () => void;
}

const StockAdjustment = ({ product, onSave, onCancel }: StockAdjustmentProps) => {
  const [stock, setStock] = useState(product.stock);
  const [inputValue, setInputValue] = useState("");

  const difference = stock - product.stock;

  const handleKeyPress = (key: string) => {
    setInputValue(prev => prev + key);
  };

  const handleDelete = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleSetStock = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value >= 0) {
      setStock(value);
      setInputValue("");
    }
  };

  const handleAddStock = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value > 0) {
      setStock(prev => prev + value);
      setInputValue("");
    }
  };

  const handleRemoveStock = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value) && value > 0) {
      setStock(prev => Math.max(0, prev - value));
      setInputValue("");
    }
  };

  const handleSave = () => {
    onSave(product.plu, stock);
    toast.success(`Zaloga za ${product.name} posodobljena`);
  };

  const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', 'C'];

  return (
    <div className="flex-1 grid grid-cols-2 gap-6">
      {/* Left - Product info and current values */}
      <div className="pos-panel p-6 flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Artikel</p>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-muted-foreground font-mono">PLU: {product.plu}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Trenutna zaloga</p>
            <p className="text-3xl font-bold font-mono">{product.stock}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Nova zaloga</p>
            <p className="text-3xl font-bold font-mono text-primary">{stock}</p>
          </div>
          <div className={`text-center p-4 rounded-lg ${
            difference > 0 ? 'bg-pos-confirm/20' : difference < 0 ? 'bg-destructive/20' : 'bg-muted'
          }`}>
            <p className="text-sm text-muted-foreground mb-1">Razlika</p>
            <p className={`text-3xl font-bold font-mono ${
              difference > 0 ? 'text-pos-confirm' : difference < 0 ? 'text-destructive' : ''
            }`}>
              {difference > 0 ? '+' : ''}{difference}
            </p>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 px-6 bg-muted hover:bg-muted/80 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Prekliči
          </button>
          <button
            onClick={handleSave}
            disabled={difference === 0}
            className="flex-1 py-4 px-6 bg-pos-confirm hover:bg-pos-confirm/90 text-pos-confirm-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            Shrani
          </button>
        </div>
      </div>

      {/* Right - Keypad and actions */}
      <div className="pos-panel p-6 flex flex-col gap-4">
        {/* Input display */}
        <div className="bg-muted rounded-lg p-4 text-right">
          <p className="text-sm text-muted-foreground mb-1">Vnos količine</p>
          <p className="text-4xl font-mono font-bold h-12">
            {inputValue || '0'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleSetStock}
            disabled={!inputValue}
            className="py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Nastavi zalogo
          </button>
          <button
            onClick={handleAddStock}
            disabled={!inputValue}
            className="py-4 bg-pos-confirm hover:bg-pos-confirm/90 text-pos-confirm-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Dodaj
          </button>
          <button
            onClick={handleRemoveStock}
            disabled={!inputValue}
            className="py-4 bg-pos-action hover:bg-pos-action/90 text-pos-action-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-5 h-5" />
            Odvzemi
          </button>
        </div>

        {/* Numpad */}
        <div className="flex-1 grid grid-cols-3 gap-2">
          {numpadKeys.map((key) => (
            <button
              key={key}
              onClick={() => key === 'C' ? setInputValue('') : handleKeyPress(key)}
              className={`text-2xl font-semibold rounded-lg transition-colors ${
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
    </div>
  );
};

export default StockAdjustment;
