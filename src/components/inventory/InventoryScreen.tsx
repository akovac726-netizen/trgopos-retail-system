import { useState } from "react";
import { Product } from "@/types/inventory";
import ProductList from "./ProductList";
import StockAdjustment from "./StockAdjustment";
import InventoryCount from "./InventoryCount";
import { ArrowLeft, Package, ClipboardList, AlertTriangle } from "lucide-react";

type InventoryView = 'main' | 'stock' | 'count';

interface InventoryScreenProps {
  products: Product[];
  onUpdateProduct: (ean: string, updates: Partial<Product>) => void;
  onBack: () => void;
}

const InventoryScreen = ({ products, onUpdateProduct, onBack }: InventoryScreenProps) => {
  const [view, setView] = useState<InventoryView>('main');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('stock');
  };

  const handleStockUpdate = (ean: string, newStock: number) => {
    onUpdateProduct(ean, { stock: newStock });
    setSelectedProduct(null);
    setView('main');
  };

  const handleInventoryComplete = (counts: { ean: string; counted: number }[]) => {
    counts.forEach(({ ean, counted }) => {
      onUpdateProduct(ean, { stock: counted, lastInventory: new Date() });
    });
    setView('main');
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={view === 'main' ? onBack : () => setView('main')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">
            {view === 'main' ? 'Nazaj na blagajno' : 'Nazaj'}
          </span>
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {view === 'main' && 'Upravljanje zalog'}
          {view === 'stock' && 'Prilagoditev zaloge'}
          {view === 'count' && 'Inventura'}
        </h1>
        <div className="w-32" />
      </div>

      {view === 'main' && (
        <div className="flex-1 grid grid-cols-12 gap-4">
          {/* Left - Action cards */}
          <div className="col-span-4 flex flex-col gap-4">
            <button
              onClick={() => setView('count')}
              className="pos-panel p-6 flex flex-col items-center gap-4 hover:ring-2 hover:ring-pos-confirm transition-all"
            >
              <ClipboardList className="w-16 h-16 text-pos-confirm" />
              <span className="text-xl font-semibold">Začni inventuro</span>
              <span className="text-sm text-muted-foreground">
                Štetje zalog za vse ali izbrane artikle
              </span>
            </button>

            {lowStockProducts.length > 0 && (
              <div className="pos-panel p-4 border-l-4 border-l-destructive">
                <div className="flex items-center gap-2 text-destructive mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Nizke zaloge ({lowStockProducts.length})</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStockProducts.map(product => (
                    <div
                      key={product.ean}
                      className="flex justify-between items-center text-sm p-2 bg-destructive/10 rounded"
                    >
                      <span>{product.name}</span>
                      <span className="font-mono font-bold text-destructive">
                        {product.stock} / {product.minStock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pos-panel p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Package className="w-5 h-5" />
                <span className="font-medium">Statistika zalog</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Skupaj artiklov:</span>
                  <span className="font-semibold">{products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Skupaj enot:</span>
                  <span className="font-semibold">
                    {products.reduce((sum, p) => sum + p.stock, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Nizke zaloge:</span>
                  <span className="font-semibold">{lowStockProducts.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Product list */}
          <div className="col-span-8 pos-panel overflow-hidden">
            <ProductList
              products={products}
              onSelectProduct={handleSelectProduct}
            />
          </div>
        </div>
      )}

      {view === 'stock' && selectedProduct && (
        <StockAdjustment
          product={selectedProduct}
          onSave={handleStockUpdate}
          onCancel={() => setView('main')}
        />
      )}

      {view === 'count' && (
        <InventoryCount
          products={products}
          onComplete={handleInventoryComplete}
          onCancel={() => setView('main')}
        />
      )}
    </div>
  );
};

export default InventoryScreen;
