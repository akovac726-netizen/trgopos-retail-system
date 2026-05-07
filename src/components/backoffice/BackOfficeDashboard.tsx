import { useState, useEffect } from "react";
import { Pencil, Plus, Search, X, Check, Trash2, Clock, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BoniKarticeModule from "./BoniKarticeModule";

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

export type BORole = 'admin' | 'shop' | 'oddelki' | 'skladisce' | 'nabava' | 'racunovodstvo';

interface BackOfficeDashboardProps {
  onLogout: () => void;
  closingReports?: ClosingReportData[];
  role: BORole;
}

type Tab =
  | 'poslovanje' | 'artikli' | 'narocila' | 'dokumenti' | 'nalepke' | 'urnik'
  | 'zakljucevanje' | 'inventura' | 'financna' | 'partnerji' | 'bonikartice'
  // Nove strani / moduli za dodatne profile
  | 'dashboard' | 'prodaja' | 'cenovke' | 'akcije_top' | 'porocila' | 'zaposleni_top'
  | 'prevzem' | 'zaloga' | 'dobavnice' | 'prenosi'
  | 'dobavitelji' | 'nabava' | 'analitika' | 'marze'
  | 'finance' | 'racuni' | 'ddv' | 'stroski' | 'export'
  | 'poslovalnice' | 'uporabniki' | 'nastavitve' | 'sistem';
type ArtikliSubTab = 'sifrant' | 'cene' | 'akcije' | 'popusti' | 'trgovina';
type BackendTab = 'zaposleni' | 'zahtevki' | 'pregled' | 'blagajne';
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
  const [backendSubTab, setBackendSubTab] = useState<BackendTab>('zaposleni');

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
  const [showOpenChecklist, setShowOpenChecklist] = useState(false);
  const [openChecklistItems, setOpenChecklistItems] = useState([
    { label: 'Preveri konec ponudbe', checked: false },
    { label: 'Prevzemi začetek ponudbe', checked: false },
    { label: 'Izvleček prodajnih cen', checked: false },
    { label: 'Natisni etikete', checked: false },
    { label: 'Izvleček sprememb', checked: false },
    { label: 'Širjenje blagajne', checked: false },
    { label: 'Posodobitev blagajne', checked: false },
  ]);
  const [showUpravljanje, setShowUpravljanje] = useState(false);

  // Zaključevanje
  const [showZakljuciConfirm, setShowZakljuciConfirm] = useState(false);

  // Checklist dialogs
  const [showIzvlecekCen, setShowIzvlecekCen] = useState(false);
  const [showNatisniEtikete, setShowNatisniEtikete] = useState(false);
  const [showIzvlecekSprememb, setShowIzvlecekSprememb] = useState(false);
  const [izvlecekSablona, setIzvlecekSablona] = useState<'kompaktna' | 'razsirjena' | 'interna'>('kompaktna');
  const [izvlecekVodniZig, setIzvlecekVodniZig] = useState(false);
  const [izvlecekLogotip, setIzvlecekLogotip] = useState(false);
  const [etiketaVelikost, setEtiketaVelikost] = useState<'58x40' | '70x36' | 'A4'>('58x40');
  const [etiketaKoda, setEtiketaKoda] = useState<'barcod' | 'qr'>('barcod');
  const [etiketaFilter, setEtiketaFilter] = useState<'sprememba' | 'vsi'>('sprememba');
  const [selectedEtiketaProducts, setSelectedEtiketaProducts] = useState<string[]>([]);
  const [spremembeDobavitelj, setSpremembeDobavitelj] = useState("");
  const [spremembeOd, setSpremembeOd] = useState("");
  const [spremembeDo, setSpremembeDo] = useState("");
  const [spremembeZig, setSpremembeZig] = useState<'brez' | 'osnutek' | 'potrjeno'>('brez');

  // Popusti
  const [popusti, setPopusti] = useState<any[]>([]);
  const [showPopustForm, setShowPopustForm] = useState(false);
  const [popustEan, setPopustEan] = useState("");
  const [popustProductName, setPopustProductName] = useState("");
  const [popustSkupinaArtiklov, setPopustSkupinaArtiklov] = useState("");
  const [popustSkupinaKupcev, setPopustSkupinaKupcev] = useState("");
  const [popustSkladisce, setPopustSkladisce] = useState("");
  const [popustVeljaOd, setPopustVeljaOd] = useState("");
  const [popustVeljaDo, setPopustVeljaDo] = useState("");
  const [popustPercent, setPopustPercent] = useState("");

  // Finančna poročila - filter by register type
  const [financeFilter, setFinanceFilter] = useState<'all' | 'regular' | 'self'>('all');
  const [financeClosings, setFinanceClosings] = useState<any[]>([]);

  // Artikli sub-tabs
  const [artikliSubTab, setArtikliSubTab] = useState<ArtikliSubTab>('sifrant');
  // Iskanje artiklov - TAB preklop med načini
  const [searchMode, setSearchMode] = useState<'name' | 'ean' | 'sifra'>('name');
  // Vizitka artikla
  const [viewProduct, setViewProduct] = useState<DBProduct | null>(null);
  // Trgovina-artikli vnos: določitev poslovalnice
  const [trgovinaPE, setTrgovinaPE] = useState('PE-01 (Trgovina IVO)');

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
  const [nalepkeSubTab, setNalepkeSubTab] = useState<'cenovke' | 'akcijske'>('cenovke');
  const [selectedForPromoLabel, setSelectedForPromoLabel] = useState<string[]>([]);

  const closingReports = externalReports;
  const categories = ['Higiena', 'Osebna nega', 'Pijače', 'Žvečilni gumi', 'Pisarniški material', 'Kartice', 'Ostalo'];
  const knownEmployees = employees.map(e => `${e.firstName} ${e.lastName}`);
  const days = ['ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota', 'nedelja'];

  useEffect(() => {
    fetchProducts(); fetchPartners(); fetchEmployees(); fetchLeaveRequests(); fetchOrders(); fetchSchedules(); fetchBusinessDay(); fetchClosingReportsFromDB(); fetchPromotions(); fetchFinanceClosings();
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'register_closings' }, fetchFinanceClosings)
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
  const fetchFinanceClosings = async () => {
    const { data } = await supabase.from('register_closings').select('*').order('closed_at', { ascending: false }).limit(100);
    if (data) setFinanceClosings(data as any[]);
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

  const generateAuthCode = async () => {
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    
    // Delete old codes first, then insert new one
    await supabase.from('auth_codes').delete().lt('expires_at', new Date().toISOString());
    const { error } = await supabase.from('auth_codes').insert({ code, expires_at: expiresAt });
    
    if (error) {
      toast.error('Napaka pri shranjevanju kode');
      return;
    }
    
    setAuthCode(code);
    setAuthCodeExpiry(Date.now() + 4 * 60 * 60 * 1000);
    setAuthCountdown(4 * 60 * 60);
    toast.success('Admin koda generirana – veljavna 4 ure, sinhronizirana na vse naprave');
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
    // Admin/Direktor credentials
    if ((backendUsername === 'SB-admin' && backendPassword === 'StB@71X!') || (backendUsername === 'BB.admin' && backendPassword === 'S!RQB!XX!')) {
      setBackendLoggedIn(true); toast.success('Prijava uspešna (Direktor)');
    }
    // Poslovodje login with their POS credentials (from employees table)
    else {
      const emp = employees.find(e => (e.username === backendUsername || e.code === backendUsername) && (e.password === backendPassword));
      if (emp) {
        setBackendLoggedIn(true); toast.success(`Prijava uspešna (${emp.firstName} ${emp.lastName})`);
      } else {
        toast.error('Napačni podatki');
      }
    }
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

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (searchMode === 'ean') return p.ean.includes(q);
    if (searchMode === 'sifra') return (p.id || '').toLowerCase().includes(q);
    return p.name.toLowerCase().includes(q);
  });
  const filteredOrderProducts = products.filter(p => { const q = orderSearch.toLowerCase(); if (!q) return true; return orderSearchType === 'ean' ? p.ean.includes(q) : p.name.toLowerCase().includes(q); });

  // Meniji glede na vlogo (profil)
  const allMenu: { id: Tab; label: string }[] = [
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
  ];
  const menuByRole: Record<BORole, Tab[]> = {
    admin: ['poslovanje','artikli','narocila','dokumenti','nalepke','urnik','zakljucevanje','inventura','financna','partnerji'],
    shop: ['poslovanje','artikli','narocila','nalepke','zakljucevanje','partnerji'],
    oddelki: ['poslovanje','narocila','dokumenti','urnik','financna','partnerji'],
    skladisce: ['narocila','dokumenti','inventura','partnerji'],
  };
  const menuItems = allMenu.filter(m => menuByRole[role].includes(m.id));
  // Avtomatsko prilagodi privzeti tab če trenutni ni dovoljen
  useEffect(() => {
    if (!menuByRole[role].includes(activeTab) && menuItems.length > 0) {
      setActiveTab(menuItems[0].id);
    }
  }, [role]);
  const roleLabel: Record<BORole, string> = {
    admin: 'Direktor (Admin)', shop: 'Trgovina',
    oddelki: 'Oddelki poslovanja', skladisce: 'Vodja skladišča',
  };
  const isAdmin = role === 'admin';

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
            {(['blagajne', 'zaposleni', 'zahtevki', 'pregled'] as const).map(tab => (
              <button key={tab} onClick={() => setBackendSubTab(tab)}
                className={`text-left px-4 py-2.5 text-sm font-medium border-b border-gray-400 transition-colors ${backendSubTab === tab ? 'bg-sky-400 text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                {tab === 'blagajne' ? 'Blagajne' : tab === 'zaposleni' ? 'Zaposleni' : tab === 'zahtevki' ? 'Zahtevki za dopust' : 'Pregled dopustov'}
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
          {/* BLAGAJNE (Avtorizacija) */}
          {backendSubTab === 'blagajne' && (
            <div>
              <div className="bg-gray-600 px-6 py-3">
                <h2 className="text-white font-bold text-xl">Blagajne – Avtorizacija</h2>
              </div>
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

      {/* Vizitka artikla */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewProduct(null)}>
          <div className="bg-white rounded-xl border-2 border-sky-500 w-[440px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-sky-500 text-white px-5 py-3 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-lg">Vizitka artikla</h3>
              <button onClick={() => setViewProduct(null)} className="text-white hover:text-gray-200"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-2">
              <div className="text-xl font-bold text-gray-900 mb-3">{viewProduct.name}</div>
              {[
                ['Šifra artikla', viewProduct.id.slice(0,8).toUpperCase()],
                ['EAN koda', viewProduct.ean],
                ['Cena', `${viewProduct.price.toFixed(2)} €`],
                ['Zaloga', `${viewProduct.stock} kos`],
                ['Min. zaloga', `${viewProduct.min_stock} kos`],
                ['Kategorija', viewProduct.category],
              ].map(([l,v]) => (
                <div key={l} className="flex border-b border-gray-200 py-1.5">
                  <div className="w-32 text-sm text-gray-500 font-medium">{l}:</div>
                  <div className="flex-1 text-sm font-bold text-gray-900">{v}</div>
                </div>
              ))}
              {role === 'admin' && (
                <div className="flex justify-end gap-2 pt-3">
                  <button onClick={() => { handleEditStart(viewProduct); setViewProduct(null); }}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded text-sm">Uredi</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        {/* Top bar: Uporabnik + Upravljanje */}
        <div className="flex items-center gap-4 px-2 py-1">
          <div className="border border-gray-500 bg-gray-200/80 px-3 py-1 text-sm text-gray-800 min-w-[180px]">
            Uporabnik: {roleLabel[role]}
          </div>
          <div className="relative">
            <button onClick={() => setShowUpravljanje(!showUpravljanje)}
              className="border border-gray-500 bg-gray-300/80 px-4 py-1 text-sm font-medium text-gray-800 hover:bg-gray-400/80 transition-colors">
              Upravljanje
            </button>
            {showUpravljanje && (
              <div className="absolute top-full left-0 mt-1 flex gap-1 z-50">
                <div className="bg-white border-2 border-gray-700 min-w-[200px]">
                  {[
                    { label: 'Nastavitve', action: () => { setActiveTab('poslovanje'); toast.success('Nastavitve odprte'); } },
                    { label: 'Upravljanje uporabnikov', action: () => { setShowBackend(true); } },
                    { label: 'Pregled dnevnika', action: () => setActiveTab('financna') },
                    { label: 'Polog denarja', action: () => setActiveTab('zakljucevanje') },
                  ].map(item => (
                    <button key={item.label} onClick={() => { setShowUpravljanje(false); item.action(); }}
                      className="block w-full text-left px-4 py-2 text-sm border-b border-gray-200 hover:bg-gray-100 transition-colors">
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="bg-white border-2 border-gray-700 min-w-[180px]">
                  {[
                    { label: 'Spremeni geslo', action: () => toast.success('Pošljite zahtevo administratorju za spremembo gesla') },
                    { label: 'Dodaj uporabnika', action: () => { setShowBackend(true); } },
                  ].map(item => (
                    <button key={item.label} onClick={() => { setShowUpravljanje(false); item.action(); }}
                      className="block w-full text-left px-4 py-2 text-sm border-b border-gray-200 hover:bg-gray-100 transition-colors">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">

        {/* POSLOVANJE */}
        {activeTab === 'poslovanje' && (
          <div className="relative h-full">
            {/* Poslovanje header bar */}
            <div className="bg-gray-400/60 px-6 py-3">
              <h2 className="text-white font-bold text-xl">Poslovanje</h2>
            </div>

            {/* OTVORITEV and ZAPIRANJE buttons */}
            <div className="flex gap-6 mt-6 ml-8">
              <button onClick={() => { if (!businessOpened) setShowOpenConfirm(true); }}
                className={`px-12 py-5 font-bold text-xl rounded-xl transition-colors border-2 ${
                  businessOpened
                    ? 'bg-gray-300 border-gray-400 text-gray-600 cursor-default'
                    : 'border-gray-600 text-white hover:brightness-110'
                }`}
                style={!businessOpened ? { background: 'linear-gradient(180deg, #8a9a4a, #6a7a3a)' } : {}}>
                OTVORITEV
              </button>
              <button onClick={() => { if (businessOpened) setShowCloseConfirm(true); }}
                className={`px-12 py-5 font-bold text-xl rounded-xl transition-colors border-2 ${
                  !businessOpened
                    ? 'bg-gray-300 border-gray-400 text-gray-600 cursor-default'
                    : 'border-gray-600 text-white hover:brightness-110'
                }`}
                style={businessOpened ? { background: 'linear-gradient(180deg, #c03030, #901818)' } : {}}>
                ZAPIRANJE
              </button>
            </div>

            {/* Confirmation dialog for OTVORITEV */}
            {showOpenConfirm && !showOpenChecklist && (
              <div className="mt-6 ml-8 bg-white border-4 border-gray-800 rounded-lg p-8 max-w-[500px]">
                <p className="text-center text-lg mb-1">Ali ste prepričani, da želite</p>
                <p className="text-center text-lg mb-6"><span className="text-green-600 font-bold">OTVORITI</span> poslovni dan?</p>
                <div className="flex justify-center gap-6">
                  <button onClick={() => {
                    handleOpenBusiness();
                    setShowOpenConfirm(false);
                    setShowOpenChecklist(true);
                    setOpenChecklistItems(prev => prev.map(i => ({ ...i, checked: false })));
                  }} className="text-xl font-bold hover:underline">Da</button>
                  <span className="text-xl">/</span>
                  <button onClick={() => setShowOpenConfirm(false)} className="text-xl font-bold hover:underline">Ne</button>
                </div>
              </div>
            )}

            {/* Otvoritev poslovanja checklist - Diapozitiv 6/7 */}
            {showOpenChecklist && (
              <div className="mt-6 ml-8 bg-white border-4 border-gray-800 max-w-[650px]">
                <div className="border-b-2 border-gray-800 px-4 py-3">
                  <h3 className="text-xl font-bold">Otvoritev poslovanja</h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-400">
                      <th className="px-4 py-2 text-left font-bold text-sm w-16 border-r border-gray-400">Št.</th>
                      <th className="px-4 py-2 text-left font-bold text-sm border-r border-gray-400">Funkcije</th>
                      <th className="px-4 py-2 text-center font-bold text-sm w-24">Izveden</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openChecklistItems.map((item, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-center font-medium border-r border-gray-300">{i + 1}.</td>
                        <td className="px-4 py-3 font-medium border-r border-gray-300">
                          {i === 2 ? (
                            <button onClick={() => setShowIzvlecekCen(true)} className="text-blue-600 hover:underline font-medium">{item.label}</button>
                          ) : i === 3 ? (
                            <button onClick={() => setShowNatisniEtikete(true)} className="text-blue-600 hover:underline font-medium">{item.label}</button>
                          ) : i === 4 ? (
                            <button onClick={() => setShowIzvlecekSprememb(true)} className="text-blue-600 hover:underline font-medium">{item.label}</button>
                          ) : item.label}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={item.checked}
                            onChange={() => setOpenChecklistItems(prev => prev.map((it, idx) => idx === i ? { ...it, checked: !it.checked } : it))}
                            className="w-5 h-5 cursor-pointer" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {openChecklistItems.every(i => i.checked) && (
                  <div className="p-3 flex justify-end">
                    <button onClick={() => setShowOpenChecklist(false)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">
                      Zaključi otvoritev
                    </button>
                  </div>
                )}
              </div>
            )}

              {/* ═══ IZVLEČEK PRODAJNIH CEN ═══ */}
              {showIzvlecekCen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg border-2 border-gray-600 w-[600px] max-h-[90vh] overflow-y-auto">
                    <div className="bg-sky-600 text-white px-6 py-3 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Izvleček prodajnih cen</h3>
                      <button onClick={() => setShowIzvlecekCen(false)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-600">Generiranje dokumenta s posodobljenimi prodajnimi cenami artiklov.</p>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Šablona:</label>
                        <div className="flex gap-2">
                          {(['kompaktna', 'razsirjena', 'interna'] as const).map(s => (
                            <button key={s} onClick={() => setIzvlecekSablona(s)}
                              className={`flex-1 py-2 text-sm rounded border-2 font-medium ${izvlecekSablona === s ? 'bg-sky-500 text-white border-sky-600' : 'bg-gray-100 border-gray-300'}`}>
                              {s === 'kompaktna' ? 'Kompaktna' : s === 'razsirjena' ? 'Razširjena' : 'Interna'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={izvlecekLogotip} onChange={e => setIzvlecekLogotip(e.target.checked)} className="w-4 h-4" />
                          Dodaj logotip podjetja
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={izvlecekVodniZig} onChange={e => setIzvlecekVodniZig(e.target.checked)} className="w-4 h-4" />
                          Vodni žig "OSNUTEK"
                        </label>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-bold text-sm mb-2">Predogled ({products.length} artiklov):</h4>
                        <div className="max-h-48 overflow-y-auto border border-gray-300 bg-gray-50 rounded">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-200 sticky top-0">
                              <tr>
                                <th className="px-2 py-1 text-left">EAN</th>
                                <th className="px-2 py-1 text-left">Naziv</th>
                                <th className="px-2 py-1 text-right">Cena</th>
                              </tr>
                            </thead>
                            <tbody>
                              {products.filter(p => p.category !== 'Trgovina').slice(0, 20).map(p => (
                                <tr key={p.id} className="border-b border-gray-200">
                                  <td className="px-2 py-1 font-mono">{p.ean}</td>
                                  <td className="px-2 py-1">{p.name}</td>
                                  <td className="px-2 py-1 text-right font-bold">{Number(p.price).toFixed(2)} €</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-gray-200 pt-4">
                        <button onClick={() => { toast.success('PDF generiran'); setShowIzvlecekCen(false); setOpenChecklistItems(prev => prev.map((it, idx) => idx === 2 ? { ...it, checked: true } : it)); }}
                          className="px-5 py-2 bg-red-600 text-white font-bold rounded text-sm">📄 PDF</button>
                        <button onClick={() => { toast.success('Excel izvožen'); }}
                          className="px-5 py-2 bg-green-600 text-white font-bold rounded text-sm">📊 Excel</button>
                        <button onClick={() => { toast.success('CSV izvožen'); }}
                          className="px-5 py-2 bg-blue-600 text-white font-bold rounded text-sm">📋 CSV</button>
                        <button onClick={() => {
                            const subject = encodeURIComponent('Izvleček prodajnih cen');
                            const body = encodeURIComponent('V prilogi pošiljam izvleček prodajnih cen.');
                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                            toast.success('Pripravljen e-mail');
                          }}
                          className="px-5 py-2 bg-purple-600 text-white font-bold rounded text-sm">✉ E-pošta</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ NATISNI ETIKETE ═══ */}
              {showNatisniEtikete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg border-2 border-gray-600 w-[650px] max-h-[90vh] overflow-y-auto">
                    <div className="bg-sky-600 text-white px-6 py-3 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Natisni etikete</h3>
                      <button onClick={() => setShowNatisniEtikete(false)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-bold">Velikost etikete:</label>
                          <div className="flex gap-2">
                            {(['58x40', '70x36', 'A4'] as const).map(v => (
                              <button key={v} onClick={() => setEtiketaVelikost(v)}
                                className={`flex-1 py-2 text-sm rounded border-2 font-medium ${etiketaVelikost === v ? 'bg-sky-500 text-white border-sky-600' : 'bg-gray-100 border-gray-300'}`}>
                                {v === 'A4' ? 'A4 list' : `${v} mm`}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-sm font-bold">Tip kode:</label>
                          <div className="flex gap-2">
                            <button onClick={() => setEtiketaKoda('barcod')}
                              className={`flex-1 py-2 text-sm rounded border-2 font-medium ${etiketaKoda === 'barcod' ? 'bg-sky-500 text-white border-sky-600' : 'bg-gray-100 border-gray-300'}`}>
                              Črtna koda
                            </button>
                            <button onClick={() => setEtiketaKoda('qr')}
                              className={`flex-1 py-2 text-sm rounded border-2 font-medium ${etiketaKoda === 'qr' ? 'bg-sky-500 text-white border-sky-600' : 'bg-gray-100 border-gray-300'}`}>
                              QR koda
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold">Filter artiklov:</label>
                        <div className="flex gap-2">
                          <button onClick={() => setEtiketaFilter('sprememba')}
                            className={`px-4 py-2 text-sm rounded border-2 font-medium ${etiketaFilter === 'sprememba' ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-100 border-gray-300'}`}>
                            S spremembo cene
                          </button>
                          <button onClick={() => setEtiketaFilter('vsi')}
                            className={`px-4 py-2 text-sm rounded border-2 font-medium ${etiketaFilter === 'vsi' ? 'bg-orange-500 text-white border-orange-600' : 'bg-gray-100 border-gray-300'}`}>
                            Vsi artikli
                          </button>
                        </div>
                      </div>

                      <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-200 sticky top-0">
                            <tr>
                              <th className="px-2 py-1 w-8"></th>
                              <th className="px-2 py-1 text-left">EAN</th>
                              <th className="px-2 py-1 text-left">Naziv</th>
                              <th className="px-2 py-1 text-right">Cena</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.filter(p => p.category !== 'Trgovina').map(p => (
                              <tr key={p.id} className="border-b border-gray-200 cursor-pointer hover:bg-sky-50"
                                onClick={() => setSelectedEtiketaProducts(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}>
                                <td className="px-2 py-1 text-center">
                                  <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center ${selectedEtiketaProducts.includes(p.id) ? 'bg-sky-600 border-sky-600' : 'border-gray-400'}`}>
                                    {selectedEtiketaProducts.includes(p.id) && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </td>
                                <td className="px-2 py-1 font-mono">{p.ean}</td>
                                <td className="px-2 py-1">{p.name}</td>
                                <td className="px-2 py-1 text-right font-bold">{Number(p.price).toFixed(2)} €</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Predogled etikete */}
                      <div className="border-2 border-dashed border-gray-400 rounded p-4 flex items-center justify-center bg-gray-50">
                        <div className="text-center border border-gray-800 px-6 py-3 bg-white" style={{ minWidth: etiketaVelikost === 'A4' ? '200px' : '140px' }}>
                          <div className="text-[10px] text-gray-500 mb-1">Predogled etikete ({etiketaVelikost})</div>
                          <div className="font-bold text-sm">Naziv artikla</div>
                          <div className="text-xs font-mono my-1">{etiketaKoda === 'barcod' ? '|||||||||||||||' : '▓▓▓▓'}</div>
                          <div className="font-black text-lg">0,00 €</div>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-gray-200 pt-4">
                        <button onClick={() => { 
                          if (selectedEtiketaProducts.length === 0) { toast.error('Izberite artikle'); return; }
                          toast.success(`${selectedEtiketaProducts.length} etiket pripravljenih za tisk`); 
                          setShowNatisniEtikete(false); 
                          setOpenChecklistItems(prev => prev.map((it, idx) => idx === 3 ? { ...it, checked: true } : it)); 
                        }}
                          className="px-5 py-2 bg-purple-600 text-white font-bold rounded text-sm">🖨 Natisni ({selectedEtiketaProducts.length})</button>
                        <button onClick={() => { toast.success('Etikete izvožene kot PNG'); }}
                          className="px-5 py-2 bg-blue-600 text-white font-bold rounded text-sm">📷 PNG</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ IZVLEČEK SPREMEMB ═══ */}
              {showIzvlecekSprememb && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg border-2 border-gray-600 w-[600px] max-h-[90vh] overflow-y-auto">
                    <div className="bg-sky-600 text-white px-6 py-3 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Izvleček sprememb</h3>
                      <button onClick={() => setShowIzvlecekSprememb(false)} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-600">Seznam vseh sprememb cen dobaviteljev z arhivom verzij.</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-bold">Dobavitelj:</label>
                          <input value={spremembeDobavitelj} onChange={e => setSpremembeDobavitelj(e.target.value)}
                            className="w-full h-9 px-3 border border-gray-400 rounded text-sm" placeholder="Vsi dobavitelji" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold">Vodni žig:</label>
                          <select value={spremembeZig} onChange={e => setSpremembeZig(e.target.value as any)}
                            className="w-full h-9 px-3 border border-gray-400 rounded text-sm">
                            <option value="brez">Brez</option>
                            <option value="osnutek">OSNUTEK</option>
                            <option value="potrjeno">POTRJENO</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold">Datum od:</label>
                          <input type="date" value={spremembeOd} onChange={e => setSpremembeOd(e.target.value)}
                            className="w-full h-9 px-3 border border-gray-400 rounded text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-bold">Datum do:</label>
                          <input type="date" value={spremembeDo} onChange={e => setSpremembeDo(e.target.value)}
                            className="w-full h-9 px-3 border border-gray-400 rounded text-sm" />
                        </div>
                      </div>

                      <div className="border border-gray-300 rounded bg-gray-50 p-3">
                        <h4 className="font-bold text-sm mb-2">Predogled sprememb:</h4>
                        <div className="text-xs text-gray-500 text-center py-6">
                          Ni zabeleženih sprememb cen za izbrano obdobje.
                          <br /><span className="text-[10px]">Spremembe se beležijo samodejno ob posodobitvi cen v šifrantu.</span>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end border-t border-gray-200 pt-4">
                        <button onClick={() => { toast.success('PDF sprememb generiran'); setShowIzvlecekSprememb(false); setOpenChecklistItems(prev => prev.map((it, idx) => idx === 4 ? { ...it, checked: true } : it)); }}
                          className="px-5 py-2 bg-red-600 text-white font-bold rounded text-sm">📄 PDF</button>
                        <button onClick={() => { toast.success('Excel izvožen'); }}
                          className="px-5 py-2 bg-green-600 text-white font-bold rounded text-sm">📊 Excel</button>
                      </div>
                    </div>
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
            <div className="bg-gray-400/60 px-6 py-3">
              <h2 className="text-white font-bold text-xl">Artikli</h2>
            </div>

            {/* Sub-tabs with + Dodaj at right - matches Diapozitiv 9 */}
            <div className="flex items-center gap-1 px-6 mt-3">
              {([
                { id: 'sifrant' as ArtikliSubTab, label: 'Šifrant artiklov' },
                { id: 'cene' as ArtikliSubTab, label: 'Cene artiklov' },
                { id: 'akcije' as ArtikliSubTab, label: 'Akcijske ponudbe' },
                { id: 'popusti' as ArtikliSubTab, label: 'Popusti / Znižanja' },
                { id: 'trgovina' as ArtikliSubTab, label: 'Trgovina: artikli' },
              ]).map(st => (
                <button key={st.id} onClick={() => setArtikliSubTab(st.id)}
                  className={`px-5 py-2 text-sm font-medium border border-gray-400 transition-colors ${
                    artikliSubTab === st.id
                      ? st.id === 'trgovina' ? 'bg-purple-400 text-white font-bold' : 'bg-green-400 text-gray-900 font-bold'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}>
                  {st.label}
                </button>
              ))}
              <div className="flex-1" />
              {role === 'admin' && (
                <button onClick={() => {
                  if (artikliSubTab === 'akcije') { resetPromoForm(); setShowPromoForm(true); }
                  else if (artikliSubTab === 'trgovina') { resetProductForm(); setFormCategory('Trgovina'); setShowAddForm(true); }
                  else { resetProductForm(); setShowAddForm(true); }
                }}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded text-sm">
                  + Dodaj
                </button>
              )}
            </div>

            <div className="px-6 py-3">
              {/* ŠIFRANT ARTIKLOV */}
              {artikliSubTab === 'sifrant' && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            setSearchMode(m => m === 'name' ? 'ean' : m === 'ean' ? 'sifra' : 'name');
                          }
                        }}
                        placeholder={`Išči po ${searchMode === 'name' ? 'IMENU' : searchMode === 'ean' ? 'EAN' : 'ŠIFRI'}... (TAB za preklop)`}
                        className="w-full h-9 pl-10 pr-4 bg-white rounded text-sm focus:outline-none border border-gray-400" />
                    </div>
                    <div className="flex border border-gray-400 rounded overflow-hidden text-xs">
                      {(['name','ean','sifra'] as const).map(m => (
                        <button key={m} onClick={() => setSearchMode(m)}
                          className={`px-3 py-1.5 font-bold ${searchMode === m ? 'bg-sky-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                          {m === 'name' ? 'IME' : m === 'ean' ? 'EAN' : 'ŠIFRA'}
                        </button>
                      ))}
                    </div>
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
                            <input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Vnesite kategorijo (prosto besedilo)"
                              className="flex-1 px-3 py-1.5 text-sm focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold w-10">Št.</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime</th>
                        <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Kategorija</th>
                        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Cena</th>
                        <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Zaloga</th>
                        {role === 'admin' && <th className="border border-gray-400 px-3 py-2 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-4 text-gray-500">Nalagam...</td></tr>
                      ) : filteredProducts.filter(p => p.category !== 'Trgovina').length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-4 text-gray-500">Ni artiklov</td></tr>
                      ) : filteredProducts.filter(p => p.category !== 'Trgovina').map((p, i) => (
                        <tr key={p.id} onClick={() => setViewProduct(p)}
                          className={`cursor-pointer ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-sky-50`}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{i + 1}.</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{p.name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{p.category}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{p.price.toFixed(2)} €</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{p.stock}</td>
                          {role === 'admin' && (
                          <td className="border border-gray-300 px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
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
                        {role === 'admin' && <th className="border border-gray-400 px-3 py-2 w-24"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {promotions.length === 0 ? (
                        <tr><td colSpan={role === 'admin' ? 8 : 7} className="text-center py-4 text-gray-500">Ni akcij</td></tr>
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

              {/* POPUSTI / ZNIŽANJA - Diapozitiv 13-15 */}
              {artikliSubTab === 'popusti' && (
                <>
                  {/* Popusti form dialog - Diapozitiv 14 */}
                  {showPopustForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-gray-100 border-2 border-sky-600 w-[520px]">
                        <div className="bg-sky-600 text-white px-4 py-2 flex justify-between items-center">
                          <span className="font-bold">Popusti artikla</span>
                          <div className="flex gap-1">
                            <button className="w-6 h-6 bg-white/20 rounded-full text-xs">?</button>
                            <button onClick={() => setShowPopustForm(false)} className="w-6 h-6 bg-red-500 rounded-full text-xs text-white">✕</button>
                          </div>
                        </div>
                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Šifra/Bar koda/Kat. št./Opis:</label>
                            <select className="flex-1 h-8 border border-gray-400 px-2 text-sm bg-white">
                              <option value="">—</option>
                              {products.map(p => <option key={p.id} value={p.ean}>{p.ean} – {p.name}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Skupina artiklov:</label>
                            <select value={popustSkupinaArtiklov} onChange={e => setPopustSkupinaArtiklov(e.target.value)}
                              className="flex-1 h-8 border border-gray-400 px-2 text-sm bg-white">
                              <option value="">—</option>
                              {categories.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Skupina kupcev:</label>
                            <select value={popustSkupinaKupcev} onChange={e => setPopustSkupinaKupcev(e.target.value)}
                              className="w-24 h-8 border border-gray-400 px-2 text-sm bg-white">
                              <option value="">—</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Skladišče:</label>
                            <select value={popustSkladisce} onChange={e => setPopustSkladisce(e.target.value)}
                              className="flex-1 h-8 border border-gray-400 px-2 text-sm bg-white">
                              <option value="">—</option>
                              <option>01 - PRIVZETO SKLADIŠČE</option>
                              <option>01 - DISTRIBUTERJI EVROPA</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Velja od:</label>
                            <input type="date" value={popustVeljaOd} onChange={e => setPopustVeljaOd(e.target.value)}
                              className="w-36 h-8 border border-gray-400 px-2 text-sm" />
                            <span className="text-red-500">*</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Velja do:</label>
                            <input type="date" value={popustVeljaDo} onChange={e => setPopustVeljaDo(e.target.value)}
                              className="w-36 h-8 border border-gray-400 px-2 text-sm" />
                            <span className="text-red-500">*</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="w-48 text-sm text-right">Popust %:</label>
                            <input type="text" value={popustPercent} onChange={e => setPopustPercent(e.target.value)}
                              className="w-20 h-8 border border-gray-400 px-2 text-sm text-right" placeholder="0" />
                            <span className="text-red-500">*</span>
                          </div>
                          <div className="flex justify-center gap-3 pt-4">
                            <button onClick={() => { 
                              if (!popustVeljaOd || !popustVeljaDo || !popustPercent) { toast.error('Izpolnite obvezna polja'); return; }
                              setPopusti(prev => [...prev, { id: Date.now().toString(), ean: popustEan, name: popustProductName || popustSkupinaArtiklov, skupina: popustSkupinaArtiklov, kupci: popustSkupinaKupcev, skladisce: popustSkladisce, veljaOd: popustVeljaOd, veljaDo: popustVeljaDo, percent: popustPercent }]);
                              setShowPopustForm(false); toast.success('Popust dodan');
                            }}
                              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded text-sm">V redu</button>
                            <button onClick={() => setShowPopustForm(false)}
                              className="px-6 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded text-sm">Prekliči</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Filter bar - Diapozitiv 13 */}
                  <div className="bg-gray-100 border border-gray-400 p-3 mb-3">
                    <h4 className="text-sm font-bold mb-2 text-red-700">Popusti in prodajne akcije - pregled</h4>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <label className="text-xs whitespace-nowrap">Šifra/Bar koda/Kat. št./Opis:</label>
                        <input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Skupina artiklov:</label>
                        <select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Skupina kupcev:</label>
                        <select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Skladišče:</label>
                        <select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Velja od:</label>
                        <input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Velja do:</label>
                        <input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs">Popust %:</label>
                        <input className="w-16 h-7 border border-gray-400 px-1 text-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-1">
                      <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">💾</button>
                      <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">📁</button>
                      <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">🗑 Odstrani</button>
                      <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">Več...</button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toast.success(`Najdeno: ${popusti.length} popustov`)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">Iskanje</button>
                      <button onClick={() => setShowPopustForm(true)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">Nov zapis</button>
                    </div>
                  </div>

                  {/* Popusti table */}
                  <table className="w-full border-collapse bg-white text-xs">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Šifra artikla</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Naziv artikla</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Skupina artiklov</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Skupina kupcev</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Skladišče</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Velja od</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Velja do</th>
                        <th className="border border-gray-400 px-2 py-1.5 text-right font-bold">Popust %</th>
                        <th className="border border-gray-400 px-2 py-1.5 w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {popusti.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-4 text-gray-400">Ni popustov</td></tr>
                      ) : popusti.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-2 py-1 font-mono">{p.ean || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.name || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.skupina || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.kupci || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.skladisce || '-'}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.veljaOd}</td>
                          <td className="border border-gray-300 px-2 py-1">{p.veljaDo}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right font-bold">{p.percent}</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            <input type="checkbox" className="w-3 h-3" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* TRGOVINA: ARTIKLI - internal store items (not shown on POS) */}
              {artikliSubTab === 'trgovina' && (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Išči artikle trgovine..."
                      className="w-full h-9 pl-10 pr-4 bg-white rounded text-sm focus:outline-none border border-gray-400" />
                  </div>
                  <div className="bg-purple-100 border border-purple-400 rounded p-3 mb-3 text-sm text-purple-800">
                    ℹ️ Artikli v tem oddelku so namenjeni <strong>interni uporabi poslovalnice</strong> (npr. pisarniški material, čistila). Ti artikli <strong>niso vidni na blagajni</strong>.
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-400 bg-gray-100">
                        <th className="text-left py-2 px-3 font-semibold">EAN</th>
                        <th className="text-left py-2 px-3 font-semibold">Naziv</th>
                        <th className="text-right py-2 px-3 font-semibold">Cena</th>
                        <th className="text-right py-2 px-3 font-semibold">Zaloga</th>
                        <th className="text-right py-2 px-3 font-semibold">Kategorija</th>
                        {role === 'admin' && <th className="text-center py-2 px-3 font-semibold w-20">Akcije</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {products.filter(p => p.category === 'Trgovina').filter(p =>
                        !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.ean.includes(searchQuery)
                      ).map(p => (
                        <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-xs">{p.ean}</td>
                          <td className="py-2 px-3">{p.name}</td>
                          <td className="py-2 px-3 text-right font-medium">{Number(p.price).toFixed(2)} €</td>
                          <td className="py-2 px-3 text-right">{p.stock}</td>
                          <td className="py-2 px-3 text-right text-purple-600 font-medium">{p.category}</td>
                          {role === 'admin' && (
                            <td className="py-2 px-3 text-center">
                              <button onClick={() => { setEditingProduct(p); setFormEan(p.ean); setFormName(p.name); setFormPrice(String(p.price)); setFormStock(String(p.stock)); setFormMinStock(String(p.min_stock)); setFormCategory(p.category); setShowAddForm(true); }}
                                className="text-blue-500 hover:text-blue-700 mr-2"><Pencil className="w-4 h-4 inline" /></button>
                              <button onClick={async () => { await supabase.from('products').delete().eq('id', p.id); fetchProducts(); toast.success('Artikel izbrisan'); }}
                                className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {products.filter(p => p.category === 'Trgovina').length === 0 && (
                        <tr><td colSpan={role === 'admin' ? 6 : 5} className="text-center py-8 text-gray-400">Ni artiklov trgovine</td></tr>
                      )}
                    </tbody>
                  </table>
                </>
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
        {activeTab === 'dokumenti' && <DokumentiModule role={role} />}

        {/* NALEPKE / CENOVKE */}
        {activeTab === 'nalepke' && (
          <div>
            <div className="bg-gray-400/60 px-6 py-3 inline-block min-w-[500px]">
              <h2 className="text-white font-bold text-xl">Nalepke / Cenovke</h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 px-6 mt-3">
              <button onClick={() => setNalepkeSubTab('cenovke')}
                className={`px-5 py-2 text-sm font-medium border border-gray-400 transition-colors ${
                  nalepkeSubTab === 'cenovke' ? 'bg-green-400 text-gray-900 font-bold' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}>
                Cenovke
              </button>
              <button onClick={() => setNalepkeSubTab('akcijske')}
                className={`px-5 py-2 text-sm font-medium border border-gray-400 transition-colors ${
                  nalepkeSubTab === 'akcijske' ? 'bg-green-400 text-gray-900 font-bold' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}>
                Akcijske cenovke
              </button>
            </div>

            <div className="px-6 py-4">
              {/* Standard CENOVKE */}
              {nalepkeSubTab === 'cenovke' && (
                <>
                  <div className="flex justify-end mb-3">
                    <button onClick={() => {
                      const selected = products.filter(p => selectedForLabel.includes(p.id));
                      if (selected.length === 0) { toast.error('Izberite artikle'); return; }
                      toast.success(`${selected.length} cenovk pripravljenih za tisk`);
                    }} className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded text-sm">
                      🖨 Natisni ({selectedForLabel.length})
                    </button>
                  </div>
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
                </>
              )}

              {/* AKCIJSKE CENOVKE */}
              {nalepkeSubTab === 'akcijske' && (() => {
                const activePromos = promotions.filter(p => p.active && new Date(p.end_date) >= new Date());
                return (
                  <>
                    <div className="flex justify-end mb-3">
                      <button onClick={() => {
                        const selected = activePromos.filter(p => selectedForPromoLabel.includes(p.id));
                        if (selected.length === 0) { toast.error('Izberite akcije za tisk'); return; }
                        toast.success(`${selected.length} akcijskih cenovk pripravljenih za tisk`);
                      }} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded text-sm">
                        🖨 Natisni akcijske ({selectedForPromoLabel.length})
                      </button>
                    </div>
                    {activePromos.length === 0 ? (
                      <div className="text-gray-400 text-center py-12 text-lg">Ni aktivnih akcij za tisk cenovk</div>
                    ) : (
                      <table className="w-full border-collapse bg-white">
                        <thead><tr className="bg-orange-100">
                          <th className="border border-gray-400 px-3 py-2 w-10"></th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Artikel</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Tip akcije</th>
                          <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Redna cena</th>
                          <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Akcijska cena</th>
                          <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Veljavnost</th>
                        </tr></thead>
                        <tbody>
                          {activePromos.map((promo, i) => {
                            const product = products.find(p => p.ean === promo.product_ean);
                            const regularPrice = product?.price || 0;
                            const promoDisplay = promo.type === 'akcijska_cena' ? `${promo.promo_price?.toFixed(2)} €`
                              : promo.type === 'popust_percent' ? `${(regularPrice * (1 - (promo.discount_percent || 0) / 100)).toFixed(2)} € (-${promo.discount_percent}%)`
                              : `Kupi ${promo.qty_required}, +${promo.qty_free} gratis`;
                            return (
                              <tr key={promo.id} className={`cursor-pointer ${i % 2 === 1 ? 'bg-orange-50' : 'bg-white'}`}
                                onClick={() => setSelectedForPromoLabel(prev => prev.includes(promo.id) ? prev.filter(id => id !== promo.id) : [...prev, promo.id])}>
                                <td className="border border-gray-300 px-3 py-2 text-center">
                                  <div className={`w-4 h-4 rounded border-2 mx-auto flex items-center justify-center ${selectedForPromoLabel.includes(promo.id) ? 'bg-orange-500 border-orange-600' : 'border-gray-400'}`}>
                                    {selectedForPromoLabel.includes(promo.id) && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{promo.product_name}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{promo.product_ean}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{promoTypeLabel(promo.type)}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-right line-through text-gray-400">{regularPrice.toFixed(2)} €</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold text-red-600">{promoDisplay}</td>
                                <td className="border border-gray-300 px-3 py-2 text-sm">{promo.start_date} – {promo.end_date}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </>
                );
              })()}
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
        {activeTab === 'financna' && (() => {
          const SC_IDS = [101, 102, 103];
          const regLabel = (id: number) => SC_IDS.includes(id) ? `🛒 A${id - 100}` : `Blagajna ${id}`;
          const fcFiltered = financeClosings.filter(c => {
            if (financeFilter === 'regular') return !SC_IDS.includes(c.register_id);
            if (financeFilter === 'self') return SC_IDS.includes(c.register_id);
            return true;
          });
          const totalReg = financeClosings.filter(c => !SC_IDS.includes(c.register_id)).reduce((s, c) => s + Number(c.total), 0);
          const totalSelf = financeClosings.filter(c => SC_IDS.includes(c.register_id)).reduce((s, c) => s + Number(c.total), 0);
          const fcTotalCash = fcFiltered.reduce((s, c) => s + Number(c.cash), 0);
          const fcTotalCard = fcFiltered.reduce((s, c) => s + Number(c.card), 0);
          const fcTotal = fcFiltered.reduce((s, c) => s + Number(c.total), 0);
          const fcTxCount = fcFiltered.reduce((s, c) => s + Number(c.transaction_count), 0);
          return (
          <div>
            <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Finančna poročila</h2></div>
            <div className="px-6 py-4">
              {/* Register type filter */}
              <div className="flex gap-2 mb-4">
                {([
                  { id: 'all' as const, label: 'Vse blagajne' },
                  { id: 'regular' as const, label: `Navadne (1–3) · ${totalReg.toFixed(2)} €` },
                  { id: 'self' as const, label: `🛒 Samoplačniške (A1–A3) · ${totalSelf.toFixed(2)} €` },
                ]).map(f => (
                  <button key={f.id} onClick={() => setFinanceFilter(f.id)}
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                      financeFilter === f.id ? (f.id === 'self' ? 'bg-orange-500 text-white' : 'bg-sky-500 text-white') : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sub-tabs */}
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
                    <p className="text-3xl font-bold">{fcTotal.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-1">{fcTxCount} transakcij</p>
                  </div>
                  <div className="bg-gray-200 border border-gray-400 rounded-lg p-6">
                    <h3 className="font-bold mb-3">Plačilna sredstva</h3>
                    <p className="text-sm">Gotovina: {fcTotalCash.toFixed(2)} €</p>
                    <p className="text-sm">Kartica: {fcTotalCard.toFixed(2)} €</p>
                  </div>
                </div>
              )}
              {reportSubTab === 'sales' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajna</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajnik</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Gotovina</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Kartica</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Skupaj</th>
                  </tr></thead>
                  <tbody>
                    {fcFiltered.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500">Ni podatkov</td></tr>
                    ) : fcFiltered.map((c: any, i: number) => (
                      <tr key={c.id} className={`${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} ${SC_IDS.includes(c.register_id) ? 'border-l-4 border-l-orange-400' : ''}`}>
                        <td className={`border border-gray-300 px-3 py-2 text-sm font-bold ${SC_IDS.includes(c.register_id) ? 'text-orange-600' : ''}`}>{regLabel(c.register_id)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(c.closed_at).toLocaleString('sl-SI')}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{c.cashier_name}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">{Number(c.cash).toFixed(2)} €</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right">{Number(c.card).toFixed(2)} €</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{Number(c.total).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {reportSubTab === 'efficiency' && (
                <table className="w-full border-collapse bg-white">
                  <thead><tr className="bg-gray-200">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Prodajalec / Blagajna</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Št. transakcij</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Promet</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Povprečen račun</th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const grouped: Record<string, { total: number; tx: number }> = {};
                      fcFiltered.forEach((c: any) => {
                        const key = c.cashier_name || 'Neznano';
                        if (!grouped[key]) grouped[key] = { total: 0, tx: 0 };
                        grouped[key].total += Number(c.total);
                        grouped[key].tx += Number(c.transaction_count);
                      });
                      return Object.entries(grouped).map(([name, data], i) => (
                        <tr key={name} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{name}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{data.tx}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{data.total.toFixed(2)} €</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-right">{data.tx > 0 ? (data.total / data.tx).toFixed(2) : '0.00'} €</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          );
        })()}

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

        {/* BONI IN KARTICE */}
        {activeTab === 'bonikartice' && <BoniKarticeModule />}

        </div>{/* end inner scrollable div */}
      </div>{/* end main content flex col */}
    </div>
  );
};

// ─── DOKUMENTI MODULE ───
type DocMainTab = 'prodajni' | 'nabavni' | 'skladiscni' | 'ostali';

const DokumentiModule = ({ role }: { role: BORole }) => {
  const [mainTab, setMainTab] = useState<DocMainTab>('prodajni');
  const [prodajniSub, setProdajniSub] = useState<string | null>(null);
  const [nabavniSub, setNabavniSub] = useState<string | null>(null);
  const [skladiscniSub, setSkladiscniSub] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase.from('transactions').select('*')
        .not('invoice_data', 'is', null)
        .order('created_at', { ascending: false }).limit(50);
      if (data) setInvoices(data);
    };
    const fetchReturns = async () => {
      const { data } = await supabase.from('transactions').select('*')
        .eq('voided', true)
        .order('created_at', { ascending: false }).limit(50);
      if (data) setReturns(data);
    };
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('*')
        .order('created_at', { ascending: false }).limit(50);
      if (data) setOrders(data);
    };
    fetchInvoices(); fetchReturns(); fetchOrders();
    const ch = supabase.channel('bo-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => { fetchInvoices(); fetchReturns(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const tabColors: Record<DocMainTab, string> = {
    prodajni: 'bg-orange-400 text-white font-bold',
    nabavni: 'bg-yellow-400 text-gray-900 font-bold',
    skladiscni: 'bg-yellow-400 text-gray-900 font-bold',
    ostali: 'bg-gray-200 text-gray-800',
  };

  return (
    <div>
      <div className="bg-gray-400/60 px-6 py-3">
        <h2 className="text-white font-bold text-xl">Dokumenti</h2>
      </div>
      {/* Main tabs - Diapozitiv 16 */}
      <div className="flex gap-1 px-6 mt-3">
        {([
          { id: 'prodajni' as DocMainTab, label: 'Prodajni dokumenti' },
          { id: 'nabavni' as DocMainTab, label: 'Nabavni dokumenti' },
          { id: 'skladiscni' as DocMainTab, label: 'Skladiščni dokumenti' },
          { id: 'ostali' as DocMainTab, label: 'Ostali dokumenti' },
        ]).map(t => (
          <button key={t.id} onClick={() => { setMainTab(t.id); setProdajniSub(null); setNabavniSub(null); setSkladiscniSub(null); }}
            className={`px-5 py-2 text-sm font-medium border border-gray-400 transition-colors ${
              mainTab === t.id ? tabColors[t.id] : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        {/* PRODAJNI DOKUMENTI - Diapozitiv 17 */}
        {mainTab === 'prodajni' && !prodajniSub && (
          <div className="bg-gray-200 border border-gray-400 w-[280px] mt-4">
            {['', '', 'Dobropisi – lastna raba', '', ''].map((label, i) => (
              <button key={i} onClick={() => { if (label) setProdajniSub(label); }}
                className="block w-full text-left px-4 py-2.5 text-sm border-b border-gray-400 hover:bg-gray-300 transition-colors">
                {label || '\u00A0'}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'prodajni' && prodajniSub === 'Dobropisi – lastna raba' && (
          <div>
            <button onClick={() => setProdajniSub(null)} className="text-sm text-blue-600 hover:underline mb-3">◀ Nazaj</button>
            <table className="w-full border-collapse bg-white">
              <thead><tr className="bg-gray-200">
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Št. računa</th>
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Blagajnik</th>
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Razlog</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Znesek</th>
              </tr></thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-gray-500">Ni dobropisov</td></tr>
                ) : returns.map((ret: any, i: number) => (
                  <tr key={ret.id} className={`${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} text-red-700`}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono font-bold">{ret.receipt_number}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(ret.created_at).toLocaleString('sl-SI')}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{ret.cashier_name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{ret.void_reason || 'Storno'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">-{Number(ret.total).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NABAVNI DOKUMENTI - Diapozitiv 18/19/20 */}
        {mainTab === 'nabavni' && !nabavniSub && (
          <div className="bg-gray-200 border border-gray-400 w-[320px] mt-4">
            {['Naročilnice za skladišče', 'Prevzemnice', 'Dobavnice od skladišča', 'Reklamacije dobaviteljem'].map(label => (
              <button key={label} onClick={() => setNabavniSub(label)}
                className="block w-full text-left px-4 py-2.5 text-sm border-b border-gray-400 hover:bg-gray-300 transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'nabavni' && nabavniSub === 'Prevzemnice' && (
          <div>
            <button onClick={() => setNabavniSub(null)} className="text-sm text-blue-600 hover:underline mb-3">◀ Nazaj</button>
            <div className="bg-gray-100 border border-gray-400 p-3 mb-3">
              <h4 className="text-sm font-bold mb-2 text-red-700">Izdane dobavnice - pregled in iskanje</h4>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="flex items-center gap-1"><label className="text-xs whitespace-nowrap">Št. dobavnice:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Kupec:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Str.m.:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Skladišče:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select></div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="flex items-center gap-1"><label className="text-xs">Išči po:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>datum dokumenta</option></select></div>
                <div className="flex items-center gap-1"><label className="text-xs">od dne:</label><input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">do dne:</label><input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Status:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1"><label className="text-xs">Šifra/Bar koda/Opis:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Serijska št.:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">LOT št.:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">💾</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">📁</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">🖨 Tiskanje</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">Več...</button>
              </div>
              <div className="flex gap-1">
                <button className="px-3 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">Iskanje</button>
                <button className="px-3 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">Izdelava nove dobavnice</button>
              </div>
            </div>
            {/* Table - Diapozitiv 19 */}
            <table className="w-full border-collapse bg-white text-xs">
              <thead><tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Št. dobavnice</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Dat.dok</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Dat.dob</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Skladišče</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Kupec</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Opombe</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Za plačilo</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Stroškovno mesto</th>
              </tr></thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-gray-400">Ni dokumentov</td></tr>
                ) : invoices.slice(0, 7).map((inv: any, i: number) => {
                  const invData = inv.invoice_data || {};
                  return (
                    <tr key={inv.id} className={i % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-2 py-1 font-mono text-blue-700">{inv.receipt_number}</td>
                      <td className="border border-gray-300 px-2 py-1">{new Date(inv.created_at).toLocaleDateString('sl-SI')}</td>
                      <td className="border border-gray-300 px-2 py-1">{new Date(inv.created_at).toLocaleDateString('sl-SI')}</td>
                      <td className="border border-gray-300 px-2 py-1">0000</td>
                      <td className="border border-gray-300 px-2 py-1">{invData.name || invData.company || '-'}</td>
                      <td className="border border-gray-300 px-2 py-1">{invData.taxNumber ? 'TEST' : '-'}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">€ {Number(inv.total).toFixed(2)}</td>
                      <td className="border border-gray-300 px-2 py-1">{'-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {mainTab === 'nabavni' && nabavniSub && nabavniSub !== 'Prevzemnice' && (
          <div>
            <button onClick={() => setNabavniSub(null)} className="text-sm text-blue-600 hover:underline mb-3">◀ Nazaj</button>
            <div className="bg-gray-100 border border-gray-400 p-3 mb-3">
              <h4 className="text-sm font-bold mb-2 text-red-700">{nabavniSub} – pregled</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-1"><label className="text-xs">Št. dok.:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Datum od:</label><input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">do:</label><input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
              </div>
            </div>
            <table className="w-full border-collapse bg-white text-xs">
              <thead><tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Št. dok.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Datum</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Dobavitelj</th>
                <th className="border border-gray-400 px-2 py-1.5 text-right font-bold">Znesek</th>
              </tr></thead>
              <tbody><tr><td colSpan={4} className="text-center py-4 text-gray-500">Ni dokumentov</td></tr></tbody>
            </table>
          </div>
        )}

        {/* SKLADIŠČNI DOKUMENTI - Diapozitiv 21/22 */}
        {mainTab === 'skladiscni' && !skladiscniSub && (
          <div className="bg-gray-200 border border-gray-400 w-[280px] mt-4">
            {['', 'Popis zaloge', 'Odpis blaga'].map((label, i) => (
              <button key={i} onClick={() => { if (label) setSkladiscniSub(label); }}
                className="block w-full text-left px-4 py-2.5 text-sm border-b border-gray-400 hover:bg-gray-300 transition-colors">
                {label || '\u00A0'}
              </button>
            ))}
          </div>
        )}
        {mainTab === 'skladiscni' && skladiscniSub === 'Popis zaloge' && (
          <div>
            <button onClick={() => setSkladiscniSub(null)} className="text-sm text-blue-600 hover:underline mb-3">◀ Nazaj</button>
            {/* Diapozitiv 22 - Popis zalog */}
            <div className="bg-gray-100 border border-gray-400 p-3 mb-3">
              <h4 className="text-sm font-bold mb-2 text-red-700">Popisi zalog - pregled in iskanje</h4>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="flex items-center gap-1"><label className="text-xs">Št. dok.:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Dat.dok. od:</label><input type="date" defaultValue="2025-01-01" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">do:</label><input type="date" className="flex-1 h-7 border border-gray-400 px-1 text-xs" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Status:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1"><label className="text-xs">Opis:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs">Skladišče:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select>
                  <label className="text-xs ml-2">Šifra/Bar koda/Kat. št./Opis:</label><select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white"><option>—</option></select>
                </div>
              </div>
            </div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1">
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">💾</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">📁</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">🖨 Tiskanje</button>
                <button className="px-2 py-1 bg-gray-200 border border-gray-400 text-xs hover:bg-gray-300">Več...</button>
              </div>
              <div className="flex gap-1">
                <button className="px-3 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">Iskanje</button>
                <button className="px-3 py-1 bg-gray-300 text-gray-800 text-xs font-bold border border-gray-400">Novi popis zalog</button>
              </div>
            </div>
            {/* Table */}
            <table className="w-full border-collapse bg-white text-xs">
              <thead><tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold w-8">#</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Št. dok.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Skladišče</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Dat.dok.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Opis</th>
                <th className="border border-gray-400 px-2 py-1.5 w-16"></th>
              </tr></thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border border-gray-300 px-2 py-1">1.</td>
                  <td className="border border-gray-300 px-2 py-1 text-blue-700">(osnutek) 0000</td>
                  <td className="border border-gray-300 px-2 py-1"></td>
                  <td className="border border-gray-300 px-2 py-1">{new Date().toLocaleDateString('sl-SI')}</td>
                  <td className="border border-gray-300 px-2 py-1"></td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <span className="cursor-pointer mr-2">🖨</span><span className="cursor-pointer text-red-500">🗑</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {mainTab === 'skladiscni' && skladiscniSub === 'Odpis blaga' && (
          <div>
            <button onClick={() => setSkladiscniSub(null)} className="text-sm text-blue-600 hover:underline mb-3">◀ Nazaj</button>
            <div className="bg-gray-100 border border-gray-400 p-3 mb-3">
              <h4 className="text-sm font-bold mb-2 text-red-700">Odpis blaga - novi vnos</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1"><label className="text-xs w-24">EAN/Šifra:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" placeholder="EAN ali šifra" /></div>
                <div className="flex items-center gap-1"><label className="text-xs w-24">Naziv:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs w-24">Količina:</label><input type="number" className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs w-24">Razlog:</label>
                  <select className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white">
                    <option>Pokvarjeno</option><option>Poteklo</option><option>Razbito</option><option>Krađa</option><option>Drugo</option>
                  </select>
                </div>
                <div className="flex items-center gap-1"><label className="text-xs w-24">Zaposleni:</label><input className="flex-1 h-7 border border-gray-400 px-2 text-xs bg-white" /></div>
                <div className="flex items-center gap-1"><label className="text-xs w-24">Datum:</label><input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="flex-1 h-7 border border-gray-400 px-1 text-xs bg-white" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => toast.success('Odpis shranjen')} className="px-4 py-1 bg-green-500 text-white text-xs font-bold border border-green-600">💾 Shrani</button>
                <button className="px-4 py-1 bg-gray-300 text-gray-800 text-xs font-bold border border-gray-400">Prekliči</button>
              </div>
            </div>
            <table className="w-full border-collapse bg-white text-xs">
              <thead><tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Datum</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Artikel</th>
                <th className="border border-gray-400 px-2 py-1.5 text-right font-bold">Količina</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Razlog</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Zaposleni</th>
              </tr></thead>
              <tbody><tr><td colSpan={5} className="text-center py-4 text-gray-500">Ni odpisov</td></tr></tbody>
            </table>
          </div>
        )}

        {/* OSTALI DOKUMENTI */}
        {mainTab === 'ostali' && (
          <div className="bg-gray-200 border border-gray-400 w-[280px] mt-4">
            {['Interni dokumenti', 'Izpis cenika artiklov', 'Popis evidenc', 'Servisni nalog'].map(label => (
              <button key={label} onClick={() => toast.success(`${label} odprt`)}
                className="block w-full text-left px-4 py-2.5 text-sm border-b border-gray-400 hover:bg-gray-300 transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SELF_CHECKOUT_IDS = [101, 102, 103];
const registerLabel = (id: number) => {
  if (SELF_CHECKOUT_IDS.includes(id)) return `🛒 A${id - 100}`;
  return `Blagajna ${id}`;
};

const RegisterClosingsTable = () => {
  const [closings, setClosings] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'regular' | 'self'>('all');
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

  const filtered = closings.filter(c => {
    if (filter === 'regular') return !SELF_CHECKOUT_IDS.includes(c.register_id);
    if (filter === 'self') return SELF_CHECKOUT_IDS.includes(c.register_id);
    return true;
  });

  const totalRegular = closings.filter(c => !SELF_CHECKOUT_IDS.includes(c.register_id)).reduce((s, c) => s + Number(c.total), 0);
  const totalSelf = closings.filter(c => SELF_CHECKOUT_IDS.includes(c.register_id)).reduce((s, c) => s + Number(c.total), 0);

  return (
    <div>
      <div className="flex gap-2 mb-3 items-center">
        {([
          { id: 'all', label: 'Vse blagajne' },
          { id: 'regular', label: `Navadne (1–3) · ${totalRegular.toFixed(2)} €` },
          { id: 'self', label: `🛒 Samoplačniške (A1–A3) · ${totalSelf.toFixed(2)} €` },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === f.id ? (f.id === 'self' ? 'bg-orange-500 text-white' : 'bg-sky-500 text-white') : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>
      <table className="w-full border-collapse bg-white">
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
          {filtered.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-4 text-gray-500">Ni zaključkov</td></tr>
          ) : filtered.map((c, i) => (
            <tr key={c.id} className={`${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'} ${SELF_CHECKOUT_IDS.includes(c.register_id) ? 'border-l-4 border-l-orange-400' : ''}`}>
              <td className={`border border-gray-300 px-3 py-2 text-sm font-bold ${SELF_CHECKOUT_IDS.includes(c.register_id) ? 'text-orange-600' : ''}`}>{registerLabel(c.register_id)}</td>
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
    </div>
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
