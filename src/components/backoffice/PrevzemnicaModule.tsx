import { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Partner { id: string; name: string; }
interface PrevItem { sku: string; ean: string; name: string; quantity: number; price: number; }

interface Props { onClose: () => void; partners: Partner[]; products: any[]; }

const PrevzemnicaModule = ({ onClose, partners, products }: Props) => {
  const [docNumber, setDocNumber] = useState(`2026-${String(Date.now()).slice(-5)}`);
  const [datePrev, setDatePrev] = useState(new Date().toISOString().split('T')[0]);
  const [datePrevzem, setDatePrevzem] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [warehouse, setWarehouse] = useState("0000 - MARIBOR");
  const [language, setLanguage] = useState("slovenska");
  const [useExchange, setUseExchange] = useState(false);
  const [exchangeRate, setExchangeRate] = useState("1.000000");
  const [recalcEur, setRecalcEur] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PrevItem[]>([]);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  const total = items.reduce((s, it) => s + (it.quantity * it.price), 0);

  const addItem = () => setItems(prev => [...prev, { sku: "", ean: "", name: "", quantity: 0, price: 0 }]);
  const updateItem = (i: number, key: keyof PrevItem, value: any) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: (key === 'quantity' || key === 'price') ? Number(value) : value } : it));
  };
  const lookupEan = (ean: string, idx: number) => {
    const found = products.find(p => p.ean === ean);
    if (found) setItems(prev => prev.map((it, i) => i === idx ? { ...it, name: found.name, sku: found.sku || '', price: found.purchase_price || found.price } : it));
  };

  const handleSave = async () => {
    if (!supplier) { toast.error('Izberite dobavitelja'); return; }
    const { error } = await (supabase as any).from('prevzemnice').insert({
      document_number: docNumber, date_prevzemnice: datePrev, date_prevzem: datePrevzem,
      supplier, delivery_note_number: deliveryNote, delivery_note_date: deliveryDate || null,
      order_reference: orderRef, cost_center: costCenter, warehouse,
      language_variant: language, exchange_rate: useExchange ? parseFloat(exchangeRate) : 1,
      notes, status: 'osnutek', items, total,
    });
    if (error) { toast.error('Napaka: ' + error.message); return; }
    toast.success('Prevzemnica shranjena');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-[920px] max-h-[95vh] overflow-y-auto">
        <div className="bg-sky-500 text-white px-5 py-3 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-base">Prevzemnica št. {docNumber} – Vnos podatkov za glavo prevzemnice</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Datum prevzemnice: <span className="text-red-500">*</span></label>
              <input type="date" value={datePrev} onChange={e => setDatePrev(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Datum prevzema: <span className="text-red-500">*</span></label>
              <input type="date" value={datePrevzem} onChange={e => setDatePrevzem(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Dobavitelj: <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <select value={supplier} onChange={e => setSupplier(e.target.value)}
                className="flex-1 h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                <option value="">-- izberi dobavitelja --</option>
                {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
              <button onClick={() => setShowNewSupplier(true)}
                className="px-3 h-8 bg-gray-100 hover:bg-gray-200 border border-gray-400 rounded text-xs">Vnos novega</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Št. prejete dobavnice:</label>
              <input value={deliveryNote} onChange={e => setDeliveryNote(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Dat. prejete dobavnice:</label>
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Naročilnica:</label>
              <input value={orderRef} onChange={e => setOrderRef(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Stroškovno mesto:</label>
              <select value={costCenter} onChange={e => setCostCenter(e.target.value)}
                className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
                <option value="">-- izberi --</option>
                <option>SM-01 Glavno skladišče</option>
                <option>SM-02 Trgovina</option>
                <option>SM-03 Pisarna</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Skladišče:</label>
            <select value={warehouse} onChange={e => setWarehouse(e.target.value)}
              className="w-full h-8 px-2 border border-gray-400 rounded text-sm bg-white">
              <option>0000 - MARIBOR</option>
              <option>PE-01 (Trgovina IVO)</option>
              <option>PE-02 (Trgovina KAMNIK)</option>
              <option>PE-03 (Trgovina LJUBLJANA)</option>
              <option>GLAVNO SKLADIŠČE</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Jezikovna varianta:</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-48 h-8 px-2 border border-gray-400 rounded text-sm bg-white">
              <option>slovenska</option><option>angleška</option><option>nemška</option><option>italijanska</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useExchange} onChange={e => setUseExchange(e.target.checked)} className="w-4 h-4" />
            Koristi želeni tečaj
          </label>

          {useExchange && (
            <div className="flex gap-3 items-center pl-6">
              <input value={exchangeRate} onChange={e => setExchangeRate(e.target.value)}
                className="w-32 h-8 px-2 border border-gray-400 rounded text-sm" />
              <input type="date" value={datePrev} disabled className="w-40 h-8 px-2 border border-gray-300 rounded text-sm bg-gray-100" />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recalcEur} onChange={e => setRecalcEur(e.target.checked)} className="w-4 h-4" />
            Preračunaj vrednost postavk v tuji valuti v EUR
          </label>

          <div>
            <label className="text-xs font-medium block mb-1">Opombe:</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-2 py-1 border border-gray-400 rounded text-sm resize-none" />
          </div>

          {/* Postavke */}
          <div className="border-t-2 border-gray-300 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm">Postavke prevzemnice</h4>
              <button onClick={addItem} className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded flex items-center gap-1">
                <Plus className="w-3 h-3" /> Dodaj postavko
              </button>
            </div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 p-1 text-left">Šifra</th>
                  <th className="border border-gray-400 p-1 text-left">EAN</th>
                  <th className="border border-gray-400 p-1 text-left">Naziv artikla</th>
                  <th className="border border-gray-400 p-1 text-right w-20">Količina</th>
                  <th className="border border-gray-400 p-1 text-right w-24">Nabavna c.</th>
                  <th className="border border-gray-400 p-1 text-right w-24">Vrednost</th>
                  <th className="border border-gray-400 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-3 text-gray-400">Ni postavk – dodajte z gumbom +</td></tr>
                ) : items.map((it, i) => (
                  <tr key={i}>
                    <td className="border border-gray-300 p-0.5">
                      <input value={it.sku} onChange={e => updateItem(i, 'sku', e.target.value)} className="w-full px-1 text-xs focus:outline-none" />
                    </td>
                    <td className="border border-gray-300 p-0.5">
                      <input value={it.ean} onChange={e => updateItem(i, 'ean', e.target.value)} onBlur={e => lookupEan(e.target.value, i)} className="w-full px-1 text-xs font-mono focus:outline-none" />
                    </td>
                    <td className="border border-gray-300 p-0.5">
                      <input value={it.name} onChange={e => updateItem(i, 'name', e.target.value)} className="w-full px-1 text-xs focus:outline-none" />
                    </td>
                    <td className="border border-gray-300 p-0.5">
                      <input type="number" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="w-full px-1 text-xs text-right focus:outline-none" />
                    </td>
                    <td className="border border-gray-300 p-0.5">
                      <input type="number" step="0.01" value={it.price} onChange={e => updateItem(i, 'price', e.target.value)} className="w-full px-1 text-xs text-right focus:outline-none" />
                    </td>
                    <td className="border border-gray-300 px-1 text-right text-xs font-bold">{(it.quantity * it.price).toFixed(2)}</td>
                    <td className="border border-gray-300 text-center">
                      <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500"><X className="w-3 h-3 mx-auto" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-yellow-100">
                  <td colSpan={5} className="border border-gray-400 p-1 text-right font-bold">Skupaj:</td>
                  <td className="border border-gray-400 p-1 text-right font-bold">{total.toFixed(2)} EUR</td>
                  <td className="border border-gray-400"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-center gap-3 pt-3 border-t border-gray-300">
            <button onClick={handleSave} className="px-8 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded text-sm flex items-center gap-2">
              <Save className="w-4 h-4" /> V redu
            </button>
            <button onClick={onClose} className="px-8 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm border border-gray-400">Prekliči</button>
          </div>
        </div>

        {showNewSupplier && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-5 w-96">
              <h3 className="font-bold mb-3">Vnos novega dobavitelja</h3>
              <input value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Naziv dobavitelja"
                className="w-full h-9 px-3 border border-gray-400 rounded text-sm mb-3" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewSupplier(false)} className="px-4 py-1.5 bg-gray-200 rounded text-sm">Prekliči</button>
                <button onClick={async () => {
                  if (!newSupplierName.trim()) return;
                  const { error } = await supabase.from('partners').insert({ name: newSupplierName.trim(), tax_number: '0', address: '' } as any);
                  if (!error) { setSupplier(newSupplierName.trim()); toast.success('Dobavitelj dodan'); setShowNewSupplier(false); setNewSupplierName(''); }
                  else toast.error('Napaka');
                }} className="px-4 py-1.5 bg-green-600 text-white rounded text-sm">Dodaj</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrevzemnicaModule;
