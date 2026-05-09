import { useEffect, useState } from "react";
import { Plus, Save, Printer, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DBProduct { id: string; ean: string; name: string; price: number; stock: number; sku?: string; }
interface InventuraItem { artikel: string; ean: string; kolicina: number; vrednost: number; }
interface InventuraDoc {
  id: string; document_number: string; inventory_number: string; warehouse: string; department: string;
  status: string; date_inventure: string; responsible_person: string; referent: string;
  items: InventuraItem[]; total: number; notes: string; created_at: string;
}

const InventuraModule = ({ role, products }: { role: string; products: DBProduct[] }) => {
  const [subTab, setSubTab] = useState<'seznam' | 'nova'>('seznam');
  const [docs, setDocs] = useState<InventuraDoc[]>([]);
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState("Vse");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showNewLocationDialog, setShowNewLocationDialog] = useState(false);
  const [selectedPE, setSelectedPE] = useState("");

  // Nova inventura form
  const [docNumber, setDocNumber] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("Nepotrjeno");
  const [invNumber, setInvNumber] = useState("");
  const [dateInv, setDateInv] = useState(new Date().toISOString().split('T')[0]);
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [referent, setReferent] = useState("");
  const [items, setItems] = useState<InventuraItem[]>([{ artikel: "", ean: "", kolicina: 0, vrednost: 0 }]);

  const POSLOVALNICE = ['PE-01 (Trgovina IVO)', 'PE-02 (Trgovina KAMNIK)', 'PE-03 (Trgovina LJUBLJANA)', 'GLAVNO SKLADIŠČE'];
  const ODDELKI = ['Trgovina', 'Skladišče', 'Pisarna', 'Drogerija', 'Pijače', 'Hrana'];
  const STATUSI = ['Nepotrjeno', 'V obdelavi', 'Potrjeno', 'Stornirano'];

  useEffect(() => {
    fetchDocs();
    const ch = supabase.channel('inv-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventure' }, fetchDocs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const fetchDocs = async () => {
    const { data } = await (supabase as any).from('inventure').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data as InventuraDoc[]);
  };

  const addItemRow = () => setItems(prev => [...prev, { artikel: "", ean: "", kolicina: 0, vrednost: 0 }]);
  const updateItem = (i: number, key: keyof InventuraItem, value: any) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: key === 'kolicina' || key === 'vrednost' ? Number(value) : value } : it));
  };
  const total = items.reduce((s, it) => s + (it.kolicina * it.vrednost), 0);

  const lookupByEan = (ean: string, idx: number) => {
    const found = products.find(p => p.ean === ean);
    if (found) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, artikel: found.name, vrednost: found.price } : it));
    }
  };

  const resetForm = () => {
    setDocNumber(""); setWarehouse(""); setDepartment(""); setStatus("Nepotrjeno");
    setInvNumber(""); setDateInv(new Date().toISOString().split('T')[0]);
    setResponsiblePerson(""); setReferent(""); setItems([{ artikel: "", ean: "", kolicina: 0, vrednost: 0 }]);
  };

  const handleSave = async () => {
    if (!warehouse) { toast.error('Izberite skladišče / poslovalnico'); return; }
    const dn = docNumber || `INV-${Date.now().toString().slice(-6)}`;
    const validItems = items.filter(it => it.ean || it.artikel);
    const { error } = await (supabase as any).from('inventure').insert({
      document_number: dn, inventory_number: invNumber, warehouse, department, status,
      date_inventure: dateInv, responsible_person: responsiblePerson, referent,
      items: validItems, total, notes: '',
    });
    if (error) { toast.error('Napaka: ' + error.message); return; }
    toast.success('Inventura shranjena');
    resetForm();
    setSubTab('seznam');
  };

  const handlePotrdi = async () => {
    if (!warehouse) { toast.error('Izberite skladišče'); return; }
    setStatus('Potrjeno');
    await handleSave();
  };

  const filteredDocs = docs.filter(d => {
    if (search && !((d.document_number || '').toLowerCase().includes(search.toLowerCase()) || (d.warehouse || '').toLowerCase().includes(search.toLowerCase()))) return false;
    if (docType !== 'Vse' && d.status !== docType) return false;
    if (dateFrom && d.date_inventure < dateFrom) return false;
    if (dateTo && d.date_inventure > dateTo) return false;
    return true;
  });

  return (
    <div>
      <div className="bg-gray-600/80 px-6 py-3"><h2 className="text-white font-bold text-xl">Inventura</h2></div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-6 mt-3">
        <button onClick={() => setSubTab('seznam')}
          className={`px-5 py-2 text-sm font-bold border border-gray-400 ${subTab === 'seznam' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          Seznam inventure
        </button>
        <button onClick={() => setSubTab('nova')}
          className={`px-5 py-2 text-sm font-bold border border-gray-400 ${subTab === 'nova' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
          Nova inventura
        </button>
        <div className="flex-1" />
        {subTab === 'seznam' && (
          <button onClick={() => setShowNewLocationDialog(true)}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded text-sm border border-yellow-600">
            + Ustvari inventuro
          </button>
        )}
        {subTab === 'nova' && (
          <div className="flex gap-2">
            <button onClick={handlePotrdi} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> Potrdi
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded text-sm flex items-center gap-1">
              <Save className="w-4 h-4" /> Shrani
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-bold rounded text-sm flex items-center gap-1">
              <Printer className="w-4 h-4" /> Natisni
            </button>
          </div>
        )}
      </div>

      <div className="px-6 py-4">
        {subTab === 'seznam' && (
          <>
            {/* Filtri */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Iskanje:</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Vnesi iskalni niz"
                  className="w-full h-9 px-3 border border-gray-400 rounded text-sm focus:outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Vrsta dokumenta:</label>
                <select value={docType} onChange={e => setDocType(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-400 rounded text-sm bg-white">
                  <option>Vse</option>{STATUSI.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Datum od:</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-400 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Datum do:</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-400 rounded text-sm" />
              </div>
            </div>

            {/* Tabela */}
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Št. dokumenta</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Skladišče / PE</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Oddelek</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Status</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Vrednost</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-gray-500 text-sm">Ni inventur</td></tr>
                ) : filteredDocs.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{d.document_number}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{d.warehouse}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{d.department}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{d.date_inventure}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${d.status === 'Potrjeno' ? 'bg-green-200 text-green-800' : d.status === 'Stornirano' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>{d.status}</span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{(d.total || 0).toFixed(2)} EUR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {subTab === 'nova' && (
          <div className="flex gap-4">
            <div className="flex-1">
              {/* Header polja */}
              <div className="grid grid-cols-5 gap-3 mb-4 bg-gray-100 p-3 rounded border border-gray-300">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Št. dokumenta</label>
                  <input value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Avto."
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Skladišče <span className="text-red-500">*</span></label>
                  <select value={warehouse} onChange={e => setWarehouse(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                    <option value="">Izberi</option>{POSLOVALNICE.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Oddelek</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                    <option value="">Izberi</option>{ODDELKI.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                    {STATUSI.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Št. inventure</label>
                  <input value={invNumber} onChange={e => setInvNumber(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
                </div>
              </div>

              {/* Tabela artiklov */}
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-2 text-left text-sm font-bold">Artikel</th>
                    <th className="border border-gray-400 px-2 py-2 text-left text-sm font-bold w-40">EAN koda</th>
                    <th className="border border-gray-400 px-2 py-2 text-right text-sm font-bold w-24">Količina</th>
                    <th className="border border-gray-400 px-2 py-2 text-right text-sm font-bold w-28">Vrednost</th>
                    <th className="border border-gray-400 px-2 py-2 w-10">
                      <button onClick={addItemRow} className="text-green-600 hover:text-green-800"><Plus className="w-4 h-4 mx-auto" /></button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 p-1">
                        <input value={it.artikel} onChange={e => updateItem(i, 'artikel', e.target.value)}
                          className="w-full px-2 py-1 text-sm focus:outline-none" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input value={it.ean} onChange={e => updateItem(i, 'ean', e.target.value)}
                          onBlur={e => lookupByEan(e.target.value, i)}
                          className="w-full px-2 py-1 text-sm font-mono focus:outline-none" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" value={it.kolicina} onChange={e => updateItem(i, 'kolicina', e.target.value)}
                          className="w-full px-2 py-1 text-sm text-right focus:outline-none" />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input type="number" step="0.01" value={it.vrednost} onChange={e => updateItem(i, 'vrednost', e.target.value)}
                          className="w-full px-2 py-1 text-sm text-right focus:outline-none" />
                      </td>
                      <td className="border border-gray-300 text-center">
                        <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><X className="w-4 h-4 mx-auto" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="mt-3 flex justify-end">
                <div className="bg-yellow-300 border-2 border-yellow-500 px-4 py-2 rounded">
                  <div className="text-xs font-bold text-gray-700">Skupaj</div>
                  <div className="text-lg font-bold text-gray-900">{total.toFixed(2)} EUR</div>
                </div>
              </div>
            </div>

            {/* Stranska kartica - Osnovni podatki */}
            <div className="w-72 shrink-0">
              <div className="bg-yellow-400 px-3 py-2 rounded-t border border-yellow-600">
                <h4 className="font-bold text-sm text-gray-900">Osnovni podatki:</h4>
              </div>
              <div className="bg-white border border-yellow-600 rounded-b p-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Datum inventure:</label>
                  <input type="date" value={dateInv} onChange={e => setDateInv(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Odg. oseba:</label>
                  <select value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                    <option value="">-- izberi --</option>
                    <option>Direktor (Dženan Kedić)</option>
                    <option>Vodja prodaje</option>
                    <option>Vodja skladišča</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Referent:</label>
                  <input value={referent} onChange={e => setReferent(e.target.value)}
                    className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Ustvarjanje nove inventure (izbira poslovalnice) */}
      {showNewLocationDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-gray-400 rounded-lg p-6 w-[480px]">
            <h3 className="font-bold text-lg mb-4">Ustvarjanje nove inventure</h3>
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium">Izberi poslovalnico:</label>
              <select value={selectedPE} onChange={e => setSelectedPE(e.target.value)}
                className="flex-1 h-9 px-3 border border-gray-400 rounded text-sm bg-white">
                <option value="">-- izberi --</option>
                {POSLOVALNICE.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewLocationDialog(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-sm">Prekliči</button>
              <button onClick={() => {
                if (!selectedPE) { toast.error('Izberi poslovalnico'); return; }
                setWarehouse(selectedPE);
                setShowNewLocationDialog(false);
                setSubTab('nova');
                setSelectedPE("");
              }} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded text-sm">Potrdi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventuraModule;
