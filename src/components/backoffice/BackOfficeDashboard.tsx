import { useState, useEffect } from "react";
import { Pencil, Plus, Search, X, Check, Trash2, Clock, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct {
  id: string; ean: string; name: string; price: number; stock: number; min_stock: number; category: string;
}
interface Partner {
  id: string; name: string; tax_number: string; address: string; city: string; postal_code: string; email: string; phone: string; notes: string;
}
interface OrderItem { productId: string; ean: string; name: string; quantity: number; }
interface Employee {
  id: string; firstName: string; lastName: string; code: string; birthDate: string; birthPlace: string; position: string; hireDate: string;
  username: string; password: string;
  address: string; postalCode: string; city: string; country: string;
  phone: string; email: string; emso: string; taxNumber: string; iban: string;
}
interface LeaveRequest {
  id: string; employeeName: string; type: string; startDate: string; endDate: string;
  approver: string; description: string; status: 'pending' | 'approved' | 'rejected';
}
interface SavedOrder {
  id: string; supplier: string; date: string; items: OrderItem[]; status: string;
  fromProfile: string; toProfile: string;
  markedOrdered?: boolean; markedShipped?: boolean; receivedConfirmed?: boolean;
}
interface ClosingReportData {
  id: string; type: string; cashier: string; cashierId: string; date: string;
  total: number; cash: number; card: number; other: number; transactionCount: number; itemCount: number;
}

interface BackOfficeDashboardProps {
  onLogout: () => void;
  closingReports?: ClosingReportData[];
  role: 'admin' | 'shop';
}

type Tab = 'poslovanje' | 'artikli' | 'narocila' | 'dokumenti' | 'nalepke' | 'urnik' | 'zakljucevanje' | 'inventura' | 'financna' | 'partnerji' | 'avtorizacija';
type ArtikliSubTab = 'sifrant' | 'cene' | 'akcije' | 'popusti';
type PromoType = 'akcijska_cena' | 'popust_percent' | 'kolicinska';
interface Promotion {
  id: string; type: PromoType; product_ean: string; product_name: string;
  start_date: string; end_date: string; promo_price: number | null;
  discount_percent: number | null; qty_required: number | null; qty_free: number | null;
  active: boolean;
}

const BackOfficeDashboard = ({ onLogout, closingReports: externalReports = [], role }: BackOfficeDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('poslovanje');
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

  // Partner form
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [pName, setPName] = useState("");
  const [pTax, setPTax] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [pCity, setPCity] = useState("");
  const [pPostal, setPPostal] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pNotes, setPNotes] = useState("");
  const [pOwner, setPOwner] = useState("");
  const [pCountry, setPCountry] = useState("Slovenija");
  const [pVatId, setPVatId] = useState("");

  // Authorization
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [authCodeExpiry, setAuthCodeExpiry] = useState<number>(0);
  const [authCountdown, setAuthCountdown] = useState<number>(0);

  // Orders
  const [orderSubTab, setOrderSubTab] = useState<'list' | 'form'>('list');
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchType, setOrderSearchType] = useState<'name' | 'ean'>('name');
  const [orderSupplier, setOrderSupplier] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderNote, setOrderNote] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);

  // Labels
  const [selectedForLabel, setSelectedForLabel] = useState<string[]>([]);

  // Schedules
  const [scheduleSubTab, setScheduleSubTab] = useState<'hours' | 'schedule'>('hours');
  const [schedules, setSchedules] = useState<{ id: string; employee: string; day: string; start: string; end: string }[]>([]);
  const [newEmployee, setNewEmployee] = useState("");
  const [newDay, setNewDay] = useState("ponedeljek");
  const [newStart, setNewStart] = useState("08:00");
  const [newEnd, setNewEnd] = useState("16:00");

  // Financial
  const [reportSubTab, setReportSubTab] = useState<'statistics' | 'sales' | 'efficiency'>('statistics');

  // BackEndOffice
  const [showBackend, setShowBackend] = useState(false);
  const [backendLoggedIn, setBackendLoggedIn] = useState(false);
  const [backendUsername, setBackendUsername] = useState("");
  const [backendPassword, setBackendPassword] = useState("");
  const [backendSubTab, setBackendSubTab] = useState<'zaposleni' | 'zahtevki' | 'pregled'>('zaposleni');

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveEmployee, setLeaveEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("Letni dopust");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveApprover, setLeaveApprover] = useState("Admin (Direktor: Dženan Kedić)");
  const [leaveDesc, setLeaveDesc] = useState("");

  // Poslovanje - Opening/Closing
  const [businessOpened, setBusinessOpened] = useState(false);
  const [showOpenConfirm, setShowOpenConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Zaključevanje
  const [showZakljuciConfirm, setShowZakljuciConfirm] = useState(false);

  // Artikli sub-tabs
  const [artikliSubTab, setArtikliSubTab] = useState<ArtikliSubTab>('sifrant');

  // Promotions
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoType, setPromoType] = useState<PromoType>('akcijska_cena');
  const [promoEan, setPromoEan] = useState("");
  const [promoProductName, setPromoProductName] = useState("");
  const [promoStartDate, setPromoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [promoEndDate, setPromoEndDate] = useState("");
  const [promoPrice, setPromoPrice] = useState("");
  const [promoDiscountPercent, setPromoDiscountPercent] = useState("");
  const [promoQtyRequired, setPromoQtyRequired] = useState("");
  const [promoQtyFree, setPromoQtyFree] = useState("");

  const closingReports = externalReports;
  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];
  const knownEmployees = employees.map(e => `${e.firstName} ${e.lastName}`);
  const days = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

  useEffect(() => {
    fetchProducts(); fetchPartners(); fetchEmployees(); fetchLeaveRequests(); fetchOrders(); fetchSchedules(); fetchBusinessDay(); fetchClosingReportsFromDB(); fetchPromotions();
    const channel = supabase
      .channel('bo-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partners' }, fetchPartners)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, fetchLeaveRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, fetchSchedules)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_days' }, fetchBusinessDay)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'closing_reports' }, fetchClosingReportsFromDB)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchClosingReportsFromDB)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, fetchPromotions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (authCodeExpiry <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((authCodeExpiry - Date.now()) / 1000));
      setAuthCountdown(remaining);
      if (remaining <= 0) { setAuthCode(null); setAuthCodeExpiry(0); }
    }, 1000);
    return () => clearInterval(interval);
  }, [authCodeExpiry]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    if (data) setProducts((data as unknown as DBProduct[]) || []);
    setLoading(false);
  };
  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    if (data) setPartners((data as unknown as Partner[]) || []);
  };
  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('first_name' as any);
    if (data) {
      setEmployees((data as any[]).map((e: any) => ({
        id: e.id, firstName: e.first_name, lastName: e.last_name, code: e.code,
        birthDate: e.birth_date, birthPlace: e.birth_place, position: e.position,
        hireDate: e.hire_date, username: e.username, password: e.password,
        address: e.address, postalCode: e.postal_code, city: e.city, country: e.country,
        phone: e.phone, email: e.email, emso: e.emso, taxNumber: e.tax_number, iban: e.iban,
      })));
    }
  };
  const fetchLeaveRequests = async () => {
    const { data } = await supabase.from('leave_requests').select('*').order('created_at' as any);
    if (data) {
      setLeaveRequests((data as any[]).map((lr: any) => ({
        id: lr.id, employeeName: lr.employee_name, type: lr.type,
        startDate: lr.start_date, endDate: lr.end_date, approver: lr.approver,
        description: lr.description, status: lr.status,
      })));
    }
  };
  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at' as any);
    if (data) {
      setSavedOrders((data as any[]).map((o: any) => ({
        id: o.id, supplier: o.supplier, date: o.date, items: o.items as OrderItem[],
        status: o.status, fromProfile: o.from_profile, toProfile: o.to_profile,
        markedOrdered: o.marked_ordered, markedShipped: o.marked_shipped, receivedConfirmed: o.received_confirmed,
      })));
    }
  };
  const fetchSchedules = async () => {
    const { data } = await supabase.from('schedules').select('*').order('created_at' as any);
    if (data) {
      setSchedules((data as any[]).map((s: any) => ({
        id: s.id, employee: s.employee, day: s.day, start: s.start_time, end: s.end_time,
      })));
    }
  };
  const fetchBusinessDay = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('business_days').select('*').eq('date', today as any).maybeSingle();
    if (data) setBusinessOpened((data as any).status === 'open');
    else setBusinessOpened(false);
  };
  const fetchClosingReportsFromDB = async () => {
    // Realtime trigger - forces component awareness of closing_reports/transactions changes
  };

  const fetchPromotions = async () => {
    const { data } = await supabase.from('promotions').select('*').order('start_date' as any);
    if (data) setPromotions((data as any[]).map((p: any) => ({
      id: p.id, type: p.type, product_ean: p.product_ean, product_name: p.product_name,
      start_date: p.start_date, end_date: p.end_date, promo_price: p.promo_price,
      discount_percent: p.discount_percent, qty_required: p.qty_required, qty_free: p.qty_free,
      active: p.active,
    })));
  };

  const resetPromoForm = () => {
    setShowPromoForm(false); setEditingPromo(null); setPromoType('akcijska_cena');
    setPromoEan(""); setPromoProductName(""); setPromoStartDate(new Date().toISOString().split('T')[0]);
    setPromoEndDate(""); setPromoPrice(""); setPromoDiscountPercent(""); setPromoQtyRequired(""); setPromoQtyFree("");
  };

  const handlePromoEanLookup = (ean: string) => {
    setPromoEan(ean);
    const found = products.find(p => p.ean === ean);
    if (found) setPromoProductName(found.name);
    else setPromoProductName("");
  };

  const handleSavePromo = async () => {
    if (!promoEan || !promoStartDate || !promoEndDate) { toast.error('Izpolnite vsa obvezna polja'); return; }
    const productName = promoProductName || products.find(p => p.ean === promoEan)?.name || promoEan;
    const d: any = {
      type: promoType, product_ean: promoEan, product_name: productName,
      start_date: promoStartDate, end_date: promoEndDate, active: true,
      promo_price: promoType === 'akcijska_cena' ? parseFloat(promoPrice) || null : null,
      discount_percent: promoType === 'popust_percent' ? parseFloat(promoDiscountPercent) || null : null,
      qty_required: promoType === 'kolicinska' ? parseInt(promoQtyRequired) || null : null,
      qty_free: promoType === 'kolicinska' ? parseInt(promoQtyFree) || null : null,
    };
    if (editingPromo) {
      const { error } = await supabase.from('promotions').update(d).eq('id', editingPromo.id as any);
      if (error) toast.error('Napaka'); else { toast.success('Akcija posodobljena'); resetPromoForm(); }
    } else {
      const { error } = await supabase.from('promotions').insert(d);
      if (error) toast.error('Napaka'); else { toast.success('Akcija ustvarjena'); resetPromoForm(); }
    }
  };

  const handleEditPromo = (p: Promotion) => {
    setEditingPromo(p); setPromoType(p.type); setPromoEan(p.product_ean);
    setPromoProductName(p.product_name); setPromoStartDate(p.start_date); setPromoEndDate(p.end_date);
    setPromoPrice(p.promo_price?.toString() || ""); setPromoDiscountPercent(p.discount_percent?.toString() || "");
    setPromoQtyRequired(p.qty_required?.toString() || ""); setPromoQtyFree(p.qty_free?.toString() || "");
    setShowPromoForm(true);
  };

  const handleDeletePromo = async (p: Promotion) => {
    if (!confirm(`Izbrišete akcijo za ${p.product_name}?`)) return;
    await supabase.from('promotions').delete().eq('id', p.id as any);
    toast.success('Akcija izbrisana');
  };

  const handleTogglePromo = async (p: Promotion) => {
    await supabase.from('promotions').update({ active: !p.active } as any).eq('id', p.id as any);
    toast.success(p.active ? 'Akcija deaktivirana' : 'Akcija aktivirana');
  };

  const promoTypeLabel = (t: PromoType) => t === 'akcijska_cena' ? 'Akcijska cena' : t === 'popust_percent' ? '% Popust' : 'Količinska akcija';


  const generateAuthCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setAuthCode(code);
    setAuthCodeExpiry(Date.now() + 4 * 60 * 60 * 1000);
    setAuthCountdown(4 * 60 * 60);
    toast.success('Admin koda generirana – veljavna 4 ure');
  };
  const formatCountdown = (s: number) => `${Math.floor(s/3600)}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const resetProductForm = () => { setFormEan(""); setFormName(""); setFormPrice(""); setFormStock(""); setFormMinStock("5"); setFormCategory("Ostalo"); setShowAddForm(false); setEditingProduct(null); };
  const handleEditStart = (p: DBProduct) => { setEditingProduct(p); setFormEan(p.ean); setFormName(p.name); setFormPrice(p.price.toString()); setFormStock(p.stock.toString()); setFormMinStock(p.min_stock.toString()); setFormCategory(p.category); setShowAddForm(true); };
  const handleSaveProduct = async () => {
    if (!formEan || !formName || !formPrice) { toast.error('Izpolnite vsa obvezna polja'); return; }
    const d = { ean: formEan.trim(), name: formName.trim(), price: parseFloat(formPrice), stock: parseInt(formStock) || 0, min_stock: parseInt(formMinStock) || 5, category: formCategory };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(d as any).eq('id', editingProduct.id as any);
      if (error) toast.error('Napaka'); else { toast.success('Posodobljeno'); resetProductForm(); }
    } else {
      const { error } = await supabase.from('products').insert(d as any);
      if (error) { if (error.code === '23505') toast.error('EAN že obstaja'); else toast.error('Napaka'); }
      else { toast.success('Dodano'); resetProductForm(); }
    }
  };
  const handleDeleteProduct = async (p: DBProduct) => { if (!confirm(`Izbrišete ${p.name}?`)) return; await supabase.from('products').delete().eq('id', p.id as any); toast.success('Izbrisano'); };

  const resetPartnerForm = () => { setPName(""); setPTax(""); setPAddress(""); setPCity(""); setPPostal(""); setPEmail(""); setPPhone(""); setPNotes(""); setPOwner(""); setPCountry("Slovenija"); setPVatId(""); setShowPartnerForm(false); setEditingPartner(null); };
  const handleEditPartner = (p: Partner) => { setEditingPartner(p); setPName(p.name); setPTax(p.tax_number); setPAddress(p.address); setPCity(p.city); setPPostal(p.postal_code); setPEmail(p.email); setPPhone(p.phone); setPNotes(p.notes); setShowPartnerForm(true); };
  const handleSavePartner = async () => {
    if (!pName || !pTax || !pAddress) { toast.error('Naziv, davčna in naslov so obvezni'); return; }
    const d = { name: pName.trim(), tax_number: pTax.trim(), address: pAddress.trim(), city: pCity.trim(), postal_code: pPostal.trim(), email: pEmail.trim(), phone: pPhone.trim(), notes: pNotes.trim() };
    if (editingPartner) {
      const { error } = await supabase.from('partners').update(d as any).eq('id', editingPartner.id as any);
      if (error) toast.error('Napaka'); else { toast.success('Posodobljeno'); resetPartnerForm(); }
    } else {
      const { error } = await supabase.from('partners').insert(d as any);
      if (error) toast.error('Napaka'); else { toast.success('Dodano'); resetPartnerForm(); }
    }
  };
  const handleDeletePartner = async (p: Partner) => { if (!confirm(`Izbrišete ${p.name}?`)) return; await supabase.from('partners').delete().eq('id', p.id as any); toast.success('Izbrisano'); };

  const handleAddToOrder = (p: DBProduct) => {
    const exists = orderItems.find(i => i.ean === p.ean);
    if (exists) setOrderItems(prev => prev.map(i => i.ean === p.ean ? { ...i, quantity: i.quantity + 1 } : i));
    else setOrderItems(prev => [...prev, { productId: p.id, ean: p.ean, name: p.name, quantity: 1 }]);
    toast.success(`${p.name} dodan`);
  };
  const handleSaveOrder = async () => {
    if (!orderSupplier || orderItems.length === 0) { toast.error('Vnesite dobavitelja in artikle'); return; }
    const orderData = {
      supplier: orderSupplier, date: orderDate, items: JSON.stringify(orderItems),
      status: 'Poslano', from_profile: role === 'shop' ? 'Trgovina' : 'Direktor',
      to_profile: role === 'shop' ? 'Direktor' : 'Trgovina', note: orderNote,
    };
    const { error } = await supabase.from('orders').insert(orderData as any);
    if (error) { toast.error('Napaka pri shranjevanju'); return; }
    setOrderItems([]); setOrderSupplier(""); setOrderNote(""); setOrderSubTab('list');
    toast.success('Naročilnica poslana');
  };

  const handleBackendLogin = () => {
    if ((backendUsername === 'StandBuyAdmin' && backendPassword === 'Admin12273') || (backendUsername === 'StandBuy.si' && backendPassword === 'TR122732207')) {
      setBackendLoggedIn(true); toast.success('Prijava uspešna');
    } else toast.error('Napačni podatki');
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee || !editingEmployee.firstName || !editingEmployee.lastName) { toast.error('Ime in priimek sta obvezna'); return; }
    const dbData = {
      first_name: editingEmployee.firstName, last_name: editingEmployee.lastName, code: editingEmployee.code,
      birth_date: editingEmployee.birthDate, birth_place: editingEmployee.birthPlace, position: editingEmployee.position,
      hire_date: editingEmployee.hireDate, username: editingEmployee.username, password: editingEmployee.password,
      address: editingEmployee.address, postal_code: editingEmployee.postalCode, city: editingEmployee.city,
      country: editingEmployee.country, phone: editingEmployee.phone, email: editingEmployee.email,
      emso: editingEmployee.emso, tax_number: editingEmployee.taxNumber, iban: editingEmployee.iban,
    };
    const existsInDb = employees.find(e => e.id === editingEmployee.id);
    if (existsInDb) {
      const { error } = await supabase.from('employees').update(dbData as any).eq('id', editingEmployee.id as any);
      if (error) { toast.error('Napaka'); return; }
      toast.success('Posodobljeno');
    } else {
      const { error } = await supabase.from('employees').insert(dbData as any);
      if (error) { toast.error('Napaka'); return; }
      toast.success('Dodano');
    }
    setEditingEmployee(null); setShowEmployeeForm(false);
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`Izbrišete ${emp.firstName} ${emp.lastName}?`)) return;
    await supabase.from('employees').delete().eq('id', emp.id as any);
    toast.success('Izbrisano');
  };

  const handleCreateLeave = async () => {
    if (!leaveEmployee || !leaveStart || !leaveEnd) { toast.error('Izpolnite vsa polja'); return; }
    const leaveData = {
      employee_name: leaveEmployee, type: leaveType, start_date: leaveStart,
      end_date: leaveEnd, approver: leaveApprover, description: leaveDesc, status: 'pending',
    };
    const { error } = await supabase.from('leave_requests').insert(leaveData as any);
    if (error) { toast.error('Napaka'); return; }
    setShowLeaveForm(false); setLeaveEmployee(""); setLeaveStart(""); setLeaveEnd(""); setLeaveDesc("");
    toast.success('Zahtevek ustvarjen');
  };

  const handleDeleteLeave = async (lr: LeaveRequest) => {
    if (!confirm('Izbrišete zahtevek?')) return;
    await supabase.from('leave_requests').delete().eq('id', lr.id as any);
    toast.success('Izbrisano');
  };

  const handleAddSchedule = async () => {
    if (!newEmployee) { toast.error('Izberite zaposlenega'); return; }
    const { error } = await supabase.from('schedules').insert({
      employee: newEmployee, day: newDay, start_time: newStart, end_time: newEnd,
    } as any);
    if (error) { toast.error('Napaka'); return; }
    toast.success('Dodano');
  };

  const handleDeleteSchedule = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id as any);
    toast.success('Izbrisano');
  };

  const handleOpenBusiness = async () => {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('business_days').upsert({ date: today, status: 'open', opened_at: new Date().toISOString(), opened_by: role } as any);
    setBusinessOpened(true);
    setShowOpenConfirm(false);
    toast.success('Poslovni dan odprt');
  };

  const handleCloseBusiness = async () => {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('business_days').update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: role } as any).eq('date', today as any);
    setBusinessOpened(false);
    setShowCloseConfirm(false);
    toast.success('Poslovni dan zaprt');
  };

  const handleZakljuciPromet = async () => {
    // Save closing report to DB
    const reportData = {
      type: 'Zaključek prometa',
      cashier_name: role === 'admin' ? 'Direktor' : 'Trgovina',
      cashier_id: role,
      total: closingReports.reduce((s, r) => s + r.total, 0),
      cash: closingReports.reduce((s, r) => s + r.cash, 0),
      card: closingReports.reduce((s, r) => s + r.card, 0),
      other: closingReports.reduce((s, r) => s + r.other, 0),
      transaction_count: closingReports.reduce((s, r) => s + r.transactionCount, 0),
      item_count: closingReports.reduce((s, r) => s + r.itemCount, 0),
    };
    await supabase.from('closing_reports').insert(reportData as any);
    setShowZakljuciConfirm(false);
    toast.success('Promet zaključen');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.ean.includes(searchQuery));
  const filteredOrderProducts = products.filter(p => { const q = orderSearch.toLowerCase(); if (!q) return true; return orderSearchType === 'ean' ? p.ean.includes(q) : p.name.toLowerCase().includes(q); });

  const menuItems: { id: Tab; label: string }[] = [
    { id: 'poslovanje', label: 'Poslovanje' },
    { id: 'artikli', label: 'Artikli' },
    { id: 'narocila', label: 'Naročila' },
    { id: 'dokumenti', label: 'Dokumenti' },
    { id: 'nalepke', label: 'Nalepke / Cenovke' },
    { id: 'urnik', label: 'Urnik' },
    { id: 'zakljucevanje', label: 'Zaključevanje' },
    { id: 'inventura', label: 'Inventura' },
    { id: 'financna', label: 'Finančna poročila' },
    { id: 'partnerji', label: 'Partnerji' },
    { id: 'avtorizacija', label: 'Avtorizacija' },
  ];

  // ===== TrgoBackEnd LOGIN =====
  if (showBackend && !backendLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        <div className="absolute top-8 left-12 w-6 h-8 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
        <div className="absolute top-20 right-20 w-10 h-14 rounded-full bg-gradient-to-b from-white/8 to-white/3 blur-sm" />
        <div className="absolute bottom-16 right-32 w-16 h-20 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-md" />

        <div className="w-[420px] rounded-2xl p-8 border border-gray-500/40" style={{ background: 'linear-gradient(180deg, #4a4a4a 0%, #2a2a2a 100%)' }}>
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-gray-700 border-2 border-gray-400 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="14" y="8" width="36" height="48" rx="3" />
                <rect x="22" y="4" width="20" height="8" rx="2" />
                <line x1="22" y1="24" x2="42" y2="24" />
                <line x1="22" y1="32" x2="42" y2="32" />
                <line x1="22" y1="40" x2="36" y2="40" />
                <circle cx="40" cy="46" r="6" />
                <circle cx="40" cy="44" r="2" />
                <path d="M36 50c0-2 1.5-3 4-3s4 1 4 3" />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-white font-bold text-lg mb-6">BackOffice - TrgoBackEnd</h2>

          <div className="space-y-3 mb-6">
            <input type="text" value={backendUsername} onChange={e => setBackendUsername(e.target.value)}
              placeholder="Uporabniško ime:"
              className="w-full h-10 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm rounded border border-gray-500" />
            <input type="password" value={backendPassword} onChange={e => setBackendPassword(e.target.value)}
              placeholder="Geslo:"
              className="w-full h-10 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm rounded border border-gray-500" />
          </div>

          <div className="flex justify-center mb-6">
            <button onClick={handleBackendLogin}
              className="px-10 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-base rounded-lg transition-colors">
              PRIJAVA
            </button>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-3xl font-black">
              <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
              <span className="text-orange-400 text-2xl ml-1">★</span>
            </h3>
          </div>

          <div className="flex justify-center">
            <button onClick={() => setShowBackend(false)}
              className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors">
              ◀ NAZAJ
            </button>
          </div>
        </div>

        <p className="absolute bottom-3 text-center text-xs text-gray-500 w-full">
          TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
        </p>
      </div>
    );
  }

  // ===== TrgoBackEnd MAIN =====
  if (showBackend && backendLoggedIn) {
    return (
      <div className="h-screen flex" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        <div className="absolute top-8 left-[260px] w-6 h-8 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
        <div className="absolute top-20 right-20 w-10 h-14 rounded-full bg-gradient-to-b from-white/8 to-white/3 blur-sm" />
        <div className="absolute bottom-16 right-32 w-16 h-20 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-md" />
        <div className="absolute bottom-32 left-[300px] w-4 h-5 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />

        <div className="w-[230px] flex flex-col shrink-0 z-10">
          <div className="bg-purple-600 text-white font-bold text-center py-3 text-lg">TrgoBackEnd</div>
          <div className="bg-gray-300 flex-1 flex flex-col">
            {(['zaposleni', 'zahtevki', 'pregled'] as const).map(tab => (
              <button key={tab} onClick={() => setBackendSubTab(tab)}
                className={`text-left px-4 py-2.5 text-sm font-medium border-b border-gray-400 transition-colors ${backendSubTab === tab ? 'bg-sky-400 text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                {tab === 'zaposleni' ? 'Zaposleni' : tab === 'zahtevki' ? 'Zahtevki za dopust' : 'Pregled dopustov'}
              </button>
            ))}
            <div className="flex-1" />
            <div className="p-3">
              <button onClick={() => { setBackendLoggedIn(false); setShowBackend(false); setBackendUsername(""); setBackendPassword(""); }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors">
                ODJAVA
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10">
          {/* ZAPOSLENI */}
          {backendSubTab === 'zaposleni' && (
            <div>
              <div className="bg-gray-600 px-6 py-3 flex items-center justify-between">
                <h2 className="text-white font-bold text-xl">Zaposleni</h2>
              </div>
              <div className="px-6 py-2 flex justify-end">
                <button onClick={() => { setEditingEmployee({ id: Date.now().toString(), firstName: '', lastName: '', code: '', birthDate: '', birthPlace: '', position: '', hireDate: new Date().toISOString().split('T')[0], username: '', password: '', address: '', postalCode: '', city: '', country: 'Slovenija', phone: '', email: '', emso: '', taxNumber: '', iban: '' }); setShowEmployeeForm(true); }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-sm transition-colors">
                  + Dodaj
                </button>
              </div>
              <div className="px-6">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold w-10">Št.</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Priimek</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Delovno mesto / status</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Uporabniško ime (šifra):</th>
                      <th className="border border-gray-400 px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }, (_, i) => {
                      const emp = employees[i];
                      return (
                        <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{i + 1}.</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{emp?.firstName || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{emp?.lastName || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{emp?.position || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{emp?.code || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {emp && <button onClick={() => { setEditingEmployee(emp); setShowEmployeeForm(true); }} className="text-gray-600 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showEmployeeForm && editingEmployee && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-200 rounded-2xl p-6 w-[780px] max-h-[90vh] overflow-y-auto border border-gray-400">
                    <h3 className="font-bold text-base mb-3 italic">Zaposleni:</h3>
                    <div className="flex gap-6">
                      <div className="flex-1 space-y-1">
                        {[
                          { label: 'Ime:', key: 'firstName' },
                          { label: 'Priimek:', key: 'lastName' },
                          { label: 'Delovno mesto:', key: 'position' },
                        ].map(f => (
                          <div key={f.key} className="flex border border-gray-400 bg-white">
                            <div className="w-32 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium shrink-0">{f.label}</div>
                            <input value={(editingEmployee as any)[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })}
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex border border-gray-400 bg-white">
                          <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Datum zaposlitve:</div>
                          <input type="date" value={editingEmployee.hireDate} onChange={e => setEditingEmployee({ ...editingEmployee, hireDate: e.target.value })} className="px-3 py-1.5 text-sm focus:outline-none w-36" />
                          <button className="px-2 text-gray-500 hover:text-gray-800"><Pencil className="w-4 h-4" /></button>
                        </div>
                        <div className="h-1" />
                        <div className="flex border border-gray-400 bg-white">
                          <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Datum rojstva:</div>
                          <input type="date" value={editingEmployee.birthDate} onChange={e => setEditingEmployee({ ...editingEmployee, birthDate: e.target.value })} className="px-3 py-1.5 text-sm focus:outline-none w-36" />
                          <button className="px-2 text-gray-500 hover:text-gray-800"><Pencil className="w-4 h-4" /></button>
                        </div>
                        <div className="flex border border-gray-400 bg-white">
                          <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Kraj rojstva:</div>
                          <input value={editingEmployee.birthPlace} onChange={e => setEditingEmployee({ ...editingEmployee, birthPlace: e.target.value })} className="px-3 py-1.5 text-sm focus:outline-none w-36" />
                          <button className="px-2 text-gray-500 hover:text-gray-800"><Pencil className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm mt-4 mb-1 italic">POS - podatki:</h4>
                    <div className="flex gap-6">
                      <div className="flex-1 space-y-1">
                        {[
                          { label: 'Uporabniško ime:', key: 'username' },
                          { label: 'Geslo:', key: 'password' },
                          { label: 'PIN blagajne:', key: 'code' },
                        ].map(f => (
                          <div key={f.key} className="flex border border-gray-400 bg-white">
                            <div className="w-32 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium shrink-0">{f.label}</div>
                            <input value={(editingEmployee as any)[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })}
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {[
                          { label: 'Telefon:', key: 'phone' },
                          { label: 'E-mail:', key: 'email' },
                          { label: 'EMŠO:', key: 'emso' },
                          { label: 'Davčna št.:', key: 'taxNumber' },
                          { label: 'IBAN:', key: 'iban' },
                        ].map(f => (
                          <div key={f.key} className="flex border border-gray-400 bg-white">
                            <div className="w-28 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                            <input value={(editingEmployee as any)[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })}
                              className="px-3 py-1.5 text-sm focus:outline-none w-36" />
                            <button className="px-2 text-gray-500 hover:text-gray-800"><Pencil className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm mt-4 mb-1 italic">Stalno bivališče:</h4>
                    <div className="space-y-1 max-w-md">
                      {[
                        { label: 'Naslov:', key: 'address' },
                        { label: 'Poštna št.:', key: 'postalCode' },
                        { label: 'Pošta:', key: 'city' },
                        { label: 'Država:', key: 'country' },
                      ].map(f => (
                        <div key={f.key} className="flex border border-gray-400 bg-white">
                          <div className="w-28 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                          <input value={(editingEmployee as any)[f.key]} onChange={e => setEditingEmployee({ ...editingEmployee, [f.key]: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          <button className="px-2 text-gray-500 hover:text-gray-800"><Pencil className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button onClick={handleSaveEmployee} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm transition-colors">Dodaj</button>
                      <button onClick={() => { setShowEmployeeForm(false); setEditingEmployee(null); }} className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm transition-colors">Prekliči</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ZAHTEVKI ZA DOPUST */}
          {backendSubTab === 'zahtevki' && (
            <div>
              <div className="bg-gray-600 px-6 py-3">
                <h2 className="text-white font-bold text-xl">Nov zahtevek za dopust</h2>
              </div>
              <div className="px-6 py-6">
                <div className="flex gap-6">
                  <div className="space-y-1 w-[280px]">
                    {['Zaposleni delavec:', 'Vrsta dopusta:', 'Začetni datum:', 'Končni datum:', 'Bo odobril:', 'Opis:'].map(label => (
                      <div key={label} className="border border-gray-500 bg-white px-4 py-2.5 text-sm font-medium">{label}</div>
                    ))}
                  </div>
                  <div className="flex-1 space-y-1">
                    <select value={leaveEmployee} onChange={e => setLeaveEmployee(e.target.value)}
                      className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm focus:outline-none">
                      <option value="">Izbira: delavci trgovine</option>
                      {employees.map(e => <option key={e.id} value={`${e.firstName} ${e.lastName}`}>{e.firstName} {e.lastName}</option>)}
                    </select>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
                      className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm focus:outline-none">
                      <option value="">Izbira: vrsta dopusta</option>
                      <option>Letni dopust</option><option>Izredni dopust</option><option>Bolniška</option>
                      <option>Neplačan dopust</option><option>Starševski dopust</option><option>Dopust zaradi osebnih okoliščin</option>
                      <option>Kompenzacija presežnih ur</option>
                    </select>
                    <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)}
                      className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm focus:outline-none" />
                    <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)}
                      className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm focus:outline-none" />
                    <div className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm text-gray-600">
                      Admin (Direktor: Dženan Kedić)
                    </div>
                    <textarea rows={4} value={leaveDesc} onChange={e => setLeaveDesc(e.target.value)}
                      className="w-full border border-gray-400 bg-gray-200 px-4 py-2.5 text-sm focus:outline-none resize-none" />
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <button onClick={handleCreateLeave}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors">
                    Ustvari zahtevek<br />za dopust
                  </button>
                  <button onClick={() => { setLeaveEmployee(""); setLeaveStart(""); setLeaveEnd(""); setLeaveDesc(""); }}
                    className="px-8 py-3 bg-purple-400 hover:bg-purple-500 text-white font-bold rounded-lg text-sm transition-colors">
                    Razveljavi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PREGLED DOPUSTOV */}
          {backendSubTab === 'pregled' && (
            <div>
              <div className="bg-gray-600 px-6 py-3">
                <h2 className="text-white font-bold text-xl">Pregled dopustov zaposlenih</h2>
              </div>
              <div className="px-6 py-4">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold w-10">Št.</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime in priimek</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum začetka / konca dopusta</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Vrsta dopusta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }, (_, i) => {
                      const lr = leaveRequests[i];
                      return (
                        <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{i + 1}.</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{lr?.employeeName || ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{lr ? `${lr.startDate} – ${lr.endDate}` : ''}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{lr?.type || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-8">
                  <table className="w-full border-collapse bg-blue-50 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">LD – letni dopust</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">DO – dopust zaradi osebnih okoliščin</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">PD – porodnički dopust</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">ID – izredni dopust</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">SD – starševski dopust</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">BO – bolniška odsotnost</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">ND – neplačan dopust</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">KU – kompenzacija ur</td>
                        <td className="border border-gray-300 px-3 py-1.5 font-medium">DR – drug razlog</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-3 right-4 z-0">
          <span className="text-2xl font-black">
            <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
            <span className="text-orange-400 text-xl ml-0.5">★</span>
          </span>
        </div>
      </div>
    );
  }

  // ===== MAIN BACKOFFICE =====
  return (
    <div className="h-screen flex relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
      {/* Water drops decoration */}
      <div className="absolute top-8 left-[260px] w-6 h-8 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
      <div className="absolute top-20 right-20 w-10 h-14 rounded-full bg-gradient-to-b from-white/8 to-white/3 blur-sm" />
      <div className="absolute bottom-16 right-32 w-16 h-20 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-md" />
      <div className="absolute bottom-32 left-[300px] w-4 h-5 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
      <div className="absolute top-1/3 right-10 w-20 h-28 rounded-full bg-gradient-to-b from-white/8 to-white/3 blur-md" />
      <div className="absolute bottom-20 left-1/2 w-8 h-10 rounded-full bg-gradient-to-b from-white/6 to-transparent blur-sm" />

      {/* Bottom right small logo */}
      <div className="absolute bottom-3 right-4 z-10">
        <span className="text-2xl font-black">
          <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
          <span className="text-orange-400 text-xl ml-0.5">★</span>
        </span>
      </div>

      {/* Sidebar */}
      <div className="w-[230px] flex flex-col shrink-0 z-10 relative">
        <div className="bg-gray-500 text-white font-bold text-center py-3 text-lg border-b border-gray-600">BackOffice</div>
        
        <div className="bg-gray-300 flex-1 flex flex-col">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`text-left px-4 py-2.5 text-sm font-medium border-b border-gray-400 transition-colors ${
                activeTab === item.id ? 'bg-sky-400 text-white' : 'text-gray-800 hover:bg-gray-200'
              }`}>
              {item.label}
            </button>
          ))}

          <div className="flex-1" />

          <div className="px-3 pb-2">
            <button onClick={() => setShowBackend(true)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm transition-colors">
              TrgoBackEnd
            </button>
          </div>

          <div className="px-3 pb-3">
            <button onClick={onLogout}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors">
              IZHOD
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto z-10 relative">

        {/* POSLOVANJE - matches Diapozitiv2-4 exactly */}
        {activeTab === 'poslovanje' && (
          <div className="relative h-full">
            {/* Title bar */}
            <div className="bg-gray-400/60 px-6 py-3 inline-block min-w-[500px]">
              <h2 className="text-white font-bold text-xl">Poslovanje</h2>
            </div>

            {/* OTVORITEV and ZAPIRANJE buttons */}
            <div className="flex gap-4 mt-6 ml-8">
              <button onClick={() => setShowOpenConfirm(true)}
                className={`px-12 py-5 font-bold text-xl rounded-xl transition-colors border-2 ${
                  businessOpened 
                    ? 'bg-gray-300 border-gray-400 text-gray-700' 
                    : 'bg-green-600 hover:bg-green-700 border-green-700 text-white'
                }`}
                style={!businessOpened ? {} : {}}>
                OTVORITEV
              </button>
              <button onClick={() => setShowCloseConfirm(true)}
                className={`px-12 py-5 font-bold text-xl rounded-xl transition-colors border-2 ${
                  !businessOpened
                    ? 'bg-gray-300 border-gray-400 text-gray-700'
                    : 'bg-red-600 hover:bg-red-700 border-red-700 text-white'
                }`}>
                ZAPIRANJE
              </button>
            </div>

            {/* Confirmation dialog for OTVORITEV */}
            {showOpenConfirm && (
              <div className="mt-6 ml-8 bg-white border-4 border-gray-800 rounded-lg p-8 max-w-[500px]">
                <p className="text-center text-lg mb-1">Ali ste prepričani, da želite</p>
                <p className="text-center text-lg mb-6"><span className="text-green-600 font-bold">OTVORITI</span> poslovni dan?</p>
                <div className="flex justify-center gap-6">
                  <button onClick={handleOpenBusiness} className="text-xl font-bold hover:underline">Da</button>
                  <span className="text-xl">/</span>
                  <button onClick={() => setShowOpenConfirm(false)} className="text-xl font-bold hover:underline">Ne</button>
                </div>
              </div>
            )}

            {/* Confirmation dialog for ZAPIRANJE */}
            {showCloseConfirm && (
              <div className="mt-6 ml-8 bg-white border-4 border-gray-800 rounded-lg p-8 max-w-[500px]">
                <p className="text-center text-lg mb-1">Ali ste prepričani, da želite</p>
                <p className="text-center text-lg mb-6"><span className="text-red-600 font-bold">ZAPRETI</span> poslovni dan?</p>
                <div className="flex justify-center gap-6">
                  <button onClick={handleCloseBusiness} className="text-xl font-bold hover:underline">Da</button>
                  <span className="text-xl">/</span>
                  <button onClick={() => setShowCloseConfirm(false)} className="text-xl font-bold hover:underline">Ne</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ARTIKLI */}
        {activeTab === 'artikli' && (
          <div>
            <div className="bg-gray-400/60 px-6 py-3 inline-block min-w-[500px]">
              <h2 className="text-white font-bold text-xl">Artikli</h2>
            </div>

            {/* Sub-tabs matching reference images */}
            <div className="flex gap-1 px-6 mt-3">
              {([
                { id: 'sifrant' as ArtikliSubTab, label: 'Šifrant artiklov' },
                { id: 'cene' as ArtikliSubTab, label: 'Cene artiklov' },
                { id: 'akcije' as ArtikliSubTab, label: 'Akcijske ponudbe' },
                { id: 'popusti' as ArtikliSubTab, label: 'Popusti / Znižanja' },
              ]).map(st => (
                <button key={st.id} onClick={() => setArtikliSubTab(st.id)}
                  className={`px-5 py-2 text-sm font-medium border border-gray-400 transition-colors ${
                    artikliSubTab === st.id ? 'bg-green-400 text-gray-900 font-bold' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}>
                  {st.label}
                </button>
              ))}
            </div>

            {/* Add button - top right - ADMIN ONLY */}
            {artikliSubTab === 'sifrant' && role === 'admin' && (
              <div className="flex justify-end px-6 mt-3">
                <button onClick={() => { resetProductForm(); setShowAddForm(true); }}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded text-sm">+ Dodaj</button>
              </div>
            )}
            {artikliSubTab === 'akcije' && role === 'admin' && (
              <div className="flex justify-end px-6 mt-3">
                <button onClick={() => { resetPromoForm(); setShowPromoForm(true); }}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded text-sm">+ Nova akcija</button>
              </div>
            )}

            <div className="px-6 py-3">
              {/* ŠIFRANT ARTIKLOV */}
              {artikliSubTab === 'sifrant' && (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Išči po imenu ali EAN..."
                      className="w-full h-9 pl-10 pr-4 bg-white rounded text-sm focus:outline-none border border-gray-400" />
                  </div>

                  {showAddForm && role === 'admin' && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-gray-200 rounded-xl p-6 w-[500px] border border-gray-400">
                        <div className="flex justify-end gap-2 mb-4">
                          <button onClick={handleSaveProduct} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">{editingProduct ? 'Posodobi' : 'Dodaj'}</button>
                          <button onClick={resetProductForm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm">Prekliči</button>
                        </div>
                        <div className="space-y-1">
                          {[
                            { label: 'EAN koda:', value: formEan, setter: setFormEan },
                            { label: 'Ime artikla:', value: formName, setter: setFormName },
                            { label: 'Cena (€):', value: formPrice, setter: setFormPrice },
                            { label: 'Zaloga:', value: formStock, setter: setFormStock },
                            { label: 'Min. zaloga:', value: formMinStock, setter: setFormMinStock },
                          ].map(f => (
                            <div key={f.label} className="flex border border-gray-400 bg-white">
                              <div className="w-32 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                              <input value={f.value} onChange={e => f.setter(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                            </div>
                          ))}
                          <div className="flex border border-gray-400 bg-white">
                            <div className="w-32 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Kategorija:</div>
                            <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none">
                              {categories.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold w-10">Št.</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Kategorija</th>
                        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Cena</th>
                        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Zaloga</th>
                        <th className="border border-gray-400 px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="text-center py-4 text-gray-500">Nalagam...</td></tr>
                      ) : filteredProducts.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-4 text-gray-500">Ni artiklov</td></tr>
                      ) : filteredProducts.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{i + 1}.</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{p.ean}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{p.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{p.category}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{p.price.toFixed(2)} €</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{p.stock}</td>
                          {role === 'admin' && (
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button onClick={() => handleEditStart(p)} className="text-gray-600 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>
                          </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* CENE ARTIKLOV */}
              {artikliSubTab === 'cene' && (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Išči po imenu ali EAN..."
                      className="w-full h-9 pl-10 pr-4 bg-white rounded text-sm focus:outline-none border border-gray-400" />
                  </div>
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime</th>
                        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Cena (€)</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Kategorija</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{p.ean}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{p.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{p.price.toFixed(2)} €</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{p.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* AKCIJSKE PONUDBE */}
              {artikliSubTab === 'akcije' && (
                <>
                  {/* Promo form dialog */}
                  {showPromoForm && role === 'admin' && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-gray-200 rounded-xl p-6 w-[520px] border border-gray-400">
                        <h3 className="font-bold text-lg mb-4">{editingPromo ? 'Uredi akcijo' : 'Nova akcija'}</h3>

                        {/* Type selector */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Tip akcije:</label>
                          <div className="flex gap-2">
                            {([
                              { id: 'akcijska_cena' as PromoType, label: 'Akcijska cena' },
                              { id: 'popust_percent' as PromoType, label: '% Popust' },
                              { id: 'kolicinska' as PromoType, label: 'Količinska akcija' },
                            ]).map(t => (
                              <button key={t.id} onClick={() => setPromoType(t.id)}
                                className={`flex-1 py-2 text-sm font-bold rounded border-2 transition-colors ${
                                  promoType === t.id ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                }`}>
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex border border-gray-400 bg-white">
                            <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Artikel (EAN):</div>
                            <input value={promoEan} onChange={e => handlePromoEanLookup(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" placeholder="Vnesite EAN kodo" />
                          </div>
                          {promoProductName && (
                            <div className="bg-green-50 border border-green-300 px-3 py-1.5 text-sm text-green-800 rounded">
                              ✓ {promoProductName}
                            </div>
                          )}
                          <div className="flex border border-gray-400 bg-white">
                            <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Datum od:</div>
                            <input type="date" value={promoStartDate} onChange={e => setPromoStartDate(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          </div>
                          <div className="flex border border-gray-400 bg-white">
                            <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Datum do:</div>
                            <input type="date" value={promoEndDate} onChange={e => setPromoEndDate(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          </div>

                          {/* Conditional fields based on promo type */}
                          {promoType === 'akcijska_cena' && (
                            <div className="flex border border-gray-400 bg-white">
                              <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Akcijska cena (€):</div>
                              <input value={promoPrice} onChange={e => setPromoPrice(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm focus:outline-none" placeholder="npr. 1.49" />
                            </div>
                          )}
                          {promoType === 'popust_percent' && (
                            <div className="flex border border-gray-400 bg-white">
                              <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Popust (%):</div>
                              <input value={promoDiscountPercent} onChange={e => setPromoDiscountPercent(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm focus:outline-none" placeholder="npr. 20" />
                            </div>
                          )}
                          {promoType === 'kolicinska' && (
                            <>
                              <div className="flex border border-gray-400 bg-white">
                                <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Kupi (kosov):</div>
                                <input value={promoQtyRequired} onChange={e => setPromoQtyRequired(e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-sm focus:outline-none" placeholder="npr. 3" />
                              </div>
                              <div className="flex border border-gray-400 bg-white">
                                <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Dobiš gratis:</div>
                                <input value={promoQtyFree} onChange={e => setPromoQtyFree(e.target.value)}
                                  className="flex-1 px-3 py-1.5 text-sm focus:outline-none" placeholder="npr. 1" />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <button onClick={handleSavePromo} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">
                            {editingPromo ? 'Posodobi' : 'Ustvari'}
                          </button>
                          <button onClick={resetPromoForm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm">Prekliči</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Promotions table */}
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Tip</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Artikel</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Od</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Do</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Pogoji</th>
                        <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Status</th>
                        <th className="border border-gray-400 px-3 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotions.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-4 text-gray-500">Ni akcij</td></tr>
                      ) : promotions.map((p, i) => {
                        const isExpired = new Date(p.end_date) < new Date();
                        const conditions = p.type === 'akcijska_cena' ? `${p.promo_price?.toFixed(2)} €`
                          : p.type === 'popust_percent' ? `${p.discount_percent}%`
                          : `Kupi ${p.qty_required}, dobiš ${p.qty_free} gratis`;
                        return (
                          <tr key={p.id} className={`${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} ${isExpired ? 'opacity-50' : ''}`}>
                            <td className="border border-gray-300 px-3 py-2 text-sm">{promoTypeLabel(p.type)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{p.product_name}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{p.product_ean}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">{p.start_date}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">{p.end_date}</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm font-bold">{conditions}</td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              {role === 'admin' ? (
                                <button onClick={() => handleTogglePromo(p)}
                                  className={`px-2 py-0.5 rounded text-xs font-bold ${p.active && !isExpired ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {isExpired ? 'Potekla' : p.active ? 'Aktivna' : 'Neaktivna'}
                                </button>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.active && !isExpired ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                  {isExpired ? 'Potekla' : p.active ? 'Aktivna' : 'Neaktivna'}
                                </span>
                              )}
                            </td>
                            {role === 'admin' && (
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleEditPromo(p)} className="text-gray-600 hover:text-gray-900"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDeletePromo(p)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}

              {/* POPUSTI / ZNIŽANJA - placeholder */}
              {artikliSubTab === 'popusti' && (
                <div className="text-gray-400 text-center py-12 text-lg">
                  Modul Popusti / Znižanja – v pripravi
                </div>
              )}
            </div>
          </div>
        )}

        {/* NAROČILA */}
        {activeTab === 'narocila' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3 flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">Naročila</h2>
              <div className="flex gap-2">
                <button onClick={() => setOrderSubTab('list')} className={`px-4 py-1.5 rounded text-sm font-medium ${orderSubTab === 'list' ? 'bg-white text-gray-800' : 'bg-gray-500 text-white'}`}>Seznam</button>
                <button onClick={() => setOrderSubTab('form')} className={`px-4 py-1.5 rounded text-sm font-medium ${orderSubTab === 'form' ? 'bg-white text-gray-800' : 'bg-gray-500 text-white'}`}>+ Naročilnica</button>
              </div>
            </div>
            <div className="px-6 py-4">
              {orderSubTab === 'list' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Dobavitelj</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Od</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Za</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Artiklov</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Status</th>
                  </tr></thead>
                  <tbody>
                    {savedOrders.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">Ni naročil</td></tr>
                    ) : savedOrders.map((o, i) => (
                      <tr key={o.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{o.date}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{o.supplier}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{o.fromProfile}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{o.toProfile}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">{o.items.length}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {orderSubTab === 'form' && (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex border border-gray-400 bg-white">
                        <div className="w-28 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Dobavitelj:</div>
                        <input value={orderSupplier} onChange={e => setOrderSupplier(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                      </div>
                      <div className="flex border border-gray-400 bg-white">
                        <div className="w-28 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">Datum:</div>
                        <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select value={orderSearchType} onChange={e => setOrderSearchType(e.target.value as any)} className="h-8 px-2 bg-white border border-gray-400 rounded text-sm">
                      <option value="name">Ime</option><option value="ean">EAN</option>
                    </select>
                    <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Iskanje artiklov..." className="flex-1 h-8 px-3 bg-white border border-gray-400 rounded text-sm focus:outline-none" />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full border-collapse bg-white text-sm">
                      <thead><tr className="bg-gray-200"><th className="border border-gray-400 px-2 py-1 text-left">EAN</th><th className="border border-gray-400 px-2 py-1 text-left">Artikel</th><th className="border border-gray-400 px-2 py-1 text-right">Zaloga</th><th className="border border-gray-400 px-2 py-1 w-16"></th></tr></thead>
                      <tbody>
                        {filteredOrderProducts.map(p => (
                          <tr key={p.id} className="hover:bg-gray-100">
                            <td className="border border-gray-300 px-2 py-1 font-mono text-xs">{p.ean}</td>
                            <td className="border border-gray-300 px-2 py-1">{p.name}</td>
                            <td className="border border-gray-300 px-2 py-1 text-right">{p.stock}</td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              <button onClick={() => handleAddToOrder(p)} className="px-2 py-0.5 bg-green-600 text-white rounded text-xs">+</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {orderItems.length > 0 && (
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Naročilnica:</h4>
                      <table className="w-full border-collapse bg-white text-sm">
                        <thead><tr className="bg-gray-200"><th className="border border-gray-400 px-2 py-1 text-left">Artikel</th><th className="border border-gray-400 px-2 py-1 text-right w-20">Kol.</th><th className="border border-gray-400 px-2 py-1 w-10"></th></tr></thead>
                        <tbody>
                          {orderItems.map((item, i) => (
                            <tr key={i}><td className="border border-gray-300 px-2 py-1">{item.name}</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">
                                <input type="number" min="1" value={item.quantity} onChange={e => setOrderItems(prev => prev.map((o, idx) => idx === i ? { ...o, quantity: parseInt(e.target.value) || 1 } : o))} className="w-16 h-6 px-1 text-right text-sm border rounded" />
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-center">
                                <button onClick={() => setOrderItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-600"><X className="w-3 h-3" /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleSaveOrder} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">Pošlji</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOKUMENTI */}
        {activeTab === 'dokumenti' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Dokumenti</h2></div>
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              {['Fakture', 'Dobropisi', 'Prevzemni listi', 'Naročilnice'].map(doc => (
                <div key={doc} className="bg-gray-200 border border-gray-400 rounded-lg p-6 cursor-pointer hover:bg-gray-300 transition-colors">
                  <h3 className="font-bold text-gray-800">{doc}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NALEPKE / CENOVKE */}
        {activeTab === 'nalepke' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3 flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">Nalepke / Cenovke</h2>
              <button onClick={() => {
                const selected = products.filter(p => selectedForLabel.includes(p.id));
                if (selected.length === 0) { toast.error('Izberite artikle'); return; }
                toast.success(`${selected.length} cenovk pripravljenih`);
              }} className="px-5 py-2 bg-purple-600 text-white font-bold rounded text-sm">Natisni ({selectedForLabel.length})</button>
            </div>
            <div className="px-6 py-4">
              <table className="w-full border-collapse bg-white">
                <thead><tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 w-10"></th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Artikel</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Cena</th>
                </tr></thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id} className={`cursor-pointer ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`} onClick={() => setSelectedForLabel(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center ${selectedForLabel.includes(p.id) ? 'bg-purple-600 border-purple-600' : 'border-gray-400'}`}>
                          {selectedForLabel.includes(p.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{p.ean}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{p.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">{p.price.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* URNIK */}
        {activeTab === 'urnik' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Urnik</h2></div>
            <div className="px-6 py-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setScheduleSubTab('hours')} className={`px-4 py-1.5 rounded text-sm font-medium ${scheduleSubTab === 'hours' ? 'bg-white text-gray-800' : 'bg-gray-500 text-white'}`}>Delovni čas</button>
                <button onClick={() => setScheduleSubTab('schedule')} className={`px-4 py-1.5 rounded text-sm font-medium ${scheduleSubTab === 'schedule' ? 'bg-white text-gray-800' : 'bg-gray-500 text-white'}`}>Urnik zaposlenih</button>
              </div>
              {scheduleSubTab === 'hours' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Zaposleni</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Vpisane ure</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Realizirane ure</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Razlika</th>
                  </tr></thead>
                  <tbody>
                    {knownEmployees.map((emp, i) => {
                      const h = schedules.filter(s => s.employee === emp).reduce((sum, s) => {
                        const st = parseInt(s.start.split(':')[0]) + parseInt(s.start.split(':')[1]) / 60;
                        const en = parseInt(s.end.split(':')[0]) + parseInt(s.end.split(':')[1]) / 60;
                        return sum + (en - st);
                      }, 0);
                      return (
                        <tr key={emp} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{emp}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{h.toFixed(1)}h</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{h.toFixed(1)}h</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">0h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {scheduleSubTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="flex gap-3 items-end bg-gray-200 p-4 rounded-lg">
                    <div>
                      <label className="text-xs font-medium block mb-1">Zaposleni</label>
                      <select value={newEmployee} onChange={e => setNewEmployee(e.target.value)} className="h-8 px-2 bg-white border border-gray-400 rounded text-sm">
                        <option value="">Izberi...</option>
                        {knownEmployees.map(e => <option key={e}>{e}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Dan</label>
                      <select value={newDay} onChange={e => setNewDay(e.target.value)} className="h-8 px-2 bg-white border border-gray-400 rounded text-sm">
                        {days.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Od</label>
                      <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="h-8 px-2 bg-white border border-gray-400 rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Do</label>
                      <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="h-8 px-2 bg-white border border-gray-400 rounded text-sm" />
                    </div>
                    <button onClick={handleAddSchedule} className="h-8 px-4 bg-green-600 text-white font-bold rounded text-sm">Dodaj</button>
                  </div>
                  <table className="w-full border-collapse bg-white">
                    <thead><tr className="bg-gray-200">
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Zaposleni</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Dan</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Od</th>
                      <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Do</th>
                      <th className="border border-gray-400 px-3 py-2 w-10"></th>
                    </tr></thead>
                    <tbody>
                      {schedules.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-4 text-gray-500">Ni vnosov</td></tr>
                      ) : schedules.map((s, i) => (
                        <tr key={s.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{s.employee}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{s.day}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{s.start}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{s.end}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <button onClick={() => handleDeleteSchedule(s.id)} className="text-red-600"><X className="w-3 h-3" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ZAKLJUČEVANJE - connected to DB register_closings */}
        {activeTab === 'zakljucevanje' && (
          <div className="relative h-full">
            <div className="bg-gray-400/60 px-6 py-3 inline-block min-w-[500px]">
              <h2 className="text-white font-bold text-xl">Zaključevanje blagajn</h2>
            </div>

            {/* Zaključi promet button - top right */}
            <div className="absolute top-4 right-6">
              <button onClick={() => setShowZakljuciConfirm(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-colors">
                Zaključi promet
              </button>
            </div>

            {showZakljuciConfirm && (
              <div className="mt-6 ml-8 bg-white border-4 border-gray-800 rounded-lg p-8 max-w-[500px]">
                <p className="text-center text-lg mb-6">Ali ste pripravljeni zaključiti?</p>
                <div className="flex justify-center gap-6">
                  <button onClick={handleZakljuciPromet} className="text-xl font-bold hover:underline">Da</button>
                  <span className="text-xl">/</span>
                  <button onClick={() => setShowZakljuciConfirm(false)} className="text-xl font-bold hover:underline">Ne</button>
                </div>
              </div>
            )}

            {/* Register closings from DB */}
            <div className="px-6 py-4">
              <RegisterClosingsTable />
            </div>
          </div>
        )}

        {/* INVENTURA */}
        {activeTab === 'inventura' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Inventura</h2></div>
            <div className="px-6 py-4">
              <table className="w-full border-collapse bg-white">
                <thead><tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Artikel</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Sistemska zaloga</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Prešteto</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Razlika</th>
                </tr></thead>
                <tbody>
                  {products.map((p, i) => <InventoryRow key={p.id} product={p} index={i} onUpdate={() => {}} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANČNA POROČILA */}
        {activeTab === 'financna' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Finančna poročila</h2></div>
            <div className="px-6 py-4">
              <div className="flex gap-2 mb-4">
                {(['statistics', 'sales', 'efficiency'] as const).map(tab => (
                  <button key={tab} onClick={() => setReportSubTab(tab)}
                    className={`px-4 py-1.5 rounded text-sm font-medium ${reportSubTab === tab ? 'bg-white text-gray-800' : 'bg-gray-500 text-white'}`}>
                    {tab === 'statistics' ? 'Statistika' : tab === 'sales' ? 'Pregled prodaje' : 'Učinkovitost prodajalcev'}
                  </button>
                ))}
              </div>
              {reportSubTab === 'statistics' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-200 border border-gray-400 rounded-lg p-6">
                    <h3 className="font-bold mb-3">Skupni promet</h3>
                    <p className="text-3xl font-bold">{closingReports.reduce((s, r) => s + r.total, 0).toFixed(2)} €</p>
                  </div>
                  <div className="bg-gray-200 border border-gray-400 rounded-lg p-6">
                    <h3 className="font-bold mb-3">Plačilna sredstva</h3>
                    <p className="text-sm">Gotovina: {closingReports.reduce((s, r) => s + r.cash, 0).toFixed(2)} €</p>
                    <p className="text-sm">Kartica: {closingReports.reduce((s, r) => s + r.card, 0).toFixed(2)} €</p>
                  </div>
                </div>
              )}
              {reportSubTab === 'sales' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajnik</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Gotovina</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Kartica</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Skupaj</th>
                  </tr></thead>
                  <tbody>
                    {closingReports.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-4 text-gray-500">Ni podatkov</td></tr>
                    ) : closingReports.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{r.date}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{r.cashier}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">{r.cash.toFixed(2)} €</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">{r.card.toFixed(2)} €</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{r.total.toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {reportSubTab === 'efficiency' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Prodajalec</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Št. transakcij</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Promet</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Povprečen račun</th>
                  </tr></thead>
                  <tbody>
                    {knownEmployees.map((emp, i) => {
                      const r = closingReports.filter(x => x.cashier === emp);
                      const total = r.reduce((s, x) => s + x.total, 0);
                      const tx = r.reduce((s, x) => s + x.transactionCount, 0);
                      return (
                        <tr key={emp} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{emp}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{tx}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{total.toFixed(2)} €</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{tx > 0 ? (total / tx).toFixed(2) : '0.00'} €</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PARTNERJI */}
        {activeTab === 'partnerji' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3 flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">Partnerji</h2>
              <button onClick={() => { resetPartnerForm(); setShowPartnerForm(true); }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-sm">+ Dodaj</button>
            </div>
            <div className="px-6 py-4">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold w-10">Št.</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Naziv in pravna oblika podjetja</th>
                    <th className="border border-gray-400 px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => {
                    const p = partners[i];
                    return (
                      <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{i + 1}.</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{p?.name || ''}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {p ? <button onClick={() => handleEditPartner(p)} className="text-gray-600 hover:text-gray-900"><Pencil className="w-4 h-4" /></button> : <Pencil className="w-4 h-4 text-gray-400" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showPartnerForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-200 rounded-xl p-6 w-[550px] border border-gray-400">
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={handleSavePartner} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">Dodaj</button>
                    <button onClick={resetPartnerForm} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm">Prekliči</button>
                  </div>

                  <h4 className="font-bold text-sm mb-2">PARTNER PODJETJE:</h4>
                  <div className="space-y-1 mb-4">
                    {[
                      { label: 'Naziv podjetja:', value: pName, setter: setPName },
                      { label: 'Naslov:', value: pAddress, setter: setPAddress },
                      { label: 'Poštna številka:', value: pPostal, setter: setPPostal },
                      { label: 'Kraj:', value: pCity, setter: setPCity },
                      { label: 'Država:', value: pCountry, setter: setPCountry },
                    ].map(f => (
                      <div key={f.label} className="flex border border-gray-400 bg-white">
                        <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                        <input value={f.value} onChange={e => f.setter(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                      </div>
                    ))}
                  </div>

                  <h4 className="font-bold text-sm mb-2">DAVČNI PODATKI:</h4>
                  <div className="space-y-1 mb-4">
                    {[
                      { label: 'ID za DDV:', value: pVatId, setter: setPVatId },
                      { label: 'Davčna številka:', value: pTax, setter: setPTax },
                    ].map(f => (
                      <div key={f.label} className="flex border border-gray-400 bg-white">
                        <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                        <input value={f.value} onChange={e => f.setter(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                      </div>
                    ))}
                  </div>

                  <h4 className="font-bold text-sm mb-2">KONTAKTI:</h4>
                  <div className="space-y-1">
                    {[
                      { label: 'Lastnik podjetja:', value: pOwner, setter: setPOwner },
                      { label: 'Telefon:', value: pPhone, setter: setPPhone },
                      { label: 'E-mail:', value: pEmail, setter: setPEmail },
                    ].map(f => (
                      <div key={f.label} className="flex border border-gray-400 bg-white">
                        <div className="w-36 px-3 py-1.5 bg-gray-100 border-r border-gray-400 text-sm font-medium">{f.label}</div>
                        <input value={f.value} onChange={e => f.setter(e.target.value)} className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AVTORIZACIJA */}
        {activeTab === 'avtorizacija' && (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Avtorizacija</h2></div>
            <div className="px-6 py-4">
              <div className="bg-gray-700/60 border border-gray-500 rounded-lg p-6 max-w-2xl text-gray-200">
                <p className="text-sm mb-6">
                  Ta funkcija omogoča generiranje enkratne administratorske kode za izvajanje varnostnih operacij v sistemu.
                </p>

                <h4 className="font-bold text-white text-sm mb-3">OPERACIJE, KI ZAHTEVAJO AVTORIZACIJO:</h4>
                <ul className="list-disc list-inside space-y-1 mb-6 text-sm ml-4">
                  <li>storniranje računa</li>
                  <li>vračilo artiklov</li>
                  <li>sprememba cene</li>
                </ul>

                <h4 className="font-bold text-white text-sm mb-2">VELJAVNOST KODE:</h4>
                <p className="text-sm mb-6">Administratorska koda velja 4 ure od generiranja.</p>

                <h4 className="font-bold text-white text-sm mb-3">AKCIJA:</h4>
                <div className="flex justify-center mb-6">
                  {authCode && authCountdown > 0 ? (
                    <div className="text-center space-y-3">
                      <div className="bg-gray-300 text-gray-900 px-8 py-4 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">ADMIN KODA</p>
                        <p className="font-mono text-4xl font-black tracking-[0.3em]">{authCode}</p>
                      </div>
                      <p className="text-sm text-gray-300">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatCountdown(authCountdown)} preostane
                      </p>
                      <button onClick={generateAuthCode} className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm">Nova koda</button>
                    </div>
                  ) : (
                    <button onClick={generateAuthCode}
                      className="px-8 py-4 bg-sky-200 hover:bg-sky-300 text-gray-800 font-bold rounded-lg text-sm transition-colors">
                      GENERIRAJ 5-mestno<br />ADMIN KODO
                    </button>
                  )}
                </div>

                <p className="text-sm">
                  <span className="font-bold text-white">STATUS: </span>
                  {authCode && authCountdown > 0 ? (
                    <span className="text-green-400 font-bold">AKTIVNA</span>
                  ) : (
                    <span className="text-red-400 font-bold">NEAKTIVNA</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const RegisterClosingsTable = () => {
  const [closings, setClosings] = useState<any[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('register_closings').select('*').order('closed_at', { ascending: false }).limit(50);
      if (data) setClosings(data as any[]);
    };
    fetch();
    const ch = supabase.channel('bo-reg-closings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'register_closings' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <table className="w-full border-collapse bg-white mt-4">
      <thead><tr className="bg-gray-200">
        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajna</th>
        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Tip</th>
        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajnik</th>
        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Gotovina</th>
        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Kartica</th>
        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Skupaj</th>
        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Računi</th>
      </tr></thead>
      <tbody>
        {closings.length === 0 ? (
          <tr><td colSpan={8} className="text-center py-4 text-gray-500">Ni zaključkov</td></tr>
        ) : closings.map((c, i) => (
          <tr key={c.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
            <td className="border border-gray-300 px-3 py-2 text-sm font-bold">Blagajna {c.register_id}</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{c.type}</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{c.cashier_name}</td>
            <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(c.closed_at).toLocaleString('sl-SI')}</td>
            <td className="border border-gray-300 px-3 py-2 text-sm text-right">{Number(c.cash).toFixed(2)} €</td>
            <td className="border border-gray-300 px-3 py-2 text-sm text-right">{Number(c.card).toFixed(2)} €</td>
            <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{Number(c.total).toFixed(2)} €</td>
            <td className="border border-gray-300 px-3 py-2 text-sm text-right">{c.transaction_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const InventoryRow = ({ product, index, onUpdate }: { product: DBProduct; index: number; onUpdate: (ean: string, counted: number) => void }) => {
  const [counted, setCounted] = useState(product.stock);
  const diff = counted - product.stock;
  return (
    <tr className={index % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
      <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{product.ean}</td>
      <td className="border border-gray-300 px-3 py-2 text-sm">{product.name}</td>
      <td className="border border-gray-300 px-3 py-2 text-sm text-right">{product.stock}</td>
      <td className="border border-gray-300 px-3 py-2 text-right">
        <input type="number" value={counted} onChange={e => setCounted(parseInt(e.target.value) || 0)}
          onBlur={() => onUpdate(product.ean, counted)} className="w-20 h-7 px-2 text-right text-sm border border-gray-400 rounded" />
      </td>
      <td className={`border border-gray-300 px-3 py-2 text-sm text-right font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
        {diff > 0 ? '+' : ''}{diff}
      </td>
    </tr>
  );
};

export default BackOfficeDashboard;
