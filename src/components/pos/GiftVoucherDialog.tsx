import { useState } from "react";
import { Delete } from "lucide-react";

interface GiftVoucherDialogProps {
  onConfirm: (code: string, amount: number, type: 'use' | 'sell') => void;
  onClose: () => void;
  total: number;
  cartItems: { name: string }[];
}

const GiftVoucherDialog = ({ onConfirm, onClose, total, cartItems }: GiftVoucherDialogProps) => {
  const [bonCode, setBonCode] = useState("");
  const [bonValue, setBonValue] = useState("10");

  const formatPrice = (p: number) => p.toLocaleString('sl-SI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleKeyPress = (key: string) => {
    setBonCode(prev => prev + key);
  };

  const handleDelete = () => {
    setBonCode(prev => prev.slice(0, -1));
  };

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  return (
    <div className="h-full flex gap-3 p-3" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 60%, #d4eaf7 80%, #4aa3df 100%)' }}>
      {/* LEFT - Receipt list */}
      <div className="flex-[4] flex flex-col">
        <div className="flex items-center border-2 border-gray-600 bg-white rounded-t">
          <div className="p-2 border-r border-gray-400"><span className="text-xl">▼</span></div>
          <div className="flex-1 px-3 py-2 text-sm font-medium">
            <div>Datum: {new Date().toLocaleDateString('sl-SI')}</div>
            <div>Številka računa:</div>
          </div>
          <div className="p-2 border-l border-gray-400"><span className="text-xl">▲</span></div>
        </div>
        <div className="flex-1 border-2 border-t-0 border-gray-600 bg-white overflow-y-auto">
          {cartItems.map((item, i) => (
            <div key={i} className="px-3 py-2 border-b border-gray-200 text-sm">{item.name}</div>
          ))}
        </div>
        <div className="border-2 border-t-0 border-gray-600 bg-white rounded-b px-3 py-2 flex justify-between items-center">
          <span className="font-bold text-sm">Skupini znesek v EUR:</span>
          <span className="font-bold text-lg font-mono">{formatPrice(total)}</span>
        </div>
      </div>

      {/* RIGHT - Darilni boni form */}
      <div className="flex-[6] flex flex-col gap-3">
        {/* Darilni boni title and fields */}
        <div className="border-2 border-gray-600 bg-white rounded-lg p-4">
          <h3 className="font-bold text-xl mb-3">Darilni boni:</h3>
          <div className="border-t border-gray-400 pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Vnesi številko bona:</span>
              <input type="text" value={bonCode} readOnly
                className="flex-1 border-2 border-gray-400 rounded px-3 py-1 text-sm font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Vrednost bona:</span>
              <div className="border-2 border-gray-400 rounded px-3 py-1 text-sm font-mono">
                {bonValue} EUR
              </div>
            </div>
          </div>
          <p className="text-xs text-red-500 mt-2 font-medium">
            * Bon NE MORE biti izdan nobenemu podjetju
          </p>
        </div>

        {/* Zaključi račun + Numpad */}
        <div className="flex gap-3 flex-1">
          <div className="flex flex-col gap-2 flex-1">
            {numKeys.map((row, ri) => (
              <div key={ri} className="flex gap-2 flex-1">
                {row.map(key => (
                  <button key={key} onClick={() => handleKeyPress(key)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex gap-2 flex-1">
              <button onClick={() => handleKeyPress('0')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                0
              </button>
              <button onClick={() => handleKeyPress(',')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                ,
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
                <Delete className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-36">
            <button onClick={() => {
              if (bonCode.length >= 4) {
                onConfirm(bonCode, parseFloat(bonValue) || 10, 'use');
              }
            }}
              disabled={bonCode.length < 4}
              className="h-20 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg disabled:opacity-40 transition-colors">
              Zaključi račun
            </button>
            <button onClick={onClose}
              className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-base transition-colors">
              ← Nazaj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftVoucherDialog;
