import { useState, useEffect } from "react";
import { 
  Briefcase, LogOut, Plus, Pencil, Trash2, Package, Tag, ClipboardList, 
  Search, Building2, BarChart3, ShoppingCart, FileText, CheckSquare, 
  BookOpen, Printer, X, Save, ChevronRight, AlertTriangle, Send,
  Calendar, Clock, User, Bell, TrendingUp, DoorOpen, Shield
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

interface OrderItem {
  productId: string;
  ean: string;
  name: string;
  quantity: number;
}

interface ClosingReportData {
  id: string;
  type: string;
  cashier: string;
  cashierId: string;
  date: string;
  total: number;
  cash: number;
  card: number;
  other: number;
  transactionCount: number;
  itemCount: number;
}

interface BackOfficeDashboardProps {
  onLogout: () => void;
  closingReports?: ClosingReportData[];
}

type Tab = 'products' | 'orders' | 'documents' | 'labels' | 'schedules' | 'opening' | 'closing' | 'inventory' | 'reports' | 'authorization' | 'logout';

const BackOfficeDashboard = ({ onLogout, closingReports: externalReports = [] }: BackOfficeDashboardProps) => {
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
  const [formMinStock, setFormMinStock] = useState("5");
  const [formCategory, setFormCategory] = useState("Ostalo");

  // Orders state
  const [orderSubTab, setOrderSubTab] = useState<'list' | 'form'>('list');
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchType, setOrderSearchType] = useState<'name' | 'ean' | 'supplier'>('name');
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNote, setOrderNote] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [savedOrders, setSavedOrders] = useState<{ id: string; supplier: string; date: string; items: OrderItem[]; status: string }[]>([]);

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

  // Authorization state
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [authCodeExpiry, setAuthCodeExpiry] = useState<number>(0);
  const [authCountdown, setAuthCountdown] = useState<number>(0);

  // Auth code countdown timer
  useEffect(() => {
    if (authCodeExpiry <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((authCodeExpiry - Date.now()) / 1000));
      setAuthCountdown(remaining);
      if (remaining <= 0) {
        setAuthCode(null);
        setAuthCodeExpiry(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [authCodeExpiry]);

  const generateAuthCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setAuthCode(code);
    const expiry = Date.now() + 60000; // 60 seconds
    setAuthCodeExpiry(expiry);
    setAuthCountdown(60);
    toast.success('Admin koda generirana – veljavna 60 sekund');
  };

  // Tasks
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean; priority: string }[]>([]);
  const [newTask, setNewTask] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");

  // Schedules
  const [schedules, setSchedules] = useState<{ id: string; employee: string; day: string; start: string; end: string }[]>([]);
  const [newEmployee, setNewEmployee] = useState("");
  const [newDay, setNewDay] = useState("ponedeljek");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("16:00");

  // Closing reports - merge external (from POS) with local
  const closingReports = externalReports;

  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];
  const days = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

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
    setFormEan(""); setFormName(""); setFormPrice(""); setFormStock(""); setFormMinStock("5"); setFormCategory("Ostalo");
    setShowAddForm(false); setEditingProduct(null);
  };

  const handleEditStart = (product: DBProduct) => {
    setEditingProduct(product);
    setFormEan(product.ean); setFormName(product.name);
    setFormPrice(product.price.toString()); setFormStock(product.stock.toString());
    setFormMinStock(product.min_stock.toString()); setFormCategory(product.category);
    setShowAddForm(true);
  };

  const handleSaveProduct = async () => {
    if (!formEan || !formName || !formPrice) { toast.error('Izpolnite vsa obvezna polja'); return; }
    const productData = { ean: formEan.trim(), name: formName.trim(), price: parseFloat(formPrice), stock: parseInt(formStock) || 0, min_stock: parseInt(formMinStock) || 5, category: formCategory };
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

  // Add product to order
  const handleAddToOrder = (product: DBProduct) => {
    const exists = orderItems.find(i => i.ean === product.ean);
    if (exists) {
      setOrderItems(prev => prev.map(i => i.ean === product.ean ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, { productId: product.id, ean: product.ean, name: product.name, quantity: 1 }]);
    }
    toast.success(`${product.name} dodan v naročilnico`);
  };

  const handleSaveOrder = () => {
    if (!orderSupplier || orderItems.length === 0) { toast.error('Vnesite dobavitelja in dodajte artikle'); return; }
    const newOrder = { id: Date.now().toString(), supplier: orderSupplier, date: orderDate, items: [...orderItems], status: 'Oddano' };
    setSavedOrders(prev => [newOrder, ...prev]);
    setOrderItems([]);
    setOrderSupplier("");
    setOrderNote("");
    setOrderSubTab('list');
    toast.success('Naročilnica shranjena');
  };

  const handlePrintOrder = () => {
    if (!orderSupplier || orderItems.length === 0) { toast.error('Vnesite dobavitelja in dodajte artikle'); return; }
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Naročilnica</title>
    <style>body{font-family:Arial,sans-serif;padding:20mm;}h1{font-size:18pt;}table{width:100%;border-collapse:collapse;margin-top:10mm;}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;}th{background:#f5f5f5;}</style>
    </head><body><h1>Naročilnica</h1><p>Dobavitelj: <strong>${orderSupplier}</strong></p><p>Datum: ${orderDate}</p>
    <table><thead><tr><th>EAN</th><th>Artikel</th><th>Količina</th></tr></thead><tbody>
    ${orderItems.map(i => `<tr><td>${i.ean}</td><td>${i.name}</td><td>${i.quantity}</td></tr>`).join('')}
    </tbody></table>${orderNote ? `<p style="margin-top:10mm">Opomba: ${orderNote}</p>` : ''}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); }
  };

  // PDF label printing
  const handlePrintLabels = () => {
    const selected = products.filter(p => selectedForLabel.includes(p.id));
    if (selected.length === 0) { toast.error('Izberite artikle za tiskanje'); return; }
    const labelHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cenovke</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;}
      .page{display:flex;flex-wrap:wrap;padding:10mm;gap:5mm;}
      .label{width:62mm;height:40mm;border:1px solid #ddd;border-radius:3mm;padding:4mm;display:flex;flex-direction:column;justify-content:space-between;page-break-inside:avoid;}
      .label-name{font-size:11pt;font-weight:bold;line-height:1.2;overflow:hidden;max-height:2.4em;}
      .label-ean{font-size:7pt;color:#666;font-family:monospace;}
      .label-barcode{font-family:'Libre Barcode 128',monospace;font-size:28pt;letter-spacing:-1px;text-align:center;overflow:hidden;height:12mm;display:flex;align-items:center;justify-content:center;}
      .label-price{font-size:18pt;font-weight:bold;text-align:right;color:#1a1a2e;}
      .label-category{font-size:7pt;color:#888;}
      @media print{body{margin:0;}.page{padding:5mm;}}</style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
      </head><body><div class="page">
      ${selected.map(p => `<div class="label"><div><div class="label-name">${p.name}</div><div class="label-category">${p.category}</div></div>
      <div class="label-barcode">${p.ean}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;"><div class="label-ean">${p.ean}</div><div class="label-price">${p.price.toFixed(2)} €</div></div></div>`).join('')}
      </div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(labelHTML); win.document.close(); }
    toast.success(`${selected.length} cenovk pripravljenih za tisk`);
  };

  // Generate closing PDF
  const handleGenerateClosingPDF = (type: string) => {
    const now = new Date();
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${type}</title>
    <style>body{font-family:Arial,sans-serif;padding:20mm;}h1{font-size:18pt;margin-bottom:5mm;}
    .info{margin-bottom:5mm;}.total{font-size:16pt;font-weight:bold;margin-top:10mm;border-top:2px solid #333;padding-top:5mm;}</style>
    </head><body><h1>${type}</h1>
    <div class="info"><p>Datum: ${now.toLocaleDateString('sl-SI')}</p><p>Čas: ${now.toLocaleTimeString('sl-SI')}</p></div>
    <p>Gotovina: <strong>${closingReports.reduce((s,r)=>s+r.cash,0).toFixed(2)} €</strong></p>
    <p>Kartica: <strong>${closingReports.reduce((s,r)=>s+r.card,0).toFixed(2)} €</strong></p>
    <div class="total">SKUPAJ: ${closingReports.reduce((s,r)=>s+r.total,0).toFixed(2)} €</div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); }
    toast.success(`${type} generiran`);
  };

  // Filtered products for orders
  const filteredOrderProducts = products.filter(p => {
    const q = orderSearch.toLowerCase();
    if (!q) return true;
    if (orderSearchType === 'ean') return p.ean.includes(q);
    if (orderSearchType === 'name') return p.name.toLowerCase().includes(q);
    return true; // supplier search not applicable to products directly
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.ean.includes(searchQuery)
  );

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const navItems: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: 'products', label: 'Artikli', icon: Package, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'orders', label: 'Naročila', icon: ShoppingCart },
    { id: 'documents', label: 'Dokumenti', icon: FileText },
    { id: 'labels', label: 'Nalepke / Cenovke', icon: Tag },
    { id: 'schedules', label: 'Urniki', icon: Calendar },
    { id: 'opening', label: 'Otvoritev', icon: DoorOpen },
    { id: 'closing', label: 'Zaključevanje', icon: BookOpen },
    { id: 'inventory', label: 'Inventura', icon: ClipboardList },
    { id: 'reports', label: 'Finančna poročila', icon: BarChart3 },
    { id: 'authorization', label: 'Avtorizacija', icon: Shield },
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
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">{lowStockProducts.length} artiklov z nizko zalogo</span>
            </div>
          )}
          <button onClick={onLogout} className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" />
            Odjava
          </button>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar navigation */}
        <aside className="w-56 bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
          <nav className="p-2 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 ${
                  activeTab === item.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-amber-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
                {activeTab === item.id && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
              </button>
            ))}
          </nav>
          {/* Logout at bottom */}
          <div className="p-2 border-t border-border">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Izhod</span>
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* ARTIKLI */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Artikli</h2>
                <button onClick={() => { resetProductForm(); setShowAddForm(true); }} className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />Dodaj artikel
                </button>
              </div>

              {lowStockProducts.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="font-semibold text-destructive text-sm">Artikli z nizko zalogo ({lowStockProducts.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.map(p => (
                      <span key={p.id} className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded-md font-medium">
                        {p.name} ({p.stock}/{p.min_stock})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Išči po imenu ali EAN kodi..." className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
              </div>

              {showAddForm && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-lg">{editingProduct ? 'Uredi artikel' : 'Dodaj nov artikel'}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'EAN koda *', value: formEan, setter: setFormEan, type: 'text' },
                      { label: 'Ime artikla *', value: formName, setter: setFormName, type: 'text' },
                      { label: 'Cena (€) *', value: formPrice, setter: setFormPrice, type: 'number' },
                      { label: 'Zaloga', value: formStock, setter: setFormStock, type: 'number' },
                      { label: 'Min. zaloga', value: formMinStock, setter: setFormMinStock, type: 'number' },
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
                      <th className="text-right px-4 py-3 font-medium">Min.</th>
                      <th className="text-right px-4 py-3 font-medium">Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nalagam...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Ni artiklov.</td></tr>
                    ) : (
                      filteredProducts.map(product => (
                        <tr key={product.id} className={`border-t border-border hover:bg-muted/30 transition-colors ${product.stock <= product.min_stock ? 'bg-amber-50/50' : ''}`}>
                          <td className="px-4 py-3 font-mono text-sm">{product.ean}</td>
                          <td className="px-4 py-3 font-medium">
                            {product.name}
                            {product.stock <= product.min_stock && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">nizka zaloga</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{product.category}</td>
                          <td className="px-4 py-3 text-right font-mono">{product.price.toFixed(2)} €</td>
                          <td className={`px-4 py-3 text-right font-medium ${product.stock <= product.min_stock ? 'text-amber-600' : ''}`}>{product.stock}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{product.min_stock}</td>
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

          {/* NAROČILA */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Naročila</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrderSubTab('list')}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${orderSubTab === 'list' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    Seznam naročil
                  </button>
                  <button
                    onClick={() => setOrderSubTab('form')}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${orderSubTab === 'form' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    <Plus className="w-3 h-3" />Naročilnica
                  </button>
                </div>
              </div>

              {/* ORDER LIST */}
              {orderSubTab === 'list' && (
                <div>
                  {savedOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="font-medium">Ni oddanih naročil</p>
                      <p className="text-sm mt-1">Kliknite "Naročilnica" za novo naročilo</p>
                      <button onClick={() => setOrderSubTab('form')} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                        <Plus className="w-4 h-4 inline mr-1" />Novo naročilo
                      </button>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 text-sm text-muted-foreground">
                            <th className="text-left px-4 py-3 font-medium">Datum</th>
                            <th className="text-left px-4 py-3 font-medium">Dobavitelj</th>
                            <th className="text-right px-4 py-3 font-medium">Artiklov</th>
                            <th className="text-left px-4 py-3 font-medium">Status</th>
                            <th className="text-right px-4 py-3 font-medium">Akcije</th>
                          </tr>
                        </thead>
                        <tbody>
                          {savedOrders.map(order => (
                            <tr key={order.id} className="border-t border-border hover:bg-muted/30">
                              <td className="px-4 py-3 text-sm">{order.date}</td>
                              <td className="px-4 py-3 font-medium">{order.supplier}</td>
                              <td className="px-4 py-3 text-right">{order.items.length}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{order.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => setSavedOrders(prev => prev.filter(o => o.id !== order.id))} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ORDER FORM / NAROČILNICA */}
              {orderSubTab === 'form' && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg">Nova naročilnica</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Dobavitelj *</label>
                        <input type="text" value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)} placeholder="Ime dobavitelja" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Datum naročila</label>
                        <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                      </div>
                    </div>

                    {/* Order items */}
                    {orderItems.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Artikli v naročilnici ({orderItems.length})</label>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left px-3 py-2">EAN</th>
                                <th className="text-left px-3 py-2">Artikel</th>
                                <th className="text-right px-3 py-2">Količina</th>
                                <th className="w-10 px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderItems.map((item, i) => (
                                <tr key={i} className="border-t border-border">
                                  <td className="px-3 py-2 font-mono text-xs">{item.ean}</td>
                                  <td className="px-3 py-2">{item.name}</td>
                                  <td className="px-3 py-2 text-right">
                                    <input type="number" min="1" value={item.quantity}
                                      onChange={e => setOrderItems(prev => prev.map((o, idx) => idx === i ? { ...o, quantity: parseInt(e.target.value) || 1 } : o))}
                                      className="w-16 h-7 px-2 bg-muted rounded text-right focus:outline-none" />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button onClick={() => setOrderItems(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/70">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Opomba</label>
                      <textarea rows={2} value={orderNote} onChange={e => setOrderNote(e.target.value)} className="w-full px-3 py-2 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveOrder} className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Save className="w-4 h-4" />Shrani naročilnico
                      </button>
                      <button onClick={handlePrintOrder} className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Printer className="w-4 h-4" />Natisni PDF
                      </button>
                    </div>
                  </div>

                  {/* Product search to add to order */}
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold">Dodaj artikle v naročilnico</h3>
                    <div className="flex gap-2">
                      <div className="flex gap-1 bg-muted rounded-lg p-1">
                        {(['name', 'ean', 'supplier'] as const).map(type => (
                          <button key={type} onClick={() => setOrderSearchType(type)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${orderSearchType === type ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                            {type === 'name' ? 'Ime' : type === 'ean' ? 'EAN' : 'Dobavitelj'}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                          placeholder={`Išči po ${orderSearchType === 'name' ? 'imenu' : orderSearchType === 'ean' ? 'EAN kodi' : 'dobavitelju'}...`}
                          className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80">
                          <tr className="text-muted-foreground">
                            <th className="text-left px-4 py-2 font-medium">EAN</th>
                            <th className="text-left px-4 py-2 font-medium">Artikel</th>
                            <th className="text-right px-4 py-2 font-medium">Zaloga</th>
                            <th className="text-right px-4 py-2 font-medium w-24"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrderProducts.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Ni rezultatov</td></tr>
                          ) : filteredOrderProducts.map(p => (
                            <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                              <td className="px-4 py-2 font-mono text-xs">{p.ean}</td>
                              <td className="px-4 py-2 font-medium">
                                {p.name}
                                {p.stock <= p.min_stock && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">nizka</span>}
                              </td>
                              <td className="px-4 py-2 text-right">{p.stock}</td>
                              <td className="px-4 py-2 text-right">
                                <button onClick={() => handleAddToOrder(p)}
                                  className="px-3 h-7 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 ml-auto">
                                  <Plus className="w-3 h-3" />Naroči
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOKUMENTI */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Dokumenti</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Fakture', icon: FileText, count: 0, desc: 'Izdane fakture partnerjem' },
                  { title: 'Dobropisi', icon: FileText, count: 0, desc: 'Izdani dobropisi' },
                  { title: 'Prevzemni listi', icon: ClipboardList, count: 0, desc: 'Prevzeti dokumenti od dobaviteljev' },
                  { title: 'Pogodbe', icon: BookOpen, count: 0, desc: 'Poslovne pogodbe in dogovori' },
                ].map(doc => (
                  <div key={doc.title} className="bg-card border border-border rounded-xl p-6 hover:border-violet-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <doc.icon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{doc.desc}</p>
                        <p className="text-xs text-muted-foreground mt-2">{doc.count} dokumentov</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Partners list in documents */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Partnerji</h3>
                  <button onClick={() => { resetPartnerForm(); setShowPartnerForm(true); }} className="h-8 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" />Dodaj
                  </button>
                </div>
                
                {showPartnerForm && (
                  <div className="bg-muted rounded-xl p-4 space-y-3 mb-4">
                    <h4 className="font-semibold text-sm">{editingPartner ? 'Uredi partnerja' : 'Nov partner'}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Naziv *', value: pName, setter: setPName },
                        { label: 'Davčna št. *', value: pTax, setter: setPTax },
                        { label: 'Naslov *', value: pAddress, setter: setPAddress },
                        { label: 'Mesto', value: pCity, setter: setPCity },
                        { label: 'Poštna številka', value: pPostal, setter: setPPostal },
                        { label: 'E-pošta', value: pEmail, setter: setPEmail },
                        { label: 'Telefon', value: pPhone, setter: setPPhone },
                      ].map(field => (
                        <div key={field.label}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
                          <input value={field.value} onChange={e => field.setter(e.target.value)} className="w-full h-9 px-3 bg-background rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600 text-sm border border-border" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSavePartner} className="px-4 h-8 bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors">{editingPartner ? 'Posodobi' : 'Dodaj'}</button>
                      <button onClick={resetPartnerForm} className="px-4 h-8 bg-muted hover:bg-muted/60 rounded-lg text-sm font-medium transition-colors">Prekliči</button>
                    </div>
                  </div>
                )}
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} placeholder="Išči po imenu ali davčni..." className="w-full h-9 pl-10 pr-4 bg-muted rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-600" />
                </div>
                
                <div className="divide-y divide-border">
                  {partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.tax_number.includes(partnerSearch)).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Ni partnerjev</p>
                  ) : partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.tax_number.includes(partnerSearch)).map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.tax_number} · {p.address}, {p.city}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditPartner(p)} className="p-1.5 hover:bg-muted rounded transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => handleDeletePartner(p)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NALEPKE / CENOVKE */}
          {activeTab === 'labels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Nalepke / Cenovke</h2>
                <button onClick={handlePrintLabels} disabled={selectedForLabel.length === 0}
                  className="px-4 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-40">
                  <Printer className="w-4 h-4" />Natisni PDF ({selectedForLabel.length})
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

          {/* URNIKI */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Urniki zaposlenih</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold">Dodaj urnik</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Zaposleni</label>
                    <input value={newEmployee} onChange={e => setNewEmployee(e.target.value)} placeholder="Ime in priimek" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Dan</label>
                    <select value={newDay} onChange={e => setNewDay(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600">
                      {days.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Od</label>
                    <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Do</label>
                    <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!newEmployee) { toast.error('Vnesite ime zaposlenega'); return; }
                    setSchedules(prev => [...prev, { id: Date.now().toString(), employee: newEmployee, day: newDay, start: newStart, end: newEnd }]);
                    setNewEmployee("");
                    toast.success('Urnik dodan');
                  }}
                  className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />Dodaj urnik
                </button>
              </div>
              
              {schedules.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Ni vnesenih urnikov. Dodajte urnik zgoraj.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 text-sm text-muted-foreground">
                        <th className="text-left px-4 py-3 font-medium">Zaposleni</th>
                        <th className="text-left px-4 py-3 font-medium">Dan</th>
                        <th className="text-left px-4 py-3 font-medium">Čas</th>
                        <th className="text-right px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map(s => (
                        <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {s.employee}
                            </div>
                          </td>
                          <td className="px-4 py-3 capitalize">{s.day}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {s.start} – {s.end}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setSchedules(prev => prev.filter(sc => sc.id !== s.id))} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* OTVORITEV */}
          {activeTab === 'opening' && (
            <div className="space-y-4 max-w-xl">
              <h2 className="text-xl font-bold">Otvoritev blagajne</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Pred začetkom dela vnesite začetno stanje blagajne in preverite, da je vse pripravljeno za odprtje.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Začetni znesek v blagajni (€)</label>
                    <input type="number" step="0.01" defaultValue="0.00" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Blagajnik</label>
                    <select className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600">
                      <option>Dženan Kedić (7001)</option>
                      <option>Eva Zakrajšek (7002)</option>
                      <option>Študent 1 (8001)</option>
                      <option>Študent 2 (8002)</option>
                      <option>Študent 3 (8003)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Blagajna</label>
                    <select className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600">
                      <option>Blagajna 1</option>
                      <option>Blagajna 2</option>
                      <option>Blagajna 3</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => toast.success('Otvoritev blagajne zabeležena')} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <DoorOpen className="w-5 h-5" />Potrdi otvoritev
                </button>
              </div>
            </div>
          )}

          {/* ZAKLJUČEVANJE */}
          {activeTab === 'closing' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Zaključevanje</h2>
              
              {/* Incoming closing reports */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold">Zaključki z blagajn</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{closingReports.length} zaključkov</span>
                </div>
                {closingReports.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Zaključki iz blagajn se bodo prikazali tukaj. Ob zaključku izmene ali dne na blagajni se poročilo samodejno pošlje sem.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {closingReports.map(r => (
                      <div key={r.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{r.type} – {r.cashier}</p>
                          <p className="text-xs text-muted-foreground">{r.date} · Gotovina: {r.cash.toFixed(2)}€ · Kartica: {r.card.toFixed(2)}€</p>
                        </div>
                        <span className="text-lg font-bold">{r.total.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual closing actions */}
              <div className="space-y-3">
                {[
                  { title: 'Zaključek izmene', desc: 'Generiraj poročilo za zaključeno izmeno', color: 'bg-blue-50 border-blue-200', btnColor: 'bg-blue-600 hover:bg-blue-700' },
                  { title: 'Dnevni zaključek', desc: 'Generiraj celodnevno poročilo za vse blagajne', color: 'bg-violet-50 border-violet-200', btnColor: 'bg-violet-600 hover:bg-violet-700' },
                  { title: 'Mesečni zaključek', desc: 'Mesečno finančno poročilo in arhiviranje', color: 'bg-amber-50 border-amber-200', btnColor: 'bg-amber-600 hover:bg-amber-700' },
                ].map(item => (
                  <div key={item.title} className={`border rounded-xl p-5 ${item.color}`}>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                    <button onClick={() => handleGenerateClosingPDF(item.title)} className={`px-4 h-9 ${item.btnColor} text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2`}>
                      <Printer className="w-4 h-4" />Generiraj PDF
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVENTURA */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Inventura</h2>
                <button
                  onClick={async () => {
                    toast.success('Inventura shranjena');
                  }}
                  className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />Shrani inventuro
                </button>
              </div>
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
                      <InventoryRow key={p.id} product={p} onUpdate={async (ean, counted) => {
                        const diff = counted - p.stock;
                        await supabase.from('products').update({ stock: counted } as any).eq('id', p.id as any);
                        if (diff !== 0) toast.success(`${p.name}: zaloga posodobljena (${diff > 0 ? '+' : ''}${diff})`);
                      }} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FINANČNA POROČILA */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Finančna poročila</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Dnevni promet', value: closingReports.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).reduce((s,r)=>s+r.total,0), sub: 'Danes' },
                  { label: 'Mesečni promet', value: closingReports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((s,r)=>s+r.total,0), sub: new Date().toLocaleDateString('sl-SI', { month: 'long', year: 'numeric' }) },
                  { label: 'Skupaj promet', value: closingReports.reduce((s,r)=>s+r.total,0), sub: 'Vse blagajne' },
                ].map(card => (
                  <div key={card.label} className="bg-card border border-border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground">{card.sub}</p>
                    <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
                    <p className="text-2xl font-bold text-primary mt-2">{card.value.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 text-sm text-muted-foreground">
                      <th className="text-left px-4 py-3 font-medium">Datum</th>
                      <th className="text-left px-4 py-3 font-medium">Tip</th>
                      <th className="text-left px-4 py-3 font-medium">Blagajnik</th>
                      <th className="text-right px-4 py-3 font-medium">Gotovina</th>
                      <th className="text-right px-4 py-3 font-medium">Kartica</th>
                      <th className="text-right px-4 py-3 font-medium">Skupaj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closingReports.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p>Poročila bodo prikazana po zaključenih izmenah.</p>
                      </td></tr>
                    ) : closingReports.map(r => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm">{r.date}</td>
                        <td className="px-4 py-3">{r.type}</td>
                        <td className="px-4 py-3">{r.cashier}</td>
                        <td className="px-4 py-3 text-right">{r.cash.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">{r.card.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right font-bold">{r.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* AVTORIZACIJA */}
          {activeTab === 'authorization' && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-xl font-bold">Avtorizacija</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Generirajte enkratno admin kodo za avtorizacijo varnostnih operacij na blagajni (storno, popusti, odpiranje predala itd.). Koda je časovno omejena.
                </p>
                
                {authCode && authCountdown > 0 ? (
                  <div className="text-center space-y-4">
                    <div className="bg-muted rounded-2xl p-8">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Admin koda</p>
                      <p className="font-mono text-5xl font-black tracking-[0.3em] text-foreground">{authCode}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className={`text-lg font-bold ${authCountdown <= 10 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                        {authCountdown}s
                      </span>
                      <span className="text-sm text-muted-foreground">preostane</span>
                    </div>
                    <button
                      onClick={generateAuthCode}
                      className="px-6 h-10 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium text-sm transition-colors"
                    >
                      Nova koda
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={generateAuthCode}
                      className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 mx-auto transition-colors shadow-lg"
                    >
                      <Shield className="w-6 h-6" />
                      ADMIN KODA
                    </button>
                    {authCode && authCountdown <= 0 && (
                      <p className="text-sm text-destructive mt-3">Koda je potekla. Generirajte novo.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// Inventory row component with live diff
const InventoryRow = ({ product, onUpdate }: { product: DBProduct; onUpdate: (ean: string, counted: number) => void }) => {
  const [counted, setCounted] = useState(product.stock);
  const diff = counted - product.stock;
  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-3 font-mono text-sm">{product.ean}</td>
      <td className="px-4 py-3 font-medium">{product.name}</td>
      <td className="px-4 py-3 text-right">{product.stock}</td>
      <td className="px-4 py-2 text-right">
        <input type="number" value={counted} onChange={e => setCounted(parseInt(e.target.value) || 0)}
          onBlur={() => onUpdate(product.ean, counted)}
          className="w-24 h-8 px-2 bg-muted rounded text-right focus:outline-none focus:ring-1 focus:ring-violet-600" />
      </td>
      <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {diff > 0 ? '+' : ''}{diff}
      </td>
    </tr>
  );
};

export default BackOfficeDashboard;
