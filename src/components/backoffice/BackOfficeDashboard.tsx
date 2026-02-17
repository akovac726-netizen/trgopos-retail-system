import { useState, useEffect } from "react";
import { Briefcase, LogOut, Plus, Pencil, Trash2, Package, Tag, ClipboardList, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string;
  ean: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
}

interface BackOfficeDashboardProps {
  onLogout: () => void;
}

type Tab = 'products' | 'inventory' | 'labels';

const BackOfficeDashboard = ({ onLogout }: BackOfficeDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);

  // Form state
  const [formEan, setFormEan] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("Ostalo");

  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];

  useEffect(() => {
    fetchProducts();
    
    // Realtime subscription
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
      toast.error('Napaka pri nalaganju artiklov');
      console.error(error);
    } else {
      setProducts((data as unknown as DBProduct[]) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormEan(""); setFormName(""); setFormPrice(""); setFormStock(""); setFormCategory("Ostalo");
    setShowAddForm(false); setEditingProduct(null);
  };

  const handleEditStart = (product: DBProduct) => {
    setEditingProduct(product);
    setFormEan(product.ean);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormCategory(product.category);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formEan || !formName || !formPrice) {
      toast.error('Izpolnite vsa obvezna polja'); return;
    }

    const productData = {
      ean: formEan.trim(),
      name: formName.trim(),
      price: parseFloat(formPrice),
      stock: parseInt(formStock) || 0,
      min_stock: 0,
      category: formCategory,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData as any).eq('id', editingProduct.id as any);
      if (error) { toast.error('Napaka pri posodabljanju'); console.error(error); }
      else { toast.success('Artikel posodobljen'); resetForm(); }
    } else {
      const { error } = await supabase.from('products').insert(productData as any);
      if (error) {
        if (error.code === '23505') toast.error('Artikel s to EAN kodo že obstaja');
        else { toast.error('Napaka pri dodajanju'); console.error(error); }
      } else { toast.success('Artikel dodan'); resetForm(); }
    }
  };

  const handleDelete = async (product: DBProduct) => {
    if (!confirm(`Ali ste prepričani, da želite izbrisati ${product.name}?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id as any);
    if (error) { toast.error('Napaka pri brisanju'); console.error(error); }
    else { toast.success('Artikel izbrisan'); }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ean.includes(searchQuery)
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BackOffice</h1>
              <p className="text-xs text-muted-foreground">Administrativni sistem</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Odjava
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex gap-1">
          {[
            { id: 'products' as Tab, label: 'Artikli', icon: Package },
            { id: 'inventory' as Tab, label: 'Inventura', icon: ClipboardList },
            { id: 'labels' as Tab, label: 'Cenovke', icon: Tag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Išči po imenu ali EAN kodi..."
                  className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
              </div>
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Dodaj artikel
              </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg">
                  {editingProduct ? 'Uredi artikel' : 'Dodaj nov artikel'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">EAN koda *</label>
                    <input
                      type="text"
                      value={formEan}
                      onChange={(e) => setFormEan(e.target.value)}
                      className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Ime artikla *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Cena (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Zaloga</label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Kategorija</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingProduct ? 'Posodobi' : 'Dodaj'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
                  >
                    Prekliči
                  </button>
                </div>
              </div>
            )}

            {/* Products table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-sm text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">EAN</th>
                    <th className="text-left px-4 py-3 font-medium">Ime</th>
                    <th className="text-left px-4 py-3 font-medium">Kategorija</th>
                    <th className="text-right px-4 py-3 font-medium">Cena</th>
                    <th className="text-right px-4 py-3 font-medium">Zaloga</th>
                    <th className="text-right px-4 py-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nalagam...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Ni artiklov. Dodajte jih z gumbom zgoraj.</td></tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm">{product.ean}</td>
                        <td className="px-4 py-3 font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{product.category}</td>
                        <td className="px-4 py-3 text-right font-mono">{product.price.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">{product.stock}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditStart(product)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Uredi"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Izbriši"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              Skupaj: {filteredProducts.length} artiklov
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Inventura</h3>
              <p>Funkcija inventure bo na voljo kmalu.</p>
            </div>
          </div>
        )}

        {activeTab === 'labels' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Cenovke</h3>
              <p>Funkcija tiskanja cenovk bo na voljo kmalu.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BackOfficeDashboard;
