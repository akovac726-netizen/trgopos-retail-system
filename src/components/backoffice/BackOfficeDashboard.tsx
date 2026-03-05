import { useState, useEffect } from "react";
import { 
  Briefcase, LogOut, Plus, Pencil, Trash2, Package, Tag, ClipboardList, 
  Search, Building2, BarChart3, ShoppingCart, FileText, CheckSquare, 
  BookOpen, Printer, X, Save, ChevronRight, AlertTriangle, Send,
  Calendar, Clock, User, Bell, TrendingUp, DoorOpen, Shield,
  Users, FileCheck, Eye, EyeOff, Check
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

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  birthDate: string;
  position: string;
  hireDate: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  tempAddress: string;
  tempPostalCode: string;
  tempCity: string;
  tempCountry: string;
  phone: string;
  email: string;
  emso: string;
  taxNumber: string;
  iban: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  dayPart: 'cel dan' | 'jutro' | 'popoldan';
  approver: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface SavedOrder {
  id: string;
  supplier: string;
  date: string;
  items: OrderItem[];
  status: string;
  fromProfile: string;
  toProfile: string;
  markedOrdered?: boolean;
  markedShipped?: boolean;
  receivedConfirmed?: boolean;
}

interface BackOfficeDashboardProps {
  onLogout: () => void;
  closingReports?: ClosingReportData[];
  role: 'admin' | 'shop';
}

type Tab = 'products' | 'orders' | 'documents' | 'labels' | 'schedules' | 'opening' | 'closing' | 'inventory' | 'reports' | 'authorization' | 'backendoffice' | 'logout';

const BackOfficeDashboard = ({ onLogout, closingReports: externalReports = [], role }: BackOfficeDashboardProps) => {
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
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

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

  // Authorization state - 4 hour expiry
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
    const expiry = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    setAuthCodeExpiry(expiry);
    setAuthCountdown(4 * 60 * 60);
    toast.success('Admin koda generirana – veljavna 4 ure');
  };

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Schedules
  const [scheduleSubTab, setScheduleSubTab] = useState<'hours' | 'schedule'>('hours');
  const [schedules, setSchedules] = useState<{ id: string; employee: string; day: string; start: string; end: string }[]>([]);
  const [newEmployee, setNewEmployee] = useState("");
  const [newDay, setNewDay] = useState("ponedeljek");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("16:00");

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', firstName: 'Dženan', lastName: 'Kedić', code: '70001', birthDate: '1990-01-01', position: 'Vodja', hireDate: '2024-01-15', address: '', postalCode: '', city: '', country: 'Slovenija', tempAddress: '', tempPostalCode: '', tempCity: '', tempCountry: '', phone: '', email: '', emso: '', taxNumber: '', iban: '' },
    { id: '2', firstName: 'Eva', lastName: 'Zakrajšek', code: '70002', birthDate: '1995-05-10', position: 'Blagajnik', hireDate: '2024-03-01', address: '', postalCode: '', city: '', country: 'Slovenija', tempAddress: '', tempPostalCode: '', tempCity: '', tempCountry: '', phone: '', email: '', emso: '', taxNumber: '', iban: '' },
    { id: '3', firstName: 'Študent', lastName: '1', code: '80001', birthDate: '2003-09-15', position: 'Študentsko delo', hireDate: '2025-01-10', address: '', postalCode: '', city: '', country: 'Slovenija', tempAddress: '', tempPostalCode: '', tempCity: '', tempCountry: '', phone: '', email: '', emso: '', taxNumber: '', iban: '' },
    { id: '4', firstName: 'Študent', lastName: '2', code: '80002', birthDate: '2004-02-20', position: 'Študentsko delo', hireDate: '2025-02-15', address: '', postalCode: '', city: '', country: 'Slovenija', tempAddress: '', tempPostalCode: '', tempCity: '', tempCountry: '', phone: '', email: '', emso: '', taxNumber: '', iban: '' },
  ]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  // Leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveEmployee, setLeaveEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("Letni dopust");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveDayPart, setLeaveDayPart] = useState<'cel dan' | 'jutro' | 'popoldan'>('cel dan');
  const [leaveApprover, setLeaveApprover] = useState("Admin (Direktor: Dženan Kedić)");
  const [leaveDesc, setLeaveDesc] = useState("");

  // BackEndOffice login
  const [backendLoggedIn, setBackendLoggedIn] = useState(false);
  const [backendUsername, setBackendUsername] = useState("");
  const [backendPassword, setBackendPassword] = useState("");
  const [backendSubTab, setBackendSubTab] = useState<'employees' | 'leave'>('employees');

  // Opening/closing state
  const [businessOpened, setBusinessOpened] = useState(false);

  // Financial reports sub
  const [reportSubTab, setReportSubTab] = useState<'statistics' | 'sales' | 'efficiency'>('statistics');

  // Closing reports
  const closingReports = externalReports;

  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];
  const days = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

  const knownEmployees = ['Dženan Kedić', 'Eva Zakrajšek', 'Študent 1', 'Študent 2'];

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
    const fromProfile = role === 'shop' ? 'Trgovina' : 'Direktor';
    const toProfile = role === 'shop' ? 'Direktor' : 'Trgovina';
    const newOrder: SavedOrder = { id: Date.now().toString(), supplier: orderSupplier, date: orderDate, items: [...orderItems], status: 'Poslano', fromProfile, toProfile };
    setSavedOrders(prev => [newOrder, ...prev]);
    setOrderItems([]); setOrderSupplier(""); setOrderNote(""); setOrderSubTab('list');
    toast.success('Naročilnica shranjena in poslana');
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

  const handlePrintLabels = () => {
    const selected = products.filter(p => selectedForLabel.includes(p.id));
    if (selected.length === 0) { toast.error('Izberite artikle za tiskanje'); return; }
    const labelHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cenovke</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;background:white;}
      .page{display:flex;flex-wrap:wrap;padding:10mm;gap:5mm;}
      .label{width:62mm;height:40mm;border:1px solid #ddd;border-radius:3mm;padding:4mm;display:flex;flex-direction:column;justify-content:space-between;page-break-inside:avoid;}
      .label-name{font-size:11pt;font-weight:bold;line-height:1.2;overflow:hidden;max-height:2.4em;}
      .label-ean{font-size:7pt;color:#666;font-family:monospace;}
      .label-price{font-size:18pt;font-weight:bold;text-align:right;color:#1a1a2e;}
      .label-category{font-size:7pt;color:#888;}
      @media print{body{margin:0;}.page{padding:5mm;}}</style>
      </head><body><div class="page">
      ${selected.map(p => `<div class="label"><div><div class="label-name">${p.name}</div><div class="label-category">${p.category}</div></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;"><div class="label-ean">${p.ean}</div><div class="label-price">${p.price.toFixed(2)} €</div></div></div>`).join('')}
      </div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(labelHTML); win.document.close(); }
    toast.success(`${selected.length} cenovk pripravljenih za tisk`);
  };

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

  const filteredOrderProducts = products.filter(p => {
    const q = orderSearch.toLowerCase();
    if (!q) return true;
    if (orderSearchType === 'ean') return p.ean.includes(q);
    if (orderSearchType === 'name') return p.name.toLowerCase().includes(q);
    return true;
  });

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.ean.includes(searchQuery)
  );

  const lowStockProducts = products.filter(p => p.stock <= p.min_stock);

  const handleBackendLogin = () => {
    if (
      (backendUsername === 'StandBuyAdmin' && backendPassword === 'Admin12273') ||
      (backendUsername === 'StandBuy.si' && backendPassword === 'TR122732207')
    ) {
      setBackendLoggedIn(true);
      toast.success('Prijava v BackEndOffice uspešna');
    } else {
      toast.error('Napačni podatki');
    }
  };

  const handleSaveEmployee = () => {
    if (!editingEmployee) return;
    if (!editingEmployee.firstName || !editingEmployee.lastName) { toast.error('Ime in priimek sta obvezna'); return; }
    const exists = employees.find(e => e.id === editingEmployee.id);
    if (exists) {
      setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? editingEmployee : e));
      toast.success('Zaposleni posodobljen');
    } else {
      setEmployees(prev => [...prev, editingEmployee]);
      toast.success('Zaposleni dodan');
    }
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  const handleCreateLeave = () => {
    if (!leaveEmployee || !leaveStart || !leaveEnd) { toast.error('Izpolnite vsa obvezna polja'); return; }
    const newLeave: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: leaveEmployee,
      employeeName: leaveEmployee,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      dayPart: leaveDayPart,
      approver: leaveApprover,
      description: leaveDesc,
      status: 'pending',
    };
    setLeaveRequests(prev => [...prev, newLeave]);
    setShowLeaveForm(false);
    setLeaveEmployee(""); setLeaveStart(""); setLeaveEnd(""); setLeaveDesc("");
    toast.success('Zahtevek za dopust ustvarjen');
  };

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
              <p className="text-xs text-muted-foreground">
                {role === 'admin' ? 'Direktor' : 'Trgovina'} · StandBuy
              </p>
            </div>
          </div>
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">{lowStockProducts.length} artiklov z nizko zalogo</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => { setBusinessOpened(true); toast.success('Poslovanje odprto'); }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors text-sm">
              <DoorOpen className="w-4 h-4" /> Otvoritev
            </button>
            <button onClick={() => { setBusinessOpened(false); toast.success('Poslovanje zaprto'); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors text-sm">
              <X className="w-4 h-4" /> Zapiranje
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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

          {/* BackEndOffice button */}
          <div className="p-2 border-t border-border">
            <button
              onClick={() => setActiveTab('backendoffice')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                activeTab === 'backendoffice' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>BackEndOffice</span>
            </button>
          </div>

          {/* Izhod at bottom */}
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
                  <button onClick={() => setOrderSubTab('list')}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${orderSubTab === 'list' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    Seznam naročil
                  </button>
                  <button onClick={() => setOrderSubTab('form')}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${orderSubTab === 'form' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                    <Plus className="w-3 h-3" />Naročilnica
                  </button>
                </div>
              </div>

              {orderSubTab === 'list' && (
                <div>
                  {savedOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="font-medium">Ni oddanih naročil</p>
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
                            <th className="text-left px-4 py-3 font-medium">Od</th>
                            <th className="text-left px-4 py-3 font-medium">Za</th>
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
                              <td className="px-4 py-3 text-sm">{order.fromProfile}</td>
                              <td className="px-4 py-3 text-sm">{order.toProfile}</td>
                              <td className="px-4 py-3 text-right">{order.items.length}</td>
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  order.status === 'Poslano' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'Naročeno' ? 'bg-yellow-100 text-yellow-700' :
                                  order.status === 'Poslano blago' ? 'bg-orange-100 text-orange-700' :
                                  order.status === 'Prejeto' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>{order.status}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {role === 'admin' && order.status === 'Poslano' && (
                                    <button onClick={() => setSavedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Naročeno', markedOrdered: true } : o))}
                                      className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-xs font-medium">
                                      Označi naročeno
                                    </button>
                                  )}
                                  {role === 'admin' && order.status === 'Naročeno' && (
                                    <button onClick={() => setSavedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Poslano blago', markedShipped: true } : o))}
                                      className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs font-medium">
                                      Označi poslano
                                    </button>
                                  )}
                                  {role === 'shop' && order.status === 'Poslano blago' && (
                                    <button onClick={() => setSavedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Prejeto', receivedConfirmed: true } : o))}
                                      className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium">
                                      Potrdi prejem
                                    </button>
                                  )}
                                  <button onClick={() => {
                                    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Naročilnica</title>
                                    <style>body{font-family:Arial;padding:20mm;}table{width:100%;border-collapse:collapse;margin-top:5mm;}th,td{border:1px solid #ddd;padding:6px;text-align:left;}th{background:#f5f5f5;}</style>
                                    </head><body><h2>Naročilnica #${order.id}</h2><p>Dobavitelj: ${order.supplier}</p><p>Datum: ${order.date}</p><p>Status: ${order.status}</p>
                                    <table><thead><tr><th>EAN</th><th>Artikel</th><th>Količina</th></tr></thead><tbody>
                                    ${order.items.map(i => `<tr><td>${i.ean}</td><td>${i.name}</td><td>${i.quantity}</td></tr>`).join('')}
                                    </tbody></table><script>window.onload=()=>{window.print();}</script></body></html>`;
                                    const win = window.open('', '_blank'); if (win) { win.document.write(html); win.document.close(); }
                                  }} className="p-1.5 hover:bg-muted rounded"><Printer className="w-3.5 h-3.5 text-muted-foreground" /></button>
                                  <button onClick={() => setSavedOrders(prev => prev.filter(o => o.id !== order.id))} className="p-1.5 hover:bg-destructive/10 rounded">
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

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
                    {orderItems.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Artikli v naročilnici ({orderItems.length})</label>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2">EAN</th><th className="text-left px-3 py-2">Artikel</th><th className="text-right px-3 py-2">Količina</th><th className="w-10 px-3 py-2"></th></tr></thead>
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
                                    <button onClick={() => setOrderItems(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive hover:text-destructive/70"><X className="w-3 h-3" /></button>
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
                      <button onClick={handleSaveOrder} className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"><Save className="w-4 h-4" />Pošlji naročilnico</button>
                      <button onClick={handlePrintOrder} className="px-6 h-10 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors flex items-center gap-2"><Printer className="w-4 h-4" />Natisni PDF</button>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold">Dodaj artikle v naročilnico</h3>
                    <div className="flex gap-2">
                      <div className="flex gap-1 bg-muted rounded-lg p-1">
                        {(['name', 'ean'] as const).map(type => (
                          <button key={type} onClick={() => setOrderSearchType(type)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${orderSearchType === type ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                            {type === 'name' ? 'Ime' : 'EAN'}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Išči..." className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-600" />
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80"><tr className="text-muted-foreground"><th className="text-left px-4 py-2 font-medium">EAN</th><th className="text-left px-4 py-2 font-medium">Artikel</th><th className="text-right px-4 py-2 font-medium">Zaloga</th><th className="text-right px-4 py-2 font-medium w-24"></th></tr></thead>
                        <tbody>
                          {filteredOrderProducts.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">Ni rezultatov</td></tr>
                          ) : filteredOrderProducts.map(p => (
                            <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                              <td className="px-4 py-2 font-mono text-xs">{p.ean}</td>
                              <td className="px-4 py-2 font-medium">{p.name}</td>
                              <td className="px-4 py-2 text-right">{p.stock}</td>
                              <td className="px-4 py-2 text-right">
                                <button onClick={() => handleAddToOrder(p)} className="px-3 h-7 bg-violet-600 hover:bg-violet-700 text-white rounded text-xs font-medium transition-colors flex items-center gap-1 ml-auto"><Plus className="w-3 h-3" />Naroči</button>
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
                  { title: 'Fakture', icon: FileText, desc: 'Izdane fakture partnerjem' },
                  { title: 'Dobropisi', icon: FileText, desc: 'Izdani dobropisi' },
                  { title: 'Prevzemni listi', icon: ClipboardList, desc: 'Prevzeti dokumenti od dobaviteljev' },
                  { title: 'Naročilnice', icon: ShoppingCart, desc: 'Pregled prejetih naročilnic' },
                ].map(doc => (
                  <div key={doc.title} className="bg-card border border-border rounded-xl p-6 hover:border-violet-300 transition-colors cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <doc.icon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div><h3 className="font-semibold text-foreground">{doc.title}</h3><p className="text-sm text-muted-foreground mt-0.5">{doc.desc}</p></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Partners */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Partnerji</h3>
                  <button onClick={() => { resetPartnerForm(); setShowPartnerForm(true); }} className="h-8 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"><Plus className="w-3 h-3" />Dodaj</button>
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
                  <input type="text" value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)} placeholder="Išči..." className="w-full h-9 pl-10 pr-4 bg-muted rounded-lg text-foreground text-sm focus:outline-none" />
                </div>
                <div className="divide-y divide-border">
                  {partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.tax_number.includes(partnerSearch)).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Ni partnerjev</p>
                  ) : partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || p.tax_number.includes(partnerSearch)).map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.tax_number} · {p.address}</p></div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditPartner(p)} className="p-1.5 hover:bg-muted rounded"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => handleDeletePartner(p)} className="p-1.5 hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NALEPKE */}
          {activeTab === 'labels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Nalepke / Cenovke</h2>
                <button onClick={handlePrintLabels} disabled={selectedForLabel.length === 0}
                  className="px-4 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-40">
                  <Printer className="w-4 h-4" />Natisni PDF ({selectedForLabel.length})
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setSelectedForLabel(products.map(p => p.id))} className="text-sm px-3 py-1 bg-muted rounded-lg hover:bg-muted/80">Izberi vse</button>
                <button onClick={() => setSelectedForLabel([])} className="text-sm px-3 py-1 bg-muted rounded-lg hover:bg-muted/80">Počisti</button>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/50 text-sm text-muted-foreground"><th className="px-4 py-3 w-10"></th><th className="text-left px-4 py-3 font-medium">EAN</th><th className="text-left px-4 py-3 font-medium">Artikel</th><th className="text-right px-4 py-3 font-medium">Cena</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedForLabel(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                        <td className="px-4 py-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedForLabel.includes(p.id) ? 'bg-violet-600 border-violet-600' : 'border-muted-foreground'}`}>
                            {selectedForLabel.includes(p.id) && <Check className="w-3 h-3 text-white" />}
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
              <h2 className="text-xl font-bold">Urniki</h2>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setScheduleSubTab('hours')}
                  className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${scheduleSubTab === 'hours' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Delovni čas
                </button>
                <button onClick={() => setScheduleSubTab('schedule')}
                  className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${scheduleSubTab === 'schedule' ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Urnik zaposlenih
                </button>
              </div>

              {scheduleSubTab === 'hours' && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Pregled ur</h3>
                    <p className="text-sm text-muted-foreground mb-4">Število ur vpisanih v sistem za vsakega zaposlenega</p>
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-muted/50 text-muted-foreground"><th className="text-left px-4 py-3">Zaposleni</th><th className="text-right px-4 py-3">Vpisane ure</th><th className="text-right px-4 py-3">Realizirane ure</th><th className="text-right px-4 py-3">Razlika</th></tr></thead>
                        <tbody>
                          {knownEmployees.map(emp => {
                            const empSchedules = schedules.filter(s => s.employee === emp);
                            const totalHours = empSchedules.reduce((sum, s) => {
                              const start = parseInt(s.start.split(':')[0]) + parseInt(s.start.split(':')[1]) / 60;
                              const end = parseInt(s.end.split(':')[0]) + parseInt(s.end.split(':')[1]) / 60;
                              return sum + (end - start);
                            }, 0);
                            return (
                              <tr key={emp} className="border-t border-border">
                                <td className="px-4 py-3 font-medium">{emp}</td>
                                <td className="px-4 py-3 text-right">{totalHours.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-right">{totalHours.toFixed(1)}h</td>
                                <td className="px-4 py-3 text-right text-muted-foreground">0h</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {scheduleSubTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold">Urejanje urnika</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Zaposleni</label>
                        <select value={newEmployee} onChange={e => setNewEmployee(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none">
                          <option value="">Izberi...</option>
                          {knownEmployees.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Dan</label>
                        <select value={newDay} onChange={e => setNewDay(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none">
                          {days.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Od</label>
                        <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Do</label>
                        <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none" />
                      </div>
                    </div>
                    <button onClick={() => {
                      if (!newEmployee) { toast.error('Izberite zaposlenega'); return; }
                      setSchedules(prev => [...prev, { id: Date.now().toString(), employee: newEmployee, day: newDay, start: newStart, end: newEnd }]);
                      toast.success('Urnik dodan');
                    }} className="px-6 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">Dodaj</button>
                  </div>
                  {schedules.length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-muted/50 text-muted-foreground"><th className="text-left px-4 py-3">Zaposleni</th><th className="text-left px-4 py-3">Dan</th><th className="text-left px-4 py-3">Čas</th><th className="text-right px-4 py-3">Akcije</th></tr></thead>
                        <tbody>
                          {schedules.map(s => (
                            <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                              <td className="px-4 py-3 font-medium">{s.employee}</td>
                              <td className="px-4 py-3 capitalize">{s.day}</td>
                              <td className="px-4 py-3">{s.start} – {s.end}</td>
                              <td className="px-4 py-3 text-right"><button onClick={() => setSchedules(prev => prev.filter(sc => sc.id !== s.id))} className="p-2 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OTVORITEV */}
          {activeTab === 'opening' && (
            <div className="space-y-4 max-w-xl">
              <h2 className="text-xl font-bold">Otvoritev blagajne</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Pred začetkom dela vnesite začetno stanje blagajne.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Začetni znesek v blagajni (€)</label>
                    <input type="number" step="0.01" defaultValue="0.00" className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Blagajnik</label>
                    <select className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none">
                      {knownEmployees.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => { setBusinessOpened(true); toast.success('Otvoritev blagajne zabeležena'); }} className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <DoorOpen className="w-5 h-5" />Potrdi otvoritev
                </button>
              </div>
            </div>
          )}

          {/* ZAKLJUČEVANJE */}
          {activeTab === 'closing' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Zaključevanje</h2>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-violet-600" />
                  <h3 className="font-semibold">Zaključki z blagajn</h3>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{closingReports.length}</span>
                </div>
                {closingReports.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Zaključki iz blagajn se bodo prikazali tukaj.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {closingReports.map(r => (
                      <div key={r.id} className="py-3 flex items-center justify-between">
                        <div><p className="font-medium text-sm">{r.type} – {r.cashier}</p><p className="text-xs text-muted-foreground">{r.date}</p></div>
                        <span className="text-lg font-bold">{r.total.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Zaključek izmene', btnColor: 'bg-blue-600 hover:bg-blue-700' },
                  { title: 'Dnevni zaključek', btnColor: 'bg-violet-600 hover:bg-violet-700' },
                  { title: 'Mesečni zaključek', btnColor: 'bg-amber-600 hover:bg-amber-700' },
                ].map(item => (
                  <button key={item.title} onClick={() => handleGenerateClosingPDF(item.title)} className={`w-full px-4 h-12 ${item.btnColor} text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}>
                    <Printer className="w-4 h-4" />{item.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INVENTURA */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Inventura</h2>
                <button onClick={() => toast.success('Inventura shranjena')} className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Save className="w-4 h-4" />Shrani inventuro
                </button>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/50 text-sm text-muted-foreground"><th className="text-left px-4 py-3">EAN</th><th className="text-left px-4 py-3">Artikel</th><th className="text-right px-4 py-3">Evidenčna</th><th className="text-right px-4 py-3">Dejanska</th><th className="text-right px-4 py-3">Razlika</th></tr></thead>
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
              <h2 className="text-xl font-bold">Finančna poročila – Pregled poslovanja</h2>
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'statistics' as const, label: 'Statistika' },
                  { id: 'sales' as const, label: 'Pregled prodaje' },
                  { id: 'efficiency' as const, label: 'Učinkovitost prodajalcev' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setReportSubTab(tab.id)}
                    className={`px-4 h-9 rounded-lg text-sm font-medium transition-colors ${reportSubTab === tab.id ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {reportSubTab === 'statistics' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Dnevni promet', value: closingReports.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).reduce((s,r)=>s+r.total,0), sub: 'Danes' },
                      { label: 'Mesečni promet', value: closingReports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((s,r)=>s+r.total,0), sub: 'Ta mesec' },
                      { label: 'Skupaj promet', value: closingReports.reduce((s,r)=>s+r.total,0), sub: 'Vse' },
                    ].map(card => (
                      <div key={card.label} className="bg-card border border-border rounded-xl p-6">
                        <p className="text-sm text-muted-foreground">{card.sub}</p>
                        <p className="text-sm font-medium text-foreground mt-1">{card.label}</p>
                        <p className="text-2xl font-bold text-primary mt-2">{card.value.toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold mb-2">Plačilna sredstva</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Gotovina</span><span className="font-medium">{closingReports.reduce((s,r)=>s+r.cash,0).toFixed(2)} €</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Kartica</span><span className="font-medium">{closingReports.reduce((s,r)=>s+r.card,0).toFixed(2)} €</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Ostalo</span><span className="font-medium">{closingReports.reduce((s,r)=>s+r.other,0).toFixed(2)} €</span></div>
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-6">
                      <h3 className="font-semibold mb-2">Transakcije</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Št. transakcij</span><span className="font-medium">{closingReports.reduce((s,r)=>s+r.transactionCount,0)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Št. artiklov</span><span className="font-medium">{closingReports.reduce((s,r)=>s+r.itemCount,0)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-muted-foreground">Povprečen račun</span><span className="font-medium">{closingReports.length > 0 ? (closingReports.reduce((s,r)=>s+r.total,0) / closingReports.reduce((s,r)=>s+r.transactionCount,0) || 0).toFixed(2) : '0.00'} €</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportSubTab === 'sales' && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="bg-muted/50 text-sm text-muted-foreground"><th className="text-left px-4 py-3">Datum</th><th className="text-left px-4 py-3">Tip</th><th className="text-left px-4 py-3">Blagajnik</th><th className="text-right px-4 py-3">Gotovina</th><th className="text-right px-4 py-3">Kartica</th><th className="text-right px-4 py-3">Skupaj</th></tr></thead>
                    <tbody>
                      {closingReports.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Ni podatkov</td></tr>
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
              )}

              {reportSubTab === 'efficiency' && (
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="bg-muted/50 text-sm text-muted-foreground"><th className="text-left px-4 py-3">Prodajalec</th><th className="text-right px-4 py-3">Št. transakcij</th><th className="text-right px-4 py-3">Promet</th><th className="text-right px-4 py-3">Povprečen račun</th></tr></thead>
                      <tbody>
                        {knownEmployees.map(emp => {
                          const empReports = closingReports.filter(r => r.cashier === emp);
                          const totalSales = empReports.reduce((s, r) => s + r.total, 0);
                          const totalTx = empReports.reduce((s, r) => s + r.transactionCount, 0);
                          return (
                            <tr key={emp} className="border-t border-border">
                              <td className="px-4 py-3 font-medium">{emp}</td>
                              <td className="px-4 py-3 text-right">{totalTx}</td>
                              <td className="px-4 py-3 text-right font-bold">{totalSales.toFixed(2)} €</td>
                              <td className="px-4 py-3 text-right">{totalTx > 0 ? (totalSales / totalTx).toFixed(2) : '0.00'} €</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AVTORIZACIJA */}
          {activeTab === 'authorization' && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-xl font-bold">Avtorizacija</h2>
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Generirajte enkratno admin kodo za avtorizacijo varnostnih operacij. Koda je veljavna 4 ure.
                </p>
                
                {authCode && authCountdown > 0 ? (
                  <div className="text-center space-y-4">
                    <div className="bg-muted rounded-2xl p-8">
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Admin koda</p>
                      <p className="font-mono text-5xl font-black tracking-[0.3em] text-foreground">{authCode}</p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className={`text-lg font-bold ${authCountdown <= 300 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                        {formatCountdown(authCountdown)}
                      </span>
                      <span className="text-sm text-muted-foreground">preostane</span>
                    </div>
                    <button onClick={generateAuthCode} className="px-6 h-10 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium text-sm transition-colors">
                      Nova koda
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button onClick={generateAuthCode} className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 mx-auto transition-colors shadow-lg">
                      <Shield className="w-6 h-6" /> ADMIN KODA
                    </button>
                    {authCode && authCountdown <= 0 && (
                      <p className="text-sm text-destructive mt-3">Koda je potekla. Generirajte novo.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BACKENDOFFICE */}
          {activeTab === 'backendoffice' && (
            <div className="space-y-4">
              {!backendLoggedIn ? (
                <div className="max-w-md mx-auto mt-20">
                  <div className="bg-card border border-border rounded-xl p-8 space-y-4">
                    <h2 className="text-xl font-bold text-center">BackEndOffice – Prijava</h2>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Uporabniško ime</label>
                      <input type="text" value={backendUsername} onChange={e => setBackendUsername(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Geslo</label>
                      <input type="password" value={backendPassword} onChange={e => setBackendPassword(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={handleBackendLogin} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors">
                      PRIJAVA
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-4 mb-6">
                    <button onClick={() => setBackendSubTab('employees')}
                      className={`px-6 py-3 rounded-xl font-bold text-base transition-colors ${backendSubTab === 'employees' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Users className="w-5 h-5 inline mr-2" />ZAPOSLENI
                    </button>
                    <button onClick={() => setBackendSubTab('leave')}
                      className={`px-6 py-3 rounded-xl font-bold text-base transition-colors ${backendSubTab === 'leave' ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Calendar className="w-5 h-5 inline mr-2" />ZAHTEVKI DOPUSTA
                    </button>
                  </div>

                  {backendSubTab === 'employees' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => { setEditingEmployee({ id: Date.now().toString(), firstName: '', lastName: '', code: '', birthDate: '', position: '', hireDate: new Date().toISOString().split('T')[0], address: '', postalCode: '', city: '', country: 'Slovenija', tempAddress: '', tempPostalCode: '', tempCity: '', tempCountry: '', phone: '', email: '', emso: '', taxNumber: '', iban: '' }); setShowEmployeeForm(true); }}
                          className="px-3 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"><Plus className="w-4 h-4" />Nov zaposleni</button>
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Iskanje..." className="w-full h-9 pl-10 pr-4 bg-muted rounded-lg text-sm" />
                        </div>
                        <button onClick={() => setEmpSearch("")} className="px-3 h-9 bg-muted rounded-lg text-sm">Prikaži vse</button>
                      </div>

                      {showEmployeeForm && editingEmployee && (
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                          <h3 className="font-bold">{employees.find(e => e.id === editingEmployee.id) ? 'Uredi zaposlenega' : 'Nov zaposleni'}</h3>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Osnovni podatki</h4>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Ime *', key: 'firstName' as const },
                                { label: 'Priimek *', key: 'lastName' as const },
                                { label: 'Šifra', key: 'code' as const },
                                { label: 'Datum rojstva', key: 'birthDate' as const, type: 'date' },
                                { label: 'Delovno mesto', key: 'position' as const },
                                { label: 'Datum zaposlitve', key: 'hireDate' as const, type: 'date' },
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                                  <input type={f.type || 'text'} value={editingEmployee[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })} className="w-full h-9 px-3 bg-muted rounded-lg text-sm focus:outline-none border border-border" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Stalno bivališče</h4>
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: 'Naslov', key: 'address' as const },
                                { label: 'Poštna št.', key: 'postalCode' as const },
                                { label: 'Pošta', key: 'city' as const },
                                { label: 'Država', key: 'country' as const },
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                                  <input value={editingEmployee[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })} className="w-full h-9 px-3 bg-muted rounded-lg text-sm focus:outline-none border border-border" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Začasno bivališče</h4>
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: 'Naslov', key: 'tempAddress' as const },
                                { label: 'Poštna št.', key: 'tempPostalCode' as const },
                                { label: 'Pošta', key: 'tempCity' as const },
                                { label: 'Država', key: 'tempCountry' as const },
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                                  <input value={editingEmployee[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })} className="w-full h-9 px-3 bg-muted rounded-lg text-sm focus:outline-none border border-border" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Kontaktni in identifikacijski podatki</h4>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Telefon', key: 'phone' as const },
                                { label: 'E-pošta', key: 'email' as const },
                                { label: 'EMŠO', key: 'emso' as const },
                                { label: 'Davčna številka', key: 'taxNumber' as const },
                                { label: 'IBAN', key: 'iban' as const },
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
                                  <input value={editingEmployee[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })} className="w-full h-9 px-3 bg-muted rounded-lg text-sm focus:outline-none border border-border" />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={handleSaveEmployee} className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"><Check className="w-4 h-4" />Potrdi</button>
                            <button onClick={() => { setShowEmployeeForm(false); setEditingEmployee(null); }} className="px-6 h-10 bg-muted rounded-lg font-medium">Prekliči</button>
                          </div>
                        </div>
                      )}

                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-muted/50 text-muted-foreground"><th className="text-left px-4 py-3">Ime in priimek</th><th className="text-left px-4 py-3">Šifra</th><th className="text-left px-4 py-3">Delovno mesto</th><th className="text-left px-4 py-3">Datum zaposlitve</th><th className="text-right px-4 py-3">Akcije</th></tr></thead>
                          <tbody>
                            {employees.filter(e => !empSearch || `${e.firstName} ${e.lastName}`.toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
                              <tr key={emp.id} className="border-t border-border hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{emp.firstName} {emp.lastName}</td>
                                <td className="px-4 py-3 font-mono">{emp.code}</td>
                                <td className="px-4 py-3">{emp.position}</td>
                                <td className="px-4 py-3">{emp.hireDate}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => { setEditingEmployee(emp); setShowEmployeeForm(true); }} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                                    <button onClick={() => { if (confirm(`Odstranite ${emp.firstName} ${emp.lastName}?`)) setEmployees(prev => prev.filter(e => e.id !== emp.id)); }} className="p-2 hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4 text-destructive" /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {backendSubTab === 'leave' && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-bold">Zahtevki za dopust</h3>
                        <button onClick={() => setShowLeaveForm(true)} className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1">
                          <Plus className="w-4 h-4" />Nov zahtevek
                        </button>
                      </div>

                      {showLeaveForm && (
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                          <h3 className="font-bold">Zahtevek za dopust</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Uporabnik *</label>
                              <select value={leaveEmployee} onChange={e => setLeaveEmployee(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg focus:outline-none">
                                <option value="">Izberi...</option>
                                {employees.map(e => <option key={e.id} value={`${e.firstName} ${e.lastName}`}>{e.firstName} {e.lastName}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Tip dopusta</label>
                              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg focus:outline-none">
                                <option>Letni dopust</option>
                                <option>Izredni dopust</option>
                                <option>Drug dopust</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Začetni datum *</label>
                              <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Končni datum *</label>
                              <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className="w-full h-10 px-3 bg-muted rounded-lg focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Trajanje</label>
                              <select value={leaveDayPart} onChange={e => setLeaveDayPart(e.target.value as any)} className="w-full h-10 px-3 bg-muted rounded-lg focus:outline-none">
                                <option value="cel dan">Cel dan</option>
                                <option value="jutro">Samo jutro</option>
                                <option value="popoldan">Samo popoldan</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground mb-1 block">Bo odobril</label>
                              <input type="text" value={leaveApprover} readOnly className="w-full h-10 px-3 bg-muted rounded-lg text-muted-foreground" />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Opis</label>
                            <textarea rows={3} value={leaveDesc} onChange={e => setLeaveDesc(e.target.value)} className="w-full px-3 py-2 bg-muted rounded-lg resize-none focus:outline-none" placeholder="Razlog za dopust..." />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCreateLeave} className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                              USTVARI ZAHTEVEK ZA DOPUST
                            </button>
                            <button onClick={() => { setShowLeaveForm(false); setLeaveEmployee(""); setLeaveStart(""); setLeaveEnd(""); setLeaveDesc(""); }} className="px-6 h-10 bg-destructive/10 text-destructive rounded-lg font-medium">
                              RAZVELJAVI
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-muted/50 text-muted-foreground"><th className="text-left px-4 py-3">Zaposleni</th><th className="text-left px-4 py-3">Tip</th><th className="text-left px-4 py-3">Od – Do</th><th className="text-left px-4 py-3">Trajanje</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Akcije</th></tr></thead>
                          <tbody>
                            {leaveRequests.length === 0 ? (
                              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Ni zahtevkov za dopust</td></tr>
                            ) : leaveRequests.map(lr => (
                              <tr key={lr.id} className="border-t border-border hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{lr.employeeName}</td>
                                <td className="px-4 py-3">{lr.type}</td>
                                <td className="px-4 py-3">{lr.startDate} – {lr.endDate}</td>
                                <td className="px-4 py-3">{lr.dayPart}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    lr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    lr.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>{lr.status === 'pending' ? 'V obravnavi' : lr.status === 'approved' ? 'Odobreno' : 'Zavrnjeno'}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {lr.status === 'pending' && (
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => setLeaveRequests(prev => prev.map(l => l.id === lr.id ? { ...l, status: 'approved' } : l))} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">Odobri</button>
                                      <button onClick={() => setLeaveRequests(prev => prev.map(l => l.id === lr.id ? { ...l, status: 'rejected' } : l))} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Zavrni</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

// Inventory row component
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
