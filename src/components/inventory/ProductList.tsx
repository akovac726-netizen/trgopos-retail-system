import { useState } from "react";
import { Product } from "@/types/inventory";
import { Search, ChevronUp, ChevronDown, Edit } from "lucide-react";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

const ProductList = ({ products, onSelectProduct }: ProductListProps) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'ean'>('ean');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredProducts = products
    .filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ean.includes(search)
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'stock') cmp = a.stock - b.stock;
      else cmp = a.ean.localeCompare(b.ean);
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (field: 'name' | 'stock' | 'ean') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'stock' | 'ean' }) => {
    if (sortBy !== field) return null;
    return sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Iskanje po imenu ali EAN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
        <button
          className="col-span-2 flex items-center gap-1 hover:text-foreground"
          onClick={() => handleSort('ean')}
        >
          EAN <SortIcon field="ean" />
        </button>
        <button
          className="col-span-5 flex items-center gap-1 text-left hover:text-foreground"
          onClick={() => handleSort('name')}
        >
          Naziv <SortIcon field="name" />
        </button>
        <button
          className="col-span-2 flex items-center gap-1 justify-end hover:text-foreground"
          onClick={() => handleSort('stock')}
        >
          Zaloga <SortIcon field="stock" />
        </button>
        <div className="col-span-2 text-right">Min.</div>
        <div className="col-span-1"></div>
      </div>

      {/* Product rows */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= product.minStock;
          
          return (
            <div
              key={product.ean}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors ${
                isLowStock ? 'bg-destructive/5' : ''
              }`}
            >
              <div className="col-span-2 font-mono text-xs">{product.ean}</div>
              <div className="col-span-5 font-medium truncate">{product.name}</div>
              <div className={`col-span-2 text-right font-mono font-bold ${
                isLowStock ? 'text-destructive' : 'text-foreground'
              }`}>
                {product.stock}
              </div>
              <div className="col-span-2 text-right font-mono text-muted-foreground">
                {product.minStock}
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => onSelectProduct(product)}
                  className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
