import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

export interface CenovkaItem {
  sku?: string;
  ean: string;
  name: string;
  description?: string | null;
  country?: string | null;
  price: number;
  old_price?: number | null;
  size_info?: string | null; // npr. "500 g", "1 L"
  quantity?: number; // koliko cenovk natisni
}

const COMPANY = "Standbuy d.o.o.";

// Geometrija A4 landscape (mm)
const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN_T = 5;
const MARGIN_L = 5;
const MARGIN_R = 5;
const MARGIN_B = 30;
const CELL_W = 74; // 7.4 cm
const CELL_H = 59; // 5.9 cm
const COLS = 4;
const ROWS = 3; // polne vrstice; spodaj ostane ~3cm
const PER_PAGE = COLS * ROWS;

function barcodeDataUrl(ean: string): string {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, ean, { format: "EAN13", width: 2, height: 50, displayValue: true, fontSize: 12, margin: 0 });
    return canvas.toDataURL("image/png");
  } catch {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, ean, { format: "CODE128", width: 2, height: 50, displayValue: true, fontSize: 12, margin: 0 });
    return canvas.toDataURL("image/png");
  }
}

function pricePerUnit(price: number, size?: string | null): string | null {
  if (!size) return null;
  const m = size.match(/([\d.,]+)\s*(g|kg|ml|l)/i);
  if (!m) return null;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  if (!val || val <= 0) return null;
  if (unit === "g") return `100 g = ${(price / val * 100).toFixed(2)} €`;
  if (unit === "kg") return `1 kg = ${(price / val).toFixed(2)} €`;
  if (unit === "ml") return `100 ml = ${(price / val * 100).toFixed(2)} €`;
  if (unit === "l") return `1 L = ${(price / val).toFixed(2)} €`;
  return null;
}

function drawCenovka(doc: jsPDF, item: CenovkaItem, x: number, y: number) {
  const isAkcija = item.old_price != null && item.old_price > 0 && item.old_price !== item.price;

  // Okvir
  doc.setDrawColor(120);
  doc.setLineWidth(0.2);
  doc.rect(x, y, CELL_W, CELL_H);

  if (isAkcija) {
    doc.setFillColor(230, 30, 30);
    doc.rect(x, y, CELL_W, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AKCIJA", x + CELL_W / 2, y + 4.2, { align: "center" });
  }

  const topPad = isAkcija ? 9 : 4;

  // Naziv
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  const nameLines = doc.splitTextToSize(item.name, CELL_W - 6) as string[];
  doc.text(nameLines.slice(0, 2).join("\n"), x + 3, y + topPad + 3);

  // Opis
  if (item.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const desc = doc.splitTextToSize(item.description, CELL_W - 6) as string[];
    doc.text(desc.slice(0, 1).join("\n"), x + 3, y + topPad + 9);
  }

  // Cena - desno
  const priceY = y + topPad + 15;
  if (isAkcija) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    const oldStr = `${item.old_price!.toFixed(2)} €`;
    const oldW = doc.getTextWidth(oldStr);
    doc.text(oldStr, x + CELL_W - 3 - oldW, priceY);
    doc.setDrawColor(200, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(x + CELL_W - 3 - oldW - 1, priceY - 1.5, x + CELL_W - 2, priceY - 1.5);

    doc.setTextColor(200, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const newStr = `${item.price.toFixed(2)} €`;
    const newW = doc.getTextWidth(newStr);
    doc.text(newStr, x + CELL_W - 3 - newW, priceY + 8);
  } else {
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    const newStr = `${item.price.toFixed(2)} €`;
    const newW = doc.getTextWidth(newStr);
    doc.text(newStr, x + CELL_W - 3 - newW, priceY + 8);
  }

  // Cena na enoto
  const ppu = pricePerUnit(item.price, item.size_info || undefined);
  if (ppu) {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(ppu, x + 3, y + CELL_H - 18);
  }

  // Država porekla in firma
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  if (item.country) doc.text(`Poreklo: ${item.country}`, x + 3, y + CELL_H - 14);
  doc.text(COMPANY, x + 3, y + CELL_H - 11);

  // Črtna koda
  try {
    const img = barcodeDataUrl(item.ean);
    doc.addImage(img, "PNG", x + CELL_W - 32, y + CELL_H - 13, 30, 10);
  } catch { /* ignore */ }

  // Datum tiskanja
  const d = new Date();
  const ds = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  doc.setFontSize(6);
  doc.text(ds, x + 3, y + CELL_H - 2);
}

export function generateCenovkePdf(items: CenovkaItem[]): string {
  // Razširi po quantity
  const list: CenovkaItem[] = [];
  for (const it of items) {
    const q = Math.max(1, it.quantity || 1);
    for (let i = 0; i < q; i++) list.push(it);
  }
  if (!list.length) throw new Error("Ni artiklov za tiskanje.");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  for (let i = 0; i < list.length; i++) {
    const pageIdx = Math.floor(i / PER_PAGE);
    const onPage = i % PER_PAGE;
    if (onPage === 0 && pageIdx > 0) doc.addPage();
    const col = onPage % COLS;
    const row = Math.floor(onPage / COLS);
    // Centriraj horizontalno (96mm prostora med 5 in 292; vsebina 4*74=296 - pravzaprav 4*74=296 ne fitta. uporabi 5mm L margin)
    const availW = PAGE_W - MARGIN_L - MARGIN_R; // 287
    const gridW = COLS * CELL_W; // 296 - prevelik; uporabi enakomeren gap
    const gap = (availW - gridW) / (COLS - 1); // bo negativen
    // Če gap negativen, skaliraj horizontalno: ne, naj prepiše - to wider page
    // Uporabimo brez gap-a, preprosto MARGIN_L
    const x = MARGIN_L + col * CELL_W + col * Math.max(0, gap);
    const y = MARGIN_T + row * CELL_H;
    if (x + CELL_W > PAGE_W - MARGIN_R + 1) continue;
    if (y + CELL_H > PAGE_H - MARGIN_B + 1) continue;
    drawCenovka(doc, list[i], x, y);
  }

  const blobUrl = doc.output("bloburl") as unknown as string;
  return blobUrl.toString();
}
