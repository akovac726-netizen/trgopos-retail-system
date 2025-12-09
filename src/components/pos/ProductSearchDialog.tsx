import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Edit2 } from "lucide-react";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    ean: "",
    name: "",
    price: "",
    category: ""
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.ean.includes(query) || 
      p.name.toLowerCase().includes(query)
    ).slice(0, 20);
  }, [products, searchQuery]);

  const handleAddProduct = () => {
    if (!newProduct.ean || !newProduct.name || !newProduct.price) return;
    
    onAddProduct?.({
      ean: newProduct.ean,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category || "Ostalo"
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Iskanje artiklov</DialogTitle>
        </DialogHeader>
        
        {!showAddForm ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Vnesite EAN kodo ali ime artikla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
                autoFocus
              />
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.ean}
                      onClick={() => {
                        onSelectProduct(product);
                        onClose();
                      }}
                      className="w-full p-4 text-left rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">EAN: {product.ean}</div>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          {product.price.toFixed(2)} €
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Ni najdenih artiklov</p>
                  {isAdmin && searchQuery && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setShowAddForm(true);
                        setNewProduct(prev => ({ ...prev, ean: searchQuery }));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Dodaj nov artikel
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {isAdmin && (
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj nov artikel
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">EAN koda *</label>
              <Input
                value={newProduct.ean}
                onChange={(e) => setNewProduct(prev => ({ ...prev, ean: e.target.value }))}
                placeholder="13-mestna EAN koda"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ime artikla *</label>
              <Input
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Npr. Mleko 1L"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cena (€) *</label>
              <Input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategorija</label>
              <Input
                value={newProduct.category}
                onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Npr. Mlečni izdelki"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Nazaj
              </Button>
              <Button 
                className="flex-1"
                onClick={handleAddProduct}
                disabled={!newProduct.ean || !newProduct.name || !newProduct.price}
              >
                Shrani artikel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchDialog;
