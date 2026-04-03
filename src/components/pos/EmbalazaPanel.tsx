import { Product } from "@/types/inventory";

interface EmbalazaPanelProps {
  products: Product[];
  onSelectBag: (ean: string) => void;
}

const EMBALAZA_EANS = {
  S: "EMB-S",
  M: "EMB-M",
  L: "EMB-L",
};

const EmbalazaPanel = ({ products, onSelectBag }: EmbalazaPanelProps) => {
  return (
    <div className="border-2 border-gray-600 rounded-lg bg-white p-3">
      <div className="text-center font-bold text-xl border-2 border-gray-600 bg-white px-4 py-3 mb-3">
        Vrečka (embalaža)
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["S", "M", "L"] as const).map(size => (
          <button
            key={size}
            onClick={() => onSelectBag(EMBALAZA_EANS[size])}
            className="h-16 rounded-lg font-bold text-lg text-gray-800 border-2 border-sky-400 transition-colors hover:brightness-95"
            style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}
          >
            Vrečka<br />{size}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmbalazaPanel;
export { EMBALAZA_EANS };
