import { useState, useMemo } from "react";
import { Product } from "@/types/inventory";

interface ProductSearchDialogProps {
  products: Product[];
  isAdmin: boolean;
  onSelectProduct: (product: Product) => void;
  onAddProduct?: (product: Omit<Product, 'stock' | 'minStock'>) => void;
  onClose: () => void;
}

const ProductSearchDialog = ({ 
  products, 
  isAdmin, 
  onSelectProduct, 
  onAddProduct,
  onClose 
}: ProductSearchDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.ean.includes(query) || 
      p.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#e8f4f8' }}>
      {/* Search bar */}
      <div className="p-3 pb-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Vnesite ime ali EAN kodo artikla..."
            className="flex-1 h-12 px-4 border-2 border-gray-600 text-lg font-medium bg-white"
            autoFocus
          />
          <button onClick={onClose}
            className="px-6 h-12 font-bold text-base text-white border-2 border-red-600 transition-colors"
            style={{ background: 'linear-gradient(180deg, #e06060, #c03030)' }}>
            Zapri
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="px-3 pt-2">
        <div className="flex items-center border-2 border-gray-800 bg-white">
          <div className="flex-[1] px-3 py-2 font-bold text-sm border-r border-gray-400">EAN</div>
          <div className="flex-[3] px-3 py-2 font-bold text-sm border-r border-gray-400">Naziv artikla</div>
          <div className="flex-[1] px-3 py-2 font-bold text-sm text-right">Cena</div>
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 px-3 pb-3 overflow-hidden">
        <div className="h-full border-2 border-t-0 border-gray-800 bg-white overflow-y-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.ean}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="px-3 py-2 border-b border-gray-200 cursor-pointer text-sm flex items-center hover:bg-sky-100 transition-colors">
                <div className="flex-[1] font-mono text-gray-600">{product.ean}</div>
                <div className="flex-[3] font-medium">{product.name}</div>
                <div className="flex-[1] text-right font-bold">{formatPrice(product.price)} €</div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Ni najdenih artiklov
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSearchDialog;
