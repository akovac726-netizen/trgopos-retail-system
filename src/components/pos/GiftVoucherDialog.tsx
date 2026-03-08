import { useState } from "react";
import { Delete } from "lucide-react";

interface GiftVoucherDialogProps {
  onConfirm: (code: string, amount: number) => void;
  onClose: () => void;
  total: number;
  cartItems: { name: string }[];
}

const VOUCHER_VALUES = [5, 10, 15, 20, 25, 30, 50, 100];

const GiftVoucherDialog = ({ onConfirm, onClose, total, cartItems }: GiftVoucherDialogProps) => {
  const [bonCode, setBonCode] = useState("");
  const [selectedValue, setSelectedValue] = useState<number>(10);

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
        {/* Purple header */}
        <div className="bg-purple-600 rounded-lg p-4">
          <h3 className="font-bold text-xl text-white">Izdaja darilnega bona:</h3>
          <p className="text-purple-200 text-sm mt-1">Bon se doda kot artikel – plačajte ga na blagajni</p>
        </div>

        {/* Code input */}
        <div className="border-2 border-gray-600 bg-white rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">Vnesi številko bona:</span>
            <input type="text" value={bonCode} readOnly
              className="flex-1 border-2 border-gray-400 rounded px-3 py-1 text-sm font-mono" />
          </div>
          {/* Value selector */}
          <div>
            <span className="text-sm font-medium">Izberi vrednost bona:</span>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {VOUCHER_VALUES.map(val => (
                <button key={val} onClick={() => setSelectedValue(val)}
                  className={`py-2 rounded-lg font-bold text-sm border-2 transition-colors ${
                    selectedValue === val
                      ? 'bg-purple-600 text-white border-purple-700'
                      : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
                  }`}>
                  {val},00 €
                </button>
              ))}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-300 rounded p-2 text-sm">
            <strong>Bon: {bonCode || '—'}</strong> · Vrednost: <strong>{formatPrice(selectedValue)} €</strong>
          </div>
          <p className="text-xs text-red-500 font-medium">
            * Bon NE MORE biti izdan nobenemu podjetju (brez fakture)
          </p>
        </div>

        {/* Numpad + actions */}
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
                onConfirm(bonCode, selectedValue);
              }
            }}
              disabled={bonCode.length < 4}
              className="h-20 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm disabled:opacity-40 transition-colors">
              Dodaj bon<br/>v košarico
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
