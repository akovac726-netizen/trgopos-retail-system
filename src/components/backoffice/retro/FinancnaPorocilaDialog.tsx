import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import jsPDF from "jspdf";

interface RegisterRow {
  register_id: number;
  cash: number;
  visa: number;
  master: number;
  diners: number;
  amex: number;
  other: number;
  total: number;
}
interface ReportRow {
  date: string; // ISO yyyy-mm-dd
  locked: boolean;
  registers: RegisterRow[];
}

const STORE_KEY = "financial_reports_meta_v1";

function loadMeta(): Record<string, { locked: boolean }> {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); } catch { return {}; }
}
function saveMeta(m: Record<string, { locked: boolean }>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(m));
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const FinancnaPorocilaDialog = ({ onClose }: { onClose: () => void }) => {
  const [filter, setFilter] = useState('');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [sel, setSel] = useState<number>(-1);

  const refresh = async () => {
    const { data } = await supabase.from('cashier_closings_detail').select('*').order('date', { ascending: false });
    const meta = loadMeta();
    const byDate: Record<string, RegisterRow[]> = {};
    (data || []).forEach((r: any) => {
      (byDate[r.date] = byDate[r.date] || []).push({
        register_id: r.register_id,
        cash: Number(r.cash || 0),
        visa: Number(r.visa || 0),
        master: Number(r.master || 0),
        diners: Number(r.diners || 0),
        amex: Number(r.amex || 0),
        other: Number(r.other || 0),
        total: Number(r.total || 0),
      });
    });
    const rs: ReportRow[] = Object.keys(byDate).sort().reverse().map(date => ({
      date, locked: !!meta[date]?.locked, registers: byDate[date].sort((a,b) => a.register_id - b.register_id),
    }));
    setReports(rs);
  };

  useEffect(() => { refresh(); }, []);

  const ustvari = async () => {
    const date = todayIso();
    if (reports.some(r => r.date === date)) {
      setOpenDate(date);
      return;
    }
    const rows = [1,2,3,4].map(register_id => ({ register_id, date, cash: 0, visa: 0, master: 0, diners: 0, amex: 0, other: 0, total: 0, operator: '', note: 'DRAFT' }));
    await supabase.from('cashier_closings_detail').insert(rows);
    await refresh();
    setOpenDate(date);
  };

  const filtered = reports.filter(r => !filter || fmtDate(r.date).includes(filter) || r.date.includes(filter));

  return (
    <>
      <RetroWindow title="Finančna poročila" onClose={onClose} width={620}>
        <div className="flex items-center gap-3 mb-3">
          <RetroLabel>Iskanje poročila:</RetroLabel>
          <RetroInput value={filter} onChange={e => setFilter(e.target.value)} placeholder="Vnesite datum" style={{ width: 260 }} />
        </div>
        <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
          <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
          <div className="max-h-[260px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-[#e4e8ee] text-left">
                  <th className="w-8" />
                  <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Datum</th>
                  <th className="px-2 py-1">Vrsta poročila</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.date}
                    className={`border-t cursor-pointer ${sel === i ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                    style={{ borderColor: '#e0e0e0' }}
                    onClick={() => setSel(i)}
                    onDoubleClick={() => generatePdf(r)}
                  >
                    <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">{sel === i ? '▶' : ''}</td>
                    <td className="px-2 py-1">{fmtDate(r.date)}</td>
                    <td className="px-2 py-1">Dnevni promet blagajne {r.locked ? '(zaklenjeno)' : '(osnutek)'}</td>
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
        <div className="flex justify-end gap-2 mt-4">
          <RetroButton onClick={ustvari}>Ustvari</RetroButton>
          <RetroButton onClick={() => sel >= 0 && setOpenDate(filtered[sel].date)} disabled={sel < 0}>Odpri</RetroButton>
          <RetroButton onClick={onClose}>Izhod</RetroButton>
        </div>
      </RetroWindow>

      {openDate && (
        <DnevnoPorociloBlagajneDialog
          date={openDate}
          report={reports.find(r => r.date === openDate)}
          onClose={() => setOpenDate(null)}
          onSaved={async () => { await refresh(); }}
        />
      )}
    </>
  );
};

interface DailyProps {
  date: string;
  report?: ReportRow;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export const DnevnoPorociloBlagajneDialog = ({ date, report, onClose, onSaved }: DailyProps) => {
  const locked = !!report?.locked;
  const initial = (n: number) => report?.registers.find(r => r.register_id === n) || { register_id: n, cash: 0, visa: 0, master: 0, diners: 0, amex: 0, other: 0, total: 0 };
  const [regs, setRegs] = useState<RegisterRow[]>([1,2,3,4].map(initial));

  const update = (idx: number, field: keyof RegisterRow, val: string) => {
    if (locked) return;
    const v = parseFloat(val.replace(',', '.')) || 0;
    setRegs(rs => rs.map((r, i) => {
      if (i !== idx) return r;
      const nr = { ...r, [field]: v };
      nr.total = nr.cash + nr.visa + nr.master + nr.diners + nr.amex + nr.other;
      return nr;
    }));
  };

  const potrdi = async () => {
    if (locked) { onClose(); return; }
    // Delete existing drafts for this date, then insert
    await supabase.from('cashier_closings_detail').delete().eq('date', date);
    await supabase.from('cashier_closings_detail').insert(regs.map(r => ({
      register_id: r.register_id, date, cash: r.cash, visa: r.visa, master: r.master,
      diners: r.diners, amex: r.amex, other: r.other, total: r.total,
      operator: '', note: 'LOCKED',
    })));
    const meta = loadMeta();
    meta[date] = { locked: true };
    saveMeta(meta);
    await onSaved();
    onClose();
  };

  const printPdf = () => generatePdf({ date, locked: true, registers: regs });

  return (
    <RetroWindow title={`Dnevno poročilo blagajne — ${fmtDate(date)}`} onClose={onClose} width={560} zIndex={60} offsetX={50} offsetY={40}>
      <div className="mb-3 text-sm" style={{ color: '#1a3a6a' }}>
        <b>Datum:</b> {fmtDate(date)} {locked && <span className="ml-3 text-red-700">(zaklenjeno – ni mogoče urejati)</span>}
      </div>
      <div className="space-y-3 max-h-[55vh] overflow-auto pr-1">
        {regs.map((r, idx) => (
          <div key={r.register_id} className="border p-2 bg-white/40" style={{ borderColor: '#7a8a9a' }}>
            <div className="font-semibold text-sm mb-2" style={{ color: '#1a3a6a' }}>Blagajna {r.register_id}</div>
            <div className="grid grid-cols-[90px_1fr_90px_1fr] gap-2 items-center">
              <span className="text-sm">Gotovina:</span>
              <RetroInput disabled={locked} value={r.cash || ''} onChange={e => update(idx, 'cash', e.target.value)} />
              <span className="text-sm">Visa:</span>
              <RetroInput disabled={locked} value={r.visa || ''} onChange={e => update(idx, 'visa', e.target.value)} />
              <span className="text-sm">Master:</span>
              <RetroInput disabled={locked} value={r.master || ''} onChange={e => update(idx, 'master', e.target.value)} />
              <span className="text-sm">Diners:</span>
              <RetroInput disabled={locked} value={r.diners || ''} onChange={e => update(idx, 'diners', e.target.value)} />
              <span className="text-sm">Amex:</span>
              <RetroInput disabled={locked} value={r.amex || ''} onChange={e => update(idx, 'amex', e.target.value)} />
              <span className="text-sm">Drugo:</span>
              <RetroInput disabled={locked} value={r.other || ''} onChange={e => update(idx, 'other', e.target.value)} />
              <span className="text-sm font-semibold">Skupaj:</span>
              <RetroInput readOnly value={r.total.toFixed(2)} />
              <span /><span />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <RetroButton onClick={printPdf}>Tiskaj PDF</RetroButton>
        {!locked && <RetroButton onClick={potrdi}>Potrdi in zakleni</RetroButton>}
        <RetroButton onClick={onClose}>Izhod</RetroButton>
      </div>
    </RetroWindow>
  );
};

function generatePdf(report: ReportRow) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('courier', 'normal');
  let y = 15;
  const L = 12;
  doc.setFontSize(11);
  doc.text(`Trgovina: 300073 Ivančna Gorica`, L, y);
  doc.text(`Datum: ${fmtDate(report.date)}`, 150, y);
  y += 4;
  doc.text('-'.repeat(95), L, y); y += 5;
  doc.setFont('courier', 'bold');
  doc.text('PROMETI PO DAVČNIH STOPNJAH', L, y); y += 5;
  doc.setFont('courier', 'normal');
  doc.text('Blagajna       | Promet   | Stopnja DDV | Osnova   | DDV     | Znesek z DDV', L, y); y += 4;
  doc.text('-'.repeat(95), L, y); y += 5;

  let skupajOsnova = 0, skupajDdv = 0, skupajZ = 0;
  report.registers.forEach(r => {
    const promet = r.total;
    if (promet <= 0) return;
    // razdelitev: 80% 9,5%, 19% 22%, 1% 5%
    const splits = [
      { rate: 9.5, gross: promet * 0.7 },
      { rate: 22, gross: promet * 0.28 },
      { rate: 5, gross: promet * 0.02 },
    ];
    doc.text(`Blagajna ${r.register_id}    | ${promet.toFixed(2).padStart(8)} |`, L, y);
    splits.forEach((s, i) => {
      const base = s.gross / (1 + s.rate / 100);
      const ddv = s.gross - base;
      skupajOsnova += base; skupajDdv += ddv; skupajZ += s.gross;
      const line = `              |          | stop.: ${s.rate.toFixed(2).padStart(5)}% | ${base.toFixed(2).padStart(7)} | ${ddv.toFixed(2).padStart(6)} | ${s.gross.toFixed(2).padStart(8)}`;
      if (i === 0) doc.text(`stop.: ${s.rate.toFixed(2).padStart(5)}% | ${base.toFixed(2).padStart(7)} | ${ddv.toFixed(2).padStart(6)} | ${s.gross.toFixed(2).padStart(8)}`, L + 70, y);
      else doc.text(line, L, y);
      y += 4;
    });
    y += 2;
  });
  doc.text('-'.repeat(95), L, y); y += 5;
  doc.setFont('courier', 'bold');
  doc.text(`Skupaj:                                  | ${skupajOsnova.toFixed(2).padStart(8)} | ${skupajDdv.toFixed(2).padStart(7)} | ${skupajZ.toFixed(2).padStart(9)}`, L, y);
  y += 8;

  doc.text('PLAČILA', L, y); y += 5;
  doc.setFont('courier', 'normal');
  doc.text('-'.repeat(95), L, y); y += 4;
  doc.text('Blagajna       | Polog / plačilno sredstvo                          | Znesek', L, y); y += 4;
  doc.text('-'.repeat(95), L, y); y += 5;

  const totals = { cash: 0, visa: 0, master: 0, diners: 0, amex: 0, other: 0 };
  report.registers.forEach(r => {
    doc.text(`Blagajna ${r.register_id}    |`, L, y); y += 4;
    const rows: [string, number][] = [
      ['Gotovina', r.cash], ['Visa', r.visa], ['Master', r.master],
      ['Diners Club kartica', r.diners], ['Amex', r.amex], ['VALÚ / Drugo', r.other],
    ];
    rows.forEach(([label, val]) => {
      if (val <= 0) return;
      doc.text(`               |   ${label.padEnd(40)} | ${val.toFixed(2).padStart(8)}`, L, y); y += 4;
    });
    totals.cash += r.cash; totals.visa += r.visa; totals.master += r.master;
    totals.diners += r.diners; totals.amex += r.amex; totals.other += r.other;
    y += 1;
  });
  doc.text('-'.repeat(95), L, y); y += 5;
  doc.setFont('courier', 'bold');
  [
    ['Gotovina', totals.cash], ['Visa', totals.visa], ['Master', totals.master],
    ['Diners Club kartica', totals.diners], ['Amex', totals.amex], ['VALÚ / Drugo', totals.other],
  ].forEach(([l, v]) => {
    doc.text(`${String(l).padEnd(56)} | ${(v as number).toFixed(2).padStart(8)}`, L, y); y += 4;
  });

  const url = doc.output('bloburl');
  window.open(url as unknown as string, '_blank');
}

export default FinancnaPorocilaDialog;
