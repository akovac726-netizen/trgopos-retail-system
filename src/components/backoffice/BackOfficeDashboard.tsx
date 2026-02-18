import { useState, useEffect } from "react";
import { 
  Briefcase, LogOut, Plus, Pencil, Trash2, Package, Tag, ClipboardList, 
  Search, Building2, BarChart3, ShoppingCart, FileText, CheckSquare, 
  BookOpen, Printer, X, Save, ChevronDown
} from "lucide-react";
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

interface Partner {
  id: string;
  name: string;
  tax_number: string;
  address: string;
  city: string;
  postal_code: string;
  email: string;
  phone: string;
  notes: string;
}

interface BackOfficeDashboardProps {
  onLogout: () => void;
}

type Tab = 'products' | 'inventory' | 'orders' | 'order-form' | 'reports' | 'labels' | 'closing' | 'tasks' | 'ledger' | 'partners';

const BackOfficeDashboard = ({ onLogout }: BackOfficeDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);

  // Product form
  const [formEan, setFormEan] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("Ostalo");

  // Partner form
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [pName, setPName] = useState("");
  const [pTax, setPTax] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [pCity, setPCity] = useState("");
  const [pPostal, setPPostal] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pNotes, setPNotes] = useState("");

  // Label selection
  const [selectedForLabel, setSelectedForLabel] = useState<string[]>([]);

  // Tasks
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");

  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];

  useEffect(() => {
    fetchProducts();
    fetchPartners();
    const channel = supabase
      .channel('bo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchPartners)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts((data as unknown as DBProduct[]) || []);
    setLoading(false);
  };

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners((data as unknown as Partner[]) || []);
  };

  const resetProductForm = () => {
    setFormEan(""); setFormName(""); setFormPrice(""); setFormStock(""); setFormCategory("Ostalo");
    setShowAddForm(false); setEditingProduct(null);
  };

  const handleEditStart = (product: DBProduct) => {
    setEditingProduct(product);
    setFormEan(product.ean); setFormName(product.name);
    setFormPrice(product.price.toString()); setFormStock(product.stock.toString());
    setFormCategory(product.category); setShowAddForm(true);
  };

  const handleSaveProduct = async () => {
    if (!formEan || !formName || !formPrice) { toast.error('Izpolnite vsa obvezna polja'); return; }
    const productData = { ean: formEan.trim(), name: formName.trim(), price: parseFloat(formPrice), stock: parseInt(formStock) || 0, min_stock: 0, category: formCategory };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(productData as any).eq('id', editingProduct.id as any);
      if (error) toast.error('Napaka pri posodabljanju');
      else { toast.success('Artikel posodobljen'); resetProductForm(); }
    } else {
      const { error } = await supabase.from('products').insert(productData as any);
      if (error) {
        if (error.code === '23505') toast.error('Artikel s to EAN kodo že obstaja');
        else toast.error('Napaka pri dodajanju');
      } else { toast.success('Artikel dodan'); resetProductForm(); }
    }
  };

  const handleDeleteProduct = async (product: DBProduct) => {
    if (!confirm(`Izbrišete ${product.name}?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id as any);
    if (error) toast.error('Napaka pri brisanju');
    else toast.success('Artikel izbrisan');
  };

  const resetPartnerForm = () => {
    setPName(""); setPTax(""); setPAddress(""); setPCity(""); setPPostal(""); setPEmail(""); setPPhone(""); setPNotes("");
    setShowPartnerForm(false); setEditingPartner(null);
  };

  const handleEditPartner = (p: Partner) => {
    setEditingPartner(p);
    setPName(p.name); setPTax(p.tax_number); setPAddress(p.address);
    setPCity(p.city); setPPostal(p.postal_code); setPEmail(p.email);
    setPPhone(p.phone); setPNotes(p.notes);
    setShowPartnerForm(true);
  };

  const handleSavePartner = async () => {
    if (!pName || !pTax || !pAddress) { toast.error('Naziv, davčna številka in naslov so obvezni'); return; }
    const data = { name: pName.trim(), tax_number: pTax.trim(), address: pAddress.trim(), city: pCity.trim(), postal_code: pPostal.trim(), email: pEmail.trim(), phone: pPhone.trim(), notes: pNotes.trim() };
    if (editingPartner) {
      const { error } = await supabase.from('partners').update(data as any).eq('id', editingPartner.id as any);
      if (error) toast.error('Napaka pri posodabljanju');
      else { toast.success('Partner posodobljen'); resetPartnerForm(); }
    } else {
      const { error } = await supabase.from('partners').insert(data as any);
      if (error) toast.error('Napaka pri dodajanju');
      else { toast.success('Partner dodan'); resetPartnerForm(); }
    }
  };

  const handleDeletePartner = async (p: Partner) => {
    if (!confirm(`Izbrišete ${p.name}?`)) return;
    const { error } = await supabase.from('partners').delete().eq('id', p.id as any);
    if (error) toast.error('Napaka pri brisanju');
    else toast.success('Partner izbrisan');
  };

  // PDF label printing
  const handlePrintLabels = () => {
    const selected = products.filter(p => selectedForLabel.includes(p.id));
    if (selected.length === 0) { toast.error('Izberite artikle za tiskanje'); return; }

    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cenovke</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: white; }
          .page { display: flex; flex-wrap: wrap; padding: 10mm; gap: 5mm; }
          .label { 
            width: 62mm; height: 40mm; border: 1px solid #ddd; 
            border-radius: 3mm; padding: 4mm;
            display: flex; flex-direction: column; justify-content: space-between;
            page-break-inside: avoid;
          }
          .label-name { font-size: 11pt; font-weight: bold; line-height: 1.2; overflow: hidden; max-height: 2.4em; }
          .label-ean { font-size: 7pt; color: #666; font-family: monospace; }
          .label-barcode { 
            font-family: 'Libre Barcode 128', monospace; font-size: 28pt;
            letter-spacing: -1px; text-align: center; overflow: hidden;
            height: 12mm; display: flex; align-items: center; justify-content: center;
          }
          .label-price { font-size: 18pt; font-weight: bold; text-align: right; color: #1a1a2e; }
          .label-category { font-size: 7pt; color: #888; }
          @media print { body { margin: 0; } .page { padding: 5mm; } }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="page">
          ${selected.map(p => `
            <div class="label">
              <div>
                <div class="label-name">${p.name}</div>
                <div class="label-category">${p.category}</div>
              </div>
              <div class="label-barcode">${p.ean}</div>
              <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                <div class="label-ean">${p.ean}</div>
                <div class="label-price">${p.price.toFixed(2)} €</div>
              </div>
            </div>
          `).join('')}
        </div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) {
      win.document.write(labelHTML);
      win.document.close();
    }
    toast.success(`${selected.length} cenovk pripravljenih za tisk`);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.ean.includes(searchQuery)
  );

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.tax_number.includes(partnerSearch)
  );

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'products', label: 'Artikli', icon: Package },
    { id: 'inventory', label: 'Inventura', icon: ClipboardList },
    { id: 'orders', label: 'Naročila', icon: ShoppingCart },
    { id: 'order-form', label: 'Naročilnica', icon: FileText },
    { id: 'reports', label: 'Fin. poročila', icon: BarChart3 },
    { id: 'labels', label: 'Nalepke', icon: Tag },
    { id: 'closing', label: 'Zaključevanje', icon: BookOpen },
    { id: 'tasks', label: 'Opravila', icon: CheckSquare },
    { id: 'ledger', label: 'Knjiga prihodkov', icon: BookOpen },
    { id: 'partners', label: 'Partnerji', icon: Building2 },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BackOffice</h1>
              <p className="text-xs text-muted-foreground">Administrativni sistem · StandBuy</p>
            </div>
          </div>
          <button onClick={onLogout} className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" />
            Odjava
          </button>
        </div>
      </header>

      {/* Tab bar - scrollable */}
      <div className="bg-card border-b border-border px-4 shrink-0 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
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

        {/* ARTIKLI */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Išči po imenu ali EAN kodi..." className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
              </div>
              <button onClick={() => { resetProductForm(); setShowAddForm(true); }} className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />Dodaj artikel
              </button>
            </div>

            {showAddForm && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg">{editingProduct ? 'Uredi artikel' : 'Dodaj nov artikel'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'EAN koda *', value: formEan, setter: setFormEan, type: 'text' },
                    { label: 'Ime artikla *', value: formName, setter: setFormName, type: 'text' },
                    { label: 'Cena (€) *', value: formPrice, setter: setFormPrice, type: 'number' },
                    { label: 'Zaloga', value: formStock, setter: setFormStock, type: 'number' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">{field.label}</label>
                      <input type={field.type} step={field.type === 'number' ? '0.01' : undefined} value={field.value} onChange={(e) => field.setter(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Kategorija</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveProduct} className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">{editingProduct ? 'Posodobi' : 'Dodaj'}</button>
                  <button onClick={resetProductForm} className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">Prekliči</button>
                </div>
              </div>
            )}

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
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Ni artiklov.</td></tr>
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
                            <button onClick={() => handleEditStart(product)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                            <button onClick={() => handleDeleteProduct(product)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground text-center">Skupaj: {filteredProducts.length} artiklov</p>
          </div>
        )}

        {/* INVENTURA */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Inventura</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-sm text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">EAN</th>
                    <th className="text-left px-4 py-3 font-medium">Artikel</th>
                    <th className="text-right px-4 py-3 font-medium">Evidenčna zaloga</th>
                    <th className="text-right px-4 py-3 font-medium">Dejanska zaloga</th>
                    <th className="text-right px-4 py-3 font-medium">Razlika</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-sm">{p.ean}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-right">{p.stock}</td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" defaultValue={p.stock} className="w-20 h-8 px-2 bg-muted rounded text-right focus:outline-none focus:ring-1 focus:ring-violet-600" />
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" />Shrani inventuro
            </button>
          </div>
        )}

        {/* NAROČILA */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Naročila</h2>
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Ni odprtih naročil.</p>
              <button onClick={() => setActiveTab('order-form')} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-1" />Novo naročilo
              </button>
            </div>
          </div>
        )}

        {/* NAROČILNICA */}
        {activeTab === 'order-form' && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-xl font-bold">Nova naročilnica</h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Dobavitelj</label>
                  <input type="text" placeholder="Ime dobavitelja" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Datum naročila</label>
                  <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Artikli za naročilo</label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2">Artikel</th>
                        <th className="text-right px-3 py-2">Količina</th>
                        <th className="text-right px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.stock <= p.min_stock).map(p => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-3 py-2">{p.name}</td>
                          <td className="px-3 py-2 text-right"><input type="number" defaultValue={10} className="w-16 h-7 px-2 bg-muted rounded text-right focus:outline-none" /></td>
                          <td className="px-3 py-2"><button className="text-destructive hover:text-destructive/70"><X className="w-3 h-3" /></button></td>
                        </tr>
                      ))}
                      {products.filter(p => p.stock <= p.min_stock).length === 0 && (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Vsi artikli imajo zadostno zalogo.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Opomba</label>
                <textarea rows={3} className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none" />
              </div>
              <div className="flex gap-2">
                <button className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Printer className="w-4 h-4" />Natisni naročilnico
                </button>
                <button className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors" onClick={() => setActiveTab('orders')}>Prekliči</button>
              </div>
            </div>
          </div>
        )}

        {/* FINANČNA POROČILA */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Finančna poročila</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Dnevni promet', value: '0,00 €', sub: 'Danes' },
                { label: 'Mesečni promet', value: '0,00 €', sub: new Date().toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' }) },
                { label: 'Letni promet', value: '0,00 €', sub: new Date().getFullYear().toString() },
              ].map(card => (
                <div key={card.label} className="bg-card border border-border rounded-xl p-6">
                  <p className="text-sm text-muted-foreground">{card.sub}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
                  <p className="text-2xl font-bold text-primary mt-2">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>Podrobna poročila bodo prikazana po zaključenih izmenah.</p>
            </div>
          </div>
        )}

        {/* NALEPKE */}
        {activeTab === 'labels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Tiskanje cenovk</h2>
              <button
                onClick={handlePrintLabels}
                disabled={selectedForLabel.length === 0}
                className="px-4 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-40"
              >
                <Printer className="w-4 h-4" />
                Natisni PDF ({selectedForLabel.length})
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Izberite artikle za katere želite natisniti cenovke z barkodo in ceno.</p>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setSelectedForLabel(products.map(p => p.id))} className="text-sm px-3 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-colors">Izberi vse</button>
              <button onClick={() => setSelectedForLabel([])} className="text-sm px-3 py-1 bg-muted rounded-lg hover:bg-muted/80 transition-colors">Počisti</button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-sm text-muted-foreground">
                    <th className="px-4 py-3 w-10"></th>
                    <th className="text-left px-4 py-3 font-medium">EAN</th>
                    <th className="text-left px-4 py-3 font-medium">Artikel</th>
                    <th className="text-right px-4 py-3 font-medium">Cena</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Ni artiklov</td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedForLabel(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                      <td className="px-4 py-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedForLabel.includes(p.id) ? 'bg-violet-600 border-violet-600' : 'border-muted-foreground'}`}>
                          {selectedForLabel.includes(p.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{p.ean}</td>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-right font-bold">{p.price.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ZAKLJUČEVANJE */}
        {activeTab === 'closing' && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-xl font-bold">Zaključevanje</h2>
            <div className="space-y-3">
              {[
                { title: 'Zaključek izmene', desc: 'Zaključi trenutno izmeno blagajnika in generiraj PDF poročilo', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
                { title: 'Dnevni zaključek', desc: 'Zaključi celodnevni promet in pošlji poročilo v BackOffice', color: 'bg-violet-500/10 text-violet-700 border-violet-200' },
                { title: 'Mesečni zaključek', desc: 'Mesečno finančno poročilo in arhiviranje podatkov', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
              ].map(item => (
                <div key={item.title} className={`border rounded-xl p-5 ${item.color}`}>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm opacity-70 mb-3">{item.desc}</p>
                  <button className="px-4 h-9 bg-white/50 hover:bg-white/70 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <Printer className="w-4 h-4" />Generiraj PDF
                  </button>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Zaključki iz blagajne se samodejno pošljejo sem ob zaključku izmene.</p>
            </div>
          </div>
        )}

        {/* OPRAVILA */}
        {activeTab === 'tasks' && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-xl font-bold">Opravila</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTask.trim()) {
                    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
                    setNewTask("");
                  }
                }}
                placeholder="Dodaj novo opravilo..."
                className="flex-1 h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
              <button
                onClick={() => {
                  if (newTask.trim()) {
                    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTask.trim(), done: false }]);
                    setNewTask("");
                  }
                }}
                className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {tasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Ni opravil. Dodajte jih zgoraj.</p>
                </div>
              ) : tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                    className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${task.done ? 'bg-violet-600 border-violet-600' : 'border-muted-foreground'}`}
                  >
                    {task.done && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                  <span className={`flex-1 ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.text}</span>
                  <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-destructive hover:text-destructive/70 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KNJIGA PRIHODKOV */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Knjiga prihodkov</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-sm text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Datum</th>
                    <th className="text-left px-4 py-3 font-medium">Opis</th>
                    <th className="text-left px-4 py-3 font-medium">Blagajnik</th>
                    <th className="text-right px-4 py-3 font-medium">Gotovina</th>
                    <th className="text-right px-4 py-3 font-medium">Kartica</th>
                    <th className="text-right px-4 py-3 font-medium">Skupaj</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>Vnosi se bodo prikazali po zaključku izmene.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PARTNERJI */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={partnerSearch} onChange={(e) => setPartnerSearch(e.target.value)} placeholder="Išči po imenu ali davčni številki..." className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
              </div>
              <button onClick={() => { resetPartnerForm(); setShowPartnerForm(true); }} className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />Dodaj partnerja
              </button>
            </div>

            {showPartnerForm && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-lg">{editingPartner ? 'Uredi partnerja' : 'Dodaj novega partnerja'}</h3>
                <p className="text-sm text-muted-foreground">Naziv, davčna številka in naslov so obvezni za izdajo fakture.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Naziv podjetja *', value: pName, setter: setPName },
                    { label: 'Davčna številka *', value: pTax, setter: setPTax },
                    { label: 'Naslov *', value: pAddress, setter: setPAddress },
                    { label: 'Mesto', value: pCity, setter: setPCity },
                    { label: 'Poštna številka', value: pPostal, setter: setPPostal },
                    { label: 'E-pošta', value: pEmail, setter: setPEmail },
                    { label: 'Telefon', value: pPhone, setter: setPPhone },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">{field.label}</label>
                      <input type="text" value={field.value} onChange={(e) => field.setter(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Opomba</label>
                    <textarea value={pNotes} onChange={(e) => setPNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSavePartner} className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">{editingPartner ? 'Posodobi' : 'Dodaj'}</button>
                  <button onClick={resetPartnerForm} className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">Prekliči</button>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-sm text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Naziv</th>
                    <th className="text-left px-4 py-3 font-medium">Davčna številka</th>
                    <th className="text-left px-4 py-3 font-medium">Naslov</th>
                    <th className="text-left px-4 py-3 font-medium">Kontakt</th>
                    <th className="text-right px-4 py-3 font-medium">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground">
                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>Ni partnerjev. Dodajte jih z gumbom zgoraj.</p>
                        <p className="text-xs mt-1">Partnerji so potrebni za izdajo faktur na blagajni.</p>
                      </td>
                    </tr>
                  ) : filteredPartners.map(partner => (
                    <tr key={partner.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{partner.name}</td>
                      <td className="px-4 py-3 font-mono text-sm">{partner.tax_number}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{partner.address}, {partner.postal_code} {partner.city}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{partner.email || partner.phone || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEditPartner(partner)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => handleDeletePartner(partner)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground text-center">Skupaj: {filteredPartners.length} partnerjev</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default BackOfficeDashboard;
