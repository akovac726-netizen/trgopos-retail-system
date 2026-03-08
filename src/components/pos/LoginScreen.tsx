import { useState } from "react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import { Power, RotateCcw, Delete, CreditCard } from "lucide-react";

type AppMode = 'trgopos' | 'backoffice';

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
  onBackOfficeLogin: (role: 'admin' | 'shop') => void;
  registerId: number;
  registerLocked: boolean;
  onSelectRegister: (id: number) => void;
  onOpenTerminal?: () => void;
}

const LoginScreen = ({ cashiers, onLogin, onBackOfficeLogin, registerId, registerLocked, onSelectRegister, onOpenTerminal }: LoginScreenProps) => {
  const [mode, setMode] = useState<AppMode>('trgopos');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');

  const handleKey = (key: string) => {
    if (activeField === 'username') {
      setUsername(prev => prev + key);
    } else {
      setPassword(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    if (activeField === 'password' && password.length > 0) {
      setPassword(prev => prev.slice(0, -1));
    } else if (activeField === 'username' && username.length > 0) {
      setUsername(prev => prev.slice(0, -1));
    } else if (activeField === 'password' && password.length === 0) {
      setActiveField('username');
      setUsername(prev => prev.slice(0, -1));
    }
  };

  const handleEnter = () => {
    if (mode === 'trgopos') {
      const cashier = cashiers.find(c => c.id === username);
      if (cashier && password === cashier.password) {
        onLogin(cashier);
        toast.success(`Dobrodošli, ${cashier.name}!`);
      } else {
        toast.error('Napačno uporabniško ime ali geslo');
        setPassword("");
      }
    } else {
      if (username === 'StandBuyAdmin' && password === 'Admin12273') {
        onBackOfficeLogin('admin');
        toast.success('Dobrodošli v BackOffice (Direktor)!');
      } else if (username === 'StandBuy.si' && password === 'TR122732207') {
        onBackOfficeLogin('shop');
        toast.success('Dobrodošli v BackOffice (Trgovina)!');
      } else {
        toast.error('Napačno uporabniško ime ali geslo');
        setPassword("");
      }
    }
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setUsername("");
    setPassword("");
    setActiveField('username');
  };

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  // BackOffice login
  if (mode === 'backoffice') {
    return (
      <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur rounded-lg px-1 py-1 border border-gray-600">
          <button onClick={() => handleModeSwitch('trgopos')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-gray-400 hover:text-gray-200">
            TrgoPOS
          </button>
          <button className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-violet-600 text-white shadow">
            BackOffice
          </button>
        </div>

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
          <button onClick={() => window.close()} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <Power className="w-4 h-4" /> Turn off
          </button>
        </div>

        <div className="relative z-10 w-[480px] bg-gradient-to-b from-gray-700/90 to-gray-800/95 border border-gray-500/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 bg-gray-800 border-2 border-gray-500 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="32" cy="20" r="8" />
                <path d="M20 44c0-8 5-14 12-14s12 6 12 14" />
                <circle cx="32" cy="32" r="28" />
              </svg>
            </div>
          </div>
          <h2 className="text-center text-white font-bold text-xl mb-6">TrgoPOS - BackOffice</h2>
          <div className="space-y-3 mb-6">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onClick={() => setActiveField('username')}
              placeholder="Uporabniško ime:" className={`w-full h-11 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded ${activeField === 'username' ? 'border-sky-400 ring-1 ring-sky-400' : 'border-gray-500'}`} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onClick={() => setActiveField('password')}
              placeholder="Geslo:" className={`w-full h-11 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded ${activeField === 'password' ? 'border-sky-400 ring-1 ring-sky-400' : 'border-gray-500'}`} />
          </div>
          <div className="flex justify-center mb-6">
            <button onClick={handleEnter} className="px-10 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-lg transition-colors shadow-lg">
              PRIJAVA
            </button>
          </div>
          <div className="text-center mb-6">
            <h3 className="text-4xl font-black tracking-wide">
              <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
              <span className="text-orange-400 text-3xl ml-1">★</span>
            </h3>
          </div>
          <div className="flex justify-center gap-4">
            <button onClick={() => { setUsername('StandBuyAdmin'); setPassword(''); setActiveField('password'); }}
              className="px-8 py-2 bg-transparent border-2 border-gray-400 text-gray-200 rounded-full font-medium text-sm hover:bg-gray-600/50 transition-colors">
              Direktor
            </button>
            <button onClick={() => { setUsername('StandBuy.si'); setPassword(''); setActiveField('password'); }}
              className="px-8 py-2 bg-transparent border-2 border-gray-400 text-gray-200 rounded-full font-medium text-sm hover:bg-gray-600/50 transition-colors">
              Poslovalnica
            </button>
          </div>
        </div>
        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
          TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
        </p>
      </div>
    );
  }

  // TrgoPOS login - matching Diapozitiv1-5: blue geometric background, centered inputs + numpad + POTRDI
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 50%, #d4eaf7 70%, #4aa3df 85%, #2980b9 100%)' }}>
      {/* Geometric blue triangles */}
      <div className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: '500px solid transparent', borderTop: '350px solid #3498db', opacity: 0.35 }} />
      <div className="absolute bottom-0 right-0 w-0 h-0" style={{ borderLeft: '700px solid transparent', borderBottom: '450px solid #2980b9', opacity: 0.45 }} />
      <div className="absolute bottom-0 left-1/4 w-0 h-0" style={{ borderRight: '400px solid transparent', borderBottom: '250px solid #5dade2', opacity: 0.3 }} />
      <div className="absolute top-1/3 right-1/4 w-0 h-0" style={{ borderLeft: '200px solid transparent', borderTop: '150px solid #85c1e9', opacity: 0.25 }} />

      {/* Top bar - Restart/Turnoff + mode switch */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-3">
        <div className="flex flex-col gap-2">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors shadow-md">
            <RotateCcw className="w-5 h-5" /> Restart
          </button>
          <button onClick={() => window.close()} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold text-sm transition-colors shadow-md">
            <Power className="w-5 h-5" /> Turn off
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
          <button className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-sky-500 text-white shadow">TrgoPOS</button>
          <button onClick={() => handleModeSwitch('backoffice')} className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700">BackOffice</button>
        </div>
      </div>

      {/* Register selection screen */}
      {registerId === 0 ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
          <div className="mb-6">
            <h2 className="text-5xl font-black tracking-wide">
              <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
              <span className="text-orange-400 text-4xl ml-1">★</span>
            </h2>
            <p className="text-center text-gray-700 font-bold text-sm mt-1 tracking-[0.3em]">TrgoPOS</p>
          </div>
          <p className="text-lg font-bold text-gray-700 mb-4">Izberite blagajno za to napravo:</p>
          <div className="flex gap-4">
            {[1, 2, 3].map(id => (
              <button key={id} onClick={() => onSelectRegister(id)}
                className="w-28 h-28 bg-white border-4 border-sky-400 rounded-xl text-3xl font-black text-sky-600 hover:bg-sky-50 hover:border-sky-500 transition-all shadow-lg">
                {id}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">Ta izbira se shrani na napravo.</p>
        </div>
      ) : (
      /* Centered content */
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-8">
        {/* StandBuy Logo */}
        <div className="mb-4">
          <h2 className="text-5xl font-black tracking-wide">
            <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
            <span className="text-orange-400 text-4xl ml-1">★</span>
          </h2>
          <p className="text-center text-gray-700 font-bold text-sm mt-1 tracking-[0.3em]">TrgoPOS – Blagajna {registerId}</p>
          {registerLocked && (
            <p className="text-center text-red-600 font-bold text-sm mt-2">⚠ Blagajna {registerId} je zaključena za danes</p>
          )}
        </div>

        {/* Input fields */}
        <div className="w-[420px] space-y-2 mb-4">
          <input type="text" value={username} readOnly onClick={() => setActiveField('username')}
            placeholder="Uporabniško ime"
            className={`w-full h-11 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-sm border-2 ${activeField === 'username' ? 'border-sky-400' : 'border-gray-300'}`} />
          <input type="password" value={password} readOnly onClick={() => setActiveField('password')}
            placeholder="Geslo"
            className={`w-full h-11 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-sm border-2 ${activeField === 'password' ? 'border-sky-400' : 'border-gray-300'}`} />
        </div>

        {/* Numeric keypad - large buttons matching image */}
        <div className="bg-gray-200 border-2 border-gray-400 rounded-lg p-3 mb-3">
          <div className="flex flex-col gap-2">
            {numKeys.map((row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.map(key => (
                  <button key={key} onClick={() => handleKey(key)}
                    className="w-16 h-14 bg-gray-100 hover:bg-gray-200 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors shadow-sm">
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => handleKey('0')}
                className="w-16 h-14 bg-gray-100 hover:bg-gray-200 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors shadow-sm">
                0
              </button>
              <button onClick={() => handleKey(',')}
                className="w-16 h-14 bg-gray-100 hover:bg-gray-200 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors shadow-sm">
                ,
              </button>
              <button onClick={handleBackspace}
                className="w-16 h-14 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors shadow-sm">
                <Delete className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* POTRDI button */}
        <button onClick={handleEnter}
          className="w-[220px] h-14 bg-white hover:bg-gray-50 border-2 border-gray-500 rounded-lg font-bold text-xl text-gray-700 flex items-center justify-center gap-2 transition-colors shadow-md">
          <span className="text-xl">↵</span> POTRDI
        </button>
      </div>
      )}

      {/* POS Terminal button - bottom right */}
      {onOpenTerminal && (
        <button onClick={onOpenTerminal}
          className="absolute bottom-3 right-4 z-20 flex items-center gap-2 bg-gray-800/80 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors backdrop-blur border border-gray-600">
          <CreditCard className="w-4 h-4" />
          POS Terminal
        </button>
      )}

      {/* Footer */}
      <p className="relative z-10 text-center text-xs text-gray-500 py-3">
        TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
      </p>
    </div>
  );
};

export default LoginScreen;
