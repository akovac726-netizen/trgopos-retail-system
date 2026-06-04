import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";

type Layout = 'alt' | 'nuovo';

interface Planogram {
  id: string;
  title: string;
  layout: Layout;
  period_label: string;
  period_date: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

interface Props {
  onClose: () => void;
  isDirector?: boolean;
}

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const PlanogrammaDialog = ({ onClose, isDirector = false }: Props) => {
  const [step, setStep] = useState<'select' | 'list'>('select');
  const [layout, setLayout] = useState<Layout>('alt');
  const [items, setItems] = useState<Planogram[]>([]);
  const [filter, setFilter] = useState('');
  const [sel, setSel] = useState(-1);
  const [showUpload, setShowUpload] = useState(false);

  const refresh = async () => {
    const { data } = await (supabase as any)
      .from('planograms')
      .select('*')
      .order('period_date', { ascending: false });
    setItems(((data as Planogram[]) || []));
  };

  useEffect(() => { refresh(); }, []);

  const filtered = items
    .filter(p => p.layout === layout)
    .filter(p => !filter || p.period_label.toLowerCase().includes(filter.toLowerCase()) || fmtDate(p.period_date).includes(filter));

  const openPdf = (p: Planogram) => {
    if (p.file_url) window.open(p.file_url, '_blank');
  };

  return (
    <>
      <RetroWindow title="Planogramma" onClose={onClose} width={640}>
        <div className="font-bold text-sm mb-3" style={{ color: '#1a3a6a' }}>
          Prosimo, izberite ustrezen layout poslovalnice.
        </div>

        {step === 'select' ? (
          <div className="bg-white border p-6" style={{ borderColor: '#7a8a9a' }}>
            <div className="grid grid-cols-2 gap-6">
              {(['alt', 'nuovo'] as Layout[]).map(l => (
                <button
                  key={l}
                  onClick={() => { setLayout(l); setStep('list'); }}
                  className="h-[140px] text-2xl font-semibold border"
                  style={{
                    background: 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)',
                    borderColor: '#7a7a7a',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.2)',
                    color: '#111',
                    borderRadius: 4,
                  }}
                >
                  Layout<br />„{l === 'alt' ? 'Alt' : 'Nuovo'}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
            <div className="px-3 py-2 border-b text-xl" style={{ borderColor: '#7a8a9a' }}>
              <span className="font-semibold">Layout</span>{' '}
              <span className="italic text-gray-500">{layout === 'alt' ? 'Alt' : 'Nuovo'}</span>
            </div>
            <div className="max-h-[260px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-[#e4e8ee] text-left">
                    <th className="w-8" />
                    <th className="px-2 py-1 border-r w-[140px]" style={{ borderColor: '#c8c8c8' }}>Datum in leto</th>
                    <th className="px-2 py-1">Obdobje</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-t cursor-pointer ${sel === i ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      style={{ borderColor: '#e0e0e0' }}
                      onClick={() => setSel(i)}
                      onDoubleClick={() => openPdf(p)}
                    >
                      <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">{sel === i ? '▶' : ''}</td>
                      <td className="px-2 py-1">{fmtDate(p.period_date)}</td>
                      <td className="px-2 py-1">{p.period_label || p.title}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 7 - filtered.length) }).map((_, i) => (
                    <tr key={`e-${i}`} className="border-t h-7" style={{ borderColor: '#e0e0e0' }}>
                      <td className="bg-[#e4e8ee]" /><td /><td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 gap-2">
          <div className="flex items-center gap-2">
            {step === 'list' && (
              <RetroInput
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Iskanje obdobja..."
                style={{ width: 220 }}
              />
            )}
          </div>
          <div className="flex gap-2">
            {step === 'list' && (
              <RetroButton onClick={() => { setStep('select'); setSel(-1); }}>Nazaj</RetroButton>
            )}
            {step === 'list' && sel >= 0 && (
              <RetroButton onClick={() => openPdf(filtered[sel])}>Odpri PDF</RetroButton>
            )}
            {step === 'list' && (
              <RetroButton onClick={() => setShowUpload(true)}>Naloži (Direktor)</RetroButton>
            )}
            <RetroButton onClick={onClose}>Izhod</RetroButton>
          </div>
        </div>
      </RetroWindow>

      {showUpload && (
        <UploadPlanogramDialog
          defaultLayout={layout}
          onClose={() => setShowUpload(false)}
          onSaved={async () => { await refresh(); setShowUpload(false); }}
        />
      )}
    </>
  );
};

const UploadPlanogramDialog = ({
  defaultLayout, onClose, onSaved,
}: { defaultLayout: Layout; onClose: () => void; onSaved: () => Promise<void> | void }) => {
  const [layout, setLayout] = useState<Layout>(defaultLayout);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    if (code !== '80175') { alert('Napačna avtorizacijska koda Direktorja.'); return; }
    if (!file) { alert('Izberite PDF datoteko.'); return; }
    if (!label) { alert('Vnesite opis obdobja.'); return; }
    setBusy(true);
    try {
      const path = `${layout}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('planograms').upload(path, file, {
        contentType: file.type || 'application/pdf',
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('planograms').getPublicUrl(path);
      const { error: insErr } = await (supabase as any).from('planograms').insert({
        title: file.name, layout, period_label: label, period_date: date,
        file_url: urlData.publicUrl, uploaded_by: 'Direktor',
      });
      if (insErr) throw insErr;
      await onSaved();
    } catch (e: any) {
      alert('Napaka pri nalaganju: ' + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RetroWindow title="Naloži planogram (Direktor)" onClose={onClose} width={460} zIndex={70} offsetX={40} offsetY={20}>
      <div className="space-y-3">
        <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
          <RetroLabel>Koda Direktor:</RetroLabel>
          <RetroInput type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="80175" />

          <RetroLabel>Layout:</RetroLabel>
          <select
            value={layout}
            onChange={e => setLayout(e.target.value as Layout)}
            className="px-2 py-1 text-sm bg-white border"
            style={{ borderColor: '#6a7a8a' }}
          >
            <option value="alt">Layout „Alt"</option>
            <option value="nuovo">Layout „Nuovo"</option>
          </select>

          <RetroLabel>Datum:</RetroLabel>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-2 py-1 text-sm bg-white border"
            style={{ borderColor: '#6a7a8a' }}
          />

          <RetroLabel>Obdobje:</RetroLabel>
          <RetroInput value={label} onChange={e => setLabel(e.target.value)} placeholder="npr. Poletni layout 2026" />

          <RetroLabel>PDF datoteka:</RetroLabel>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
            {file && <div className="text-xs text-gray-600 mt-1">{file.name} ({(file.size / 1024).toFixed(0)} kB)</div>}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <RetroButton onClick={upload} disabled={busy}>{busy ? 'Nalagam...' : 'Naloži'}</RetroButton>
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

export default PlanogrammaDialog;
