import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Printer, CreditCard, Gift, User, Trash2, X, Check, PlusCircle } from "lucide-react";

interface GiftCard {
  id: string;
  code: string;
  ean: string;
  holder_id: string | null;
  balance: number;
  points: number;
  pin: string;
  active: boolean;
  created_by: string;
  created_at: string;
}

interface CardHolder {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  pin: string;
  created_at: string;
}

interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  remaining_amount: number;
  is_used: boolean;
  created_by: string;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}

type SubTab = 'kartice' | 'boni' | 'imetniki';

const generate8Digit = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const generate13Digit = () => {
  return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
};

const generateEAN = (code: string) => {
  // Simple EAN-13 from 8-digit code padded
  const base = code.padStart(12, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
};

const BoniKarticeModule = () => {
  const [subTab, setSubTab] = useState<SubTab>('kartice');
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
  const [holders, setHolders] = useState<CardHolder[]>([]);
  const [search, setSearch] = useState('');

  // Card creation
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardPoints, setNewCardPoints] = useState('0');
  const [newCardPin, setNewCardPin] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');

  // Manual points addition
  const [addPointsCardId, setAddPointsCardId] = useState<string | null>(null);
  const [addPointsValue, setAddPointsValue] = useState('');

  // Voucher creation
  const [showNewVoucher, setShowNewVoucher] = useState(false);
  const [newVoucherAmount, setNewVoucherAmount] = useState('');

  // Holder creation
  const [showNewHolder, setShowNewHolder] = useState(false);
  const [holderFirst, setHolderFirst] = useState('');
  const [holderLast, setHolderLast] = useState('');
  const [holderPhone, setHolderPhone] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPin, setHolderPin] = useState('');

  useEffect(() => {
    fetchCards();
    fetchVouchers();
    fetchHolders();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false });
    if (data) setCards(data as any[]);
  };

  const fetchVouchers = async () => {
    const { data } = await supabase.from('gift_vouchers').select('*').order('created_at', { ascending: false });
    if (data) setVouchers(data as any[]);
  };

  const fetchHolders = async () => {
    const { data } = await supabase.from('card_holders').select('*').order('created_at', { ascending: false });
    if (data) setHolders(data as any[]);
  };

  const POINT_VALUE = 0.01;

  const handleCreateCard = async () => {
    const code = generate8Digit();
    const ean = generateEAN(code);
    const points = parseInt(newCardPoints) || 0;
    const { error } = await supabase.from('gift_cards').insert({
      code,
      ean,
      balance: 0,
      points,
      pin: newCardPin,
      holder_id: newCardHolder || null,
      created_by: 'BackOffice',
    } as any);
    if (error) { toast.error('Napaka pri ustvarjanju kartice'); return; }
    toast.success(`Darilna kartica ${code} ustvarjena (${points} točk)`);
    setShowNewCard(false);
    setNewCardPoints('0');
    setNewCardPin('');
    setNewCardHolder('');
    fetchCards();
  };

  const handleAddPoints = async (cardId: string) => {
    const pts = parseInt(addPointsValue);
    if (!pts || pts <= 0) { toast.error('Vnesite veljavno število točk'); return; }
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const { error } = await supabase.from('gift_cards').update({ points: card.points + pts } as any).eq('id', cardId);
    if (error) { toast.error('Napaka pri dodajanju točk'); return; }
    toast.success(`Dodanih ${pts} točk na kartico ${card.code}`);
    setAddPointsCardId(null);
    setAddPointsValue('');
    fetchCards();
  };

  const handleCreateVoucher = async () => {
    const amount = parseFloat(newVoucherAmount);
    if (!amount || amount <= 0) { toast.error('Vnesite veljavni znesek'); return; }
    const code = generate13Digit();
    const { error } = await supabase.from('gift_vouchers').insert({
      code,
      amount,
      remaining_amount: amount,
      created_by: 'BackOffice',
    });
    if (error) { toast.error('Napaka pri ustvarjanju bona'); return; }
    toast.success(`Darilni bon ${code} ustvarjen (${amount.toFixed(2)} €)`);
    setShowNewVoucher(false);
    setNewVoucherAmount('');
    fetchVouchers();
  };

  const handleCreateHolder = async () => {
    if (!holderFirst || !holderLast) { toast.error('Vnesite ime in priimek'); return; }
    const { error } = await supabase.from('card_holders').insert({
      first_name: holderFirst,
      last_name: holderLast,
      phone: holderPhone,
      email: holderEmail,
      pin: holderPin,
    } as any);
    if (error) { toast.error('Napaka pri ustvarjanju profila'); return; }
    toast.success(`Profil ${holderFirst} ${holderLast} ustvarjen`);
    setShowNewHolder(false);
    setHolderFirst(''); setHolderLast(''); setHolderPhone(''); setHolderEmail(''); setHolderPin('');
    fetchHolders();
  };

  const toggleCardActive = async (card: GiftCard) => {
    await supabase.from('gift_cards').update({ active: !card.active } as any).eq('id', card.id);
    fetchCards();
    toast.success(card.active ? 'Kartica deaktivirana' : 'Kartica aktivirana');
  };

  const deleteCard = async (id: string) => {
    await supabase.from('gift_cards').delete().eq('id', id);
    fetchCards();
    toast.success('Kartica izbrisana');
  };

  const deleteVoucher = async (id: string) => {
    await supabase.from('gift_vouchers').delete().eq('id', id);
    fetchVouchers();
    toast.success('Bon izbrisan');
  };

  const deleteHolder = async (id: string) => {
    await supabase.from('card_holders').delete().eq('id', id);
    fetchHolders();
    toast.success('Profil izbrisan');
  };

  const handlePrintCard = (card: GiftCard) => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Darilna kartica</title>
      <style>
        body { font-family: monospace; text-align: center; padding: 20px; }
        .code { font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 10px 0; }
        .ean { font-size: 14px; color: #666; }
        .balance { font-size: 20px; margin-top: 10px; }
        .barcode { font-size: 40px; letter-spacing: 2px; font-family: 'Libre Barcode 39', monospace; }
      </style></head><body>
      <h2>🎁 DARILNA KARTICA</h2>
      <div class="code">${card.code}</div>
      <div class="ean">EAN: ${card.ean}</div>
      <div class="balance">Točke: ${card.points} (${(card.points * POINT_VALUE).toFixed(2)} €)</div>
      <hr/>
      <p style="font-size:11px">StandBuy s.p. • TrgoPOS</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintVoucher = (voucher: GiftVoucher) => {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Darilni bon</title>
      <style>
        body { font-family: monospace; text-align: center; padding: 20px; }
        .code { font-size: 22px; font-weight: bold; letter-spacing: 3px; margin: 10px 0; }
        .amount { font-size: 24px; font-weight: bold; margin-top: 10px; }
      </style></head><body>
      <h2>🎟️ DARILNI BON</h2>
      <div class="code">${voucher.code}</div>
      <div class="amount">${Number(voucher.amount).toFixed(2)} €</div>
      <p style="font-size:11px; margin-top:15px">Preostalo: ${Number(voucher.remaining_amount).toFixed(2)} €</p>
      <hr/>
      <p style="font-size:11px">StandBuy s.p. • TrgoPOS</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getHolderName = (holderId: string | null) => {
    if (!holderId) return '—';
    const h = holders.find(h => h.id === holderId);
    return h ? `${h.first_name} ${h.last_name}` : '—';
  };

  const filteredCards = cards.filter(c => c.code.includes(search) || c.ean.includes(search));
  const filteredVouchers = vouchers.filter(v => v.code.includes(search));
  const filteredHolders = holders.filter(h => 
    `${h.first_name} ${h.last_name}`.toLowerCase().includes(search.toLowerCase()) || h.phone.includes(search)
  );

  return (
    <div>
      <div className="bg-gray-600/80 px-6 py-3">
        <h2 className="text-white font-bold text-xl flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Boni in kartice
        </h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-gray-500">
        {([
          { id: 'kartice' as SubTab, label: 'Darilne kartice', icon: CreditCard },
          { id: 'boni' as SubTab, label: 'Darilni boni', icon: Gift },
          { id: 'imetniki' as SubTab, label: 'Imetniki kartic', icon: User },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
              subTab === tab.id ? 'bg-gray-700 text-white border-b-2 border-sky-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="px-6 py-4">
        {/* Search + Actions */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={subTab === 'kartice' ? 'Išči po kodi ali EAN...' : subTab === 'boni' ? 'Išči po kodi bona...' : 'Išči po imenu ali telefonu...'}
              className="w-full h-9 pl-9 pr-3 bg-gray-700 border border-gray-500 rounded text-sm text-white placeholder:text-gray-400" />
          </div>
          <button onClick={() => subTab === 'kartice' ? setShowNewCard(true) : subTab === 'boni' ? setShowNewVoucher(true) : setShowNewHolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            {subTab === 'kartice' ? 'Nova kartica' : subTab === 'boni' ? 'Nov bon' : 'Nov imetnik'}
          </button>
        </div>

        {/* DARILNE KARTICE */}
        {subTab === 'kartice' && (
          <>
            {showNewCard && (
              <div className="bg-gray-700/60 border border-gray-500 rounded-lg p-4 mb-4">
                <h3 className="text-white font-bold text-sm mb-3">Nova darilna kartica</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Začetne točke</label>
                    <input value={newCardPoints} onChange={e => setNewCardPoints(e.target.value)} type="number"
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">PIN koda (4 znaki)</label>
                    <input value={newCardPin} onChange={e => setNewCardPin(e.target.value.slice(0, 4))} maxLength={4}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white font-mono" placeholder="••••" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Imetnik (opcijsko)</label>
                    <select value={newCardHolder} onChange={e => setNewCardHolder(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white">
                      <option value="">Brez imetnika</option>
                      {holders.map(h => (
                        <option key={h.id} value={h.id}>{h.first_name} {h.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateCard} className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">
                    <Check className="w-4 h-4" /> Ustvari
                  </button>
                  <button onClick={() => setShowNewCard(false)} className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm">
                    <X className="w-4 h-4" /> Prekliči
                  </button>
                </div>
              </div>
            )}

            <table className="w-full border-collapse bg-white rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Koda (8‑mest.)</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">EAN‑13</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Imetnik</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Točke</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Vrednost (€)</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">PIN</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Status</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-gray-500">Ni darilnih kartic</td></tr>
                ) : filteredCards.map((card, i) => (
                  <tr key={card.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono font-bold">{card.code}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono text-gray-600">{card.ean}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{getHolderName(card.holder_id)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-bold">{card.points}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right text-gray-500">{card.points > 0 ? (card.points * POINT_VALUE).toFixed(2) + ' €' : '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-mono">{card.pin ? '••••' : '—'}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${card.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {card.active ? 'AKTIVNA' : 'NEAKTIVNA'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {addPointsCardId === card.id ? (
                          <div className="flex items-center gap-1">
                            <input value={addPointsValue} onChange={e => setAddPointsValue(e.target.value)} type="number" placeholder="Št. točk"
                              className="w-20 h-7 px-2 bg-gray-100 border border-gray-400 rounded text-xs text-gray-800" autoFocus />
                            <button onClick={() => handleAddPoints(card.id)} title="Potrdi"
                              className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { setAddPointsCardId(null); setAddPointsValue(''); }} title="Prekliči"
                              className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setAddPointsCardId(card.id)} title="Dodaj točke"
                              className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handlePrintCard(card)} title="Natisni"
                              className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded transition-colors">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => toggleCardActive(card)} title={card.active ? 'Deaktiviraj' : 'Aktiviraj'}
                              className={`p-1.5 rounded transition-colors ${card.active ? 'bg-orange-100 hover:bg-orange-200 text-orange-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}>
                              {card.active ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => deleteCard(card.id)} title="Izbriši"
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-gray-400 text-xs mt-2">Skupaj: {filteredCards.length} kartic</p>
          </>
        )}

        {/* DARILNI BONI */}
        {subTab === 'boni' && (
          <>
            {showNewVoucher && (
              <div className="bg-gray-700/60 border border-gray-500 rounded-lg p-4 mb-4">
                <h3 className="text-white font-bold text-sm mb-3">Nov darilni bon</h3>
                <div className="flex items-end gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Znesek (€)</label>
                    <input value={newVoucherAmount} onChange={e => setNewVoucherAmount(e.target.value)} type="number"
                      placeholder="10.00" className="w-40 h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                  <button onClick={handleCreateVoucher} className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">
                    <Check className="w-4 h-4" /> Generiraj bon
                  </button>
                  <button onClick={() => setShowNewVoucher(false)} className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm">
                    <X className="w-4 h-4" /> Prekliči
                  </button>
                </div>
                <p className="text-gray-400 text-xs">Sistem bo samodejno generiral 13-mestno kodo bona.</p>
              </div>
            )}

            <table className="w-full border-collapse bg-white rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Koda (13‑mest.)</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Vrednost</th>
                  <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">Preostalo</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Status</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ustvaril</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Datum</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-500">Ni darilnih bonov</td></tr>
                ) : filteredVouchers.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono font-bold tracking-wider">{v.code}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right">{Number(v.amount).toFixed(2)} €</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-right font-medium">{Number(v.remaining_amount).toFixed(2)} €</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        v.is_used ? 'bg-red-100 text-red-700' : Number(v.remaining_amount) < Number(v.amount) ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {v.is_used ? 'PORABLJEN' : Number(v.remaining_amount) < Number(v.amount) ? 'DELNO PORABLJEN' : 'AKTIVEN'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{v.created_by}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(v.created_at).toLocaleDateString('sl-SI')}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handlePrintVoucher(v)} title="Natisni"
                          className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded transition-colors">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteVoucher(v.id)} title="Izbriši"
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-gray-400 text-xs mt-2">Skupaj: {filteredVouchers.length} bonov</p>
          </>
        )}

        {/* IMETNIKI KARTIC */}
        {subTab === 'imetniki' && (
          <>
            {showNewHolder && (
              <div className="bg-gray-700/60 border border-gray-500 rounded-lg p-4 mb-4">
                <h3 className="text-white font-bold text-sm mb-3">Nov imetnik kartice</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Ime *</label>
                    <input value={holderFirst} onChange={e => setHolderFirst(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Priimek *</label>
                    <input value={holderLast} onChange={e => setHolderLast(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">PIN koda</label>
                    <input value={holderPin} onChange={e => setHolderPin(e.target.value.slice(0, 4))} maxLength={4}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white font-mono" placeholder="••••" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">Telefon</label>
                    <input value={holderPhone} onChange={e => setHolderPhone(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-1">E-pošta</label>
                    <input value={holderEmail} onChange={e => setHolderEmail(e.target.value)}
                      className="w-full h-9 px-3 bg-gray-600 border border-gray-500 rounded text-sm text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateHolder} className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium">
                    <Check className="w-4 h-4" /> Ustvari
                  </button>
                  <button onClick={() => setShowNewHolder(false)} className="flex items-center gap-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm">
                    <X className="w-4 h-4" /> Prekliči
                  </button>
                </div>
              </div>
            )}

            <table className="w-full border-collapse bg-white rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ime</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Priimek</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Telefon</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">E-pošta</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">PIN</th>
                  <th className="border border-gray-400 px-3 py-2 text-left text-sm font-bold">Ustvarjeno</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Kartice</th>
                  <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-6 text-gray-500">Ni imetnikov</td></tr>
                ) : filteredHolders.map((h, i) => {
                  const holderCards = cards.filter(c => c.holder_id === h.id);
                  return (
                    <tr key={h.id} className={i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{h.first_name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium">{h.last_name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{h.phone || '—'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{h.email || '—'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center font-mono">{h.pin ? '••••' : '—'}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{new Date(h.created_at).toLocaleDateString('sl-SI')}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-bold">{holderCards.length}</span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button onClick={() => deleteHolder(h.id)} title="Izbriši"
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-gray-400 text-xs mt-2">Skupaj: {filteredHolders.length} imetnikov</p>
          </>
        )}
      </div>
    </div>
  );
};

export default BoniKarticeModule;
