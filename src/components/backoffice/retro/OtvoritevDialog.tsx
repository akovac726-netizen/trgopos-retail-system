import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import RetroWindow, { RetroButton, RetroInput, RetroLabel } from "./RetroWindow";
import ConfirmDialog from "./ConfirmDialog";
import { setFunkcije, clearFunkcije } from "@/lib/sloFormat";

interface Step {
  label: string;
  report: (date: string) => void;
}

const buildPdf = (title: string, lines: string[]) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  lines.forEach((l, i) => doc.text(l, 14, 30 + i * 7));
  window.open(doc.output('bloburl') as unknown as string, '_blank');
};

const STEPS: Step[] = [
  { label: 'Preveri konec ponudbe', report: (d) => buildPdf('Poročilo: konec prejšnje ponudbe', [`Datum: ${d}`, 'Status: zaključeno.']) },
  { label: 'Prevzemi začetek ponudbe', report: (d) => buildPdf('Poročilo: začetek nove ponudbe', [`Datum: ${d}`, 'Nove cene aktivne.']) },
  { label: 'Izvleček prodajnih cen', report: (d) => buildPdf('Izvleček prodajnih cen', [`Datum: ${d}`, 'Cene posodobljene.']) },
  { label: 'Natisni etikete', report: (d) => buildPdf('Tisk etiket', [`Datum: ${d}`, 'Tiskanje sproženo.']) },
  { label: 'Izvleček sprememb', report: (d) => buildPdf('Izvleček sprememb cen', [`Datum: ${d}`, 'Status: brez napak.']) },
  { label: 'Širjenje blagajne', report: (d) => buildPdf('Širjenje cen na blagajne', [`Datum: ${d}`, 'Status: posodobljeno.']) },
  { label: 'Posodobitev blagajne', report: (d) => buildPdf('Posodobitev blagajne', [`Datum: ${d}`, 'Status: OK.']) },
];

const OtvoritevDialog = ({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const [date, setDate] = useState(`${dd}/${mm}/${yyyy}`);
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));
  const [runningIdx, setRunningIdx] = useState<number | null>(null);

  useEffect(() => {
    setFunkcije('Otvoritev — kliknite Zaženi, sistem bo samodejno izvedel vse korake (SI/NEIN).');
    return () => clearFunkcije();
  }, []);

  const startRun = () => setRunningIdx(0);

  const handleYes = () => {
    if (runningIdx === null) return;
    const i = runningIdx;
    STEPS[i].report(date);
    setDone(d => d.map((v, idx) => idx === i ? true : v));
    if (i + 1 < STEPS.length) {
      setRunningIdx(i + 1);
    } else {
      setRunningIdx(null);
      setTimeout(() => onConfirm(), 200);
    }
  };

  const handleNo = () => setRunningIdx(null);

  return (
    <>
      <RetroWindow title="Otvoritev" onClose={onClose} width={580}>
        <div className="flex items-center gap-3 mb-3">
          <RetroLabel>Datum otvoritve:</RetroLabel>
          <RetroInput value={date} onChange={e => setDate(e.target.value)} style={{ width: 200 }} placeholder="DD/MM/LLLL" />
        </div>
        <div className="bg-white border" style={{ borderColor: '#7a8a9a' }}>
          <div className="h-3 border-b" style={{ background: '#cfdbe9', borderColor: '#7a8a9a' }} />
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#e4e8ee] text-left">
                <th className="w-8" />
                <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Št.</th>
                <th className="px-2 py-1 border-r" style={{ borderColor: '#c8c8c8' }}>Funkcija</th>
                <th className="px-2 py-1 w-24 text-center">Izvedeno</th>
              </tr>
            </thead>
            <tbody>
              {STEPS.map((s, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#e0e0e0', background: runningIdx === i ? '#dbe8f5' : 'transparent' }}>
                  <td className="text-center bg-[#e4e8ee] text-[#1a3a6a]">▶</td>
                  <td className="px-2 py-1">{i + 1}.</td>
                  <td className="px-2 py-1">{s.label}</td>
                  <td className="px-2 py-1 text-center">
                    <span style={{ color: done[i] ? '#0a8a1a' : '#a00' }}>{done[i] ? '✔' : '☐'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-end justify-between mt-4">
          <div className="text-sm font-semibold italic" style={{ color: '#1a3a6a' }}>
            Postopek otvoritve …
          </div>
          <div className="flex gap-2">
            <RetroButton onClick={startRun} disabled={runningIdx !== null}>Zaženi</RetroButton>
            <RetroButton onClick={onClose}>Izhod</RetroButton>
          </div>
        </div>
      </RetroWindow>

      {runningIdx !== null && (
        <ConfirmDialog
          title="Otvoritev"
          message={`${runningIdx + 1}. ${STEPS[runningIdx].label} — izvedem?`}
          onYes={handleYes}
          onNo={handleNo}
        />
      )}
    </>
  );
};

export default OtvoritevDialog;
