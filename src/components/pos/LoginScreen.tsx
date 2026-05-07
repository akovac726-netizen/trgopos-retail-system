import { useState } from "react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import { Delete } from "lucide-react";

type AppMode = 'trgopos' | 'backoffice';

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
  onBackOfficeLogin: (role: 'admin' | 'shop' | 'oddelki' | 'skladisce' | 'nabava' | 'racunovodstvo') => void;
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
    if (activeField === 'username') setUsername(prev => prev + key);
    else setPassword(prev => prev + key);
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

  const handleClear = () => {
    if (activeField === 'password') setPassword("");
    else setUsername("");
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
      // BackOffice login - 4 profili
      if (username === 'TR-IVO-001' && password === 'StandBuyIVO-001') {
        onBackOfficeLogin('shop');
        toast.success('Dobrodošli v BackOffice (Trgovina)!');
      } else if ((username === 'StBy-core' && password === 'Adm!@SB-core') ||
                 (username === 'BB.admin' && password === 'S!RQB!XX!') ||
                 (username === 'SB-admin' && password === 'StB@71X!')) {
        onBackOfficeLogin('admin');
        toast.success('Dobrodošli v BackOffice (Direktor)!');
      } else if (username === 'StBoddelki' && password === 'StBy12273') {
        onBackOfficeLogin('oddelki');
        toast.success('Dobrodošli v BackOffice (Vodja prodaje)!');
      } else if (username === 'StB_SKL' && password === 'SKL;stb') {
        onBackOfficeLogin('skladisce');
        toast.success('Dobrodošli v BackOffice (Vodja skladišča)!');
      } else if (username === 'StB_NAB' && password === 'NAB;stb12') {
        onBackOfficeLogin('nabava');
        toast.success('Dobrodošli v BackOffice (Nabava)!');
      } else if (username === 'StB_RAC' && password === 'RAC;stb34') {
        onBackOfficeLogin('racunovodstvo');
        toast.success('Dobrodošli v BackOffice (Računovodstvo)!');
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

  // ── BackOffice login ──
  if (mode === 'backoffice') {
    return (
      <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        {/* Water droplets background */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 15% 15%, rgba(255,255,255,0.08) 0%, transparent 50%),
                           radial-gradient(circle at 85% 25%, rgba(255,255,255,0.06) 0%, transparent 40%),
                           radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 45%),
                           radial-gradient(circle at 30% 70%, rgba(255,255,255,0.05) 0%, transparent 35%),
                           radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)`
        }} />

        {/* Mode switch */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur rounded-lg px-1 py-1 border border-gray-600">
          <button onClick={() => handleModeSwitch('trgopos')} className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200">TrgoPOS</button>
          <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-violet-600 text-white shadow">BackOffice</button>
        </div>

        {/* Login card */}
        <div className="relative z-10 w-[420px] bg-gradient-to-b from-gray-700/80 to-gray-800/90 border border-gray-500/40 rounded-2xl p-8 shadow-2xl">
          {/* User icon */}
          <div className="flex justify-center mb-3">
            <div className="w-24 h-24 bg-gray-800 border-2 border-gray-500 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="32" cy="20" r="8" />
                <path d="M20 44c0-8 5-14 12-14s12 6 12 14" />
                <circle cx="32" cy="32" r="28" />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-white font-bold text-xl mb-5">TrgoPOS - BackOffice</h2>

          <div className="space-y-3 mb-5">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              onClick={() => setActiveField('username')} placeholder="Uporabniško ime:"
              className="w-full h-10 px-4 bg-gray-300/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded border-gray-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onClick={() => setActiveField('password')} placeholder="Geslo:"
              className="w-full h-10 px-4 bg-gray-300/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded border-gray-500" />
          </div>

          <div className="flex justify-center mb-5">
            <button onClick={handleEnter} className="px-10 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-base rounded-lg transition-colors shadow-lg">
              PRIJAVA
            </button>
          </div>

          <div className="text-center">
            <h3 className="text-4xl font-black tracking-wide">
              <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
              <span className="text-orange-400 text-3xl ml-1">★</span>
            </h3>
          </div>
        </div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
          TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
        </p>
      </div>
    );
  }

  // ── Register selection ──
  if (registerId === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#e8f4f8' }}>
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
          <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-sky-500 text-white shadow">TrgoPOS</button>
          <button onClick={() => handleModeSwitch('backoffice')} className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">BackOffice</button>
        </div>
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
    );
  }

  // ── TrgoPOS login - matching PDF: two-panel layout ──
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: '#e8f4f8' }}>
      {/* Mode switch top-right */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
        <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-sky-500 text-white shadow">TrgoPOS</button>
        <button onClick={() => handleModeSwitch('backoffice')} className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700">BackOffice</button>
      </div>

      {/* Main content - two panel layout matching PDF page 1 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex border-2 border-sky-300 bg-white rounded-lg shadow-lg w-full max-w-[900px] h-[500px]">
          {/* LEFT panel - inputs + logo */}
          <div className="flex-1 flex flex-col justify-center p-8 border-r-2 border-sky-300">
            {/* Username/password inputs */}
            <div className="space-y-3 mb-8">
              <input type="text" value={username} readOnly onClick={() => setActiveField('username')}
                placeholder="Uporabniško ime"
                className={`w-full h-12 px-4 text-gray-800 font-medium placeholder:text-gray-500 focus:outline-none text-sm border-2 border-b-4 border-gray-800 ${activeField === 'username' ? 'bg-sky-100' : 'bg-sky-200/60'}`}
                style={{ background: activeField === 'username' ? 'linear-gradient(180deg, #b3e0f2, #87ceeb)' : 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }} />
              <input type="password" value={password} readOnly onClick={() => setActiveField('password')}
                placeholder="Geslo"
                className={`w-full h-12 px-4 text-gray-800 font-medium placeholder:text-gray-500 focus:outline-none text-sm border-2 border-b-4 border-gray-800 ${activeField === 'password' ? 'bg-sky-100' : 'bg-sky-200/60'}`}
                style={{ background: activeField === 'password' ? 'linear-gradient(180deg, #b3e0f2, #87ceeb)' : 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }} />
            </div>

            {/* StandBuy logo */}
            <div className="border-2 border-sky-300 rounded-lg p-4 text-center">
              <h2 className="text-4xl font-black tracking-wide">
                <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
                <span className="text-orange-400 text-3xl ml-1">★</span>
              </h2>
            </div>

            {registerLocked && (
              <p className="text-center text-red-600 font-bold text-sm mt-3">⚠ Blagajna {registerId} je zaključena za danes</p>
            )}
            <p className="text-center text-gray-500 text-xs mt-2">Blagajna {registerId}</p>
          </div>

          {/* RIGHT panel - numpad + Prijava */}
          <div className="flex-1 flex flex-col justify-center p-6">
            {/* Top row: 7-8-9 + Prijava */}
            <div className="flex gap-3 mb-3">
              {['7', '8', '9'].map(key => (
                <button key={key} onClick={() => handleKey(key)}
                  className="flex-1 h-16 rounded-lg font-bold text-2xl text-gray-800 border-2 border-sky-400 shadow-sm transition-colors"
                  style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                  {key}
                </button>
              ))}
              <button onClick={handleEnter}
                className="flex-1 h-16 rounded-lg font-bold text-lg text-gray-800 border-2 border-green-500 shadow-sm transition-colors"
                style={{ background: 'linear-gradient(180deg, #c5e8a0, #a8d86e)' }}>
                Prijava
              </button>
            </div>
            {/* 4-5-6 */}
            <div className="flex gap-3 mb-3">
              {['4', '5', '6'].map(key => (
                <button key={key} onClick={() => handleKey(key)}
                  className="flex-1 h-16 rounded-lg font-bold text-2xl text-gray-800 border-2 border-sky-400 shadow-sm transition-colors"
                  style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                  {key}
                </button>
              ))}
              <div className="flex-1" /> {/* empty space */}
            </div>
            {/* 1-2-3 */}
            <div className="flex gap-3 mb-3">
              {['1', '2', '3'].map(key => (
                <button key={key} onClick={() => handleKey(key)}
                  className="flex-1 h-16 rounded-lg font-bold text-2xl text-gray-800 border-2 border-sky-400 shadow-sm transition-colors"
                  style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                  {key}
                </button>
              ))}
              <div className="flex-1" />
            </div>
            {/* 0 - del - C */}
            <div className="flex gap-3">
              <button onClick={() => handleKey('0')}
                className="flex-1 h-16 rounded-lg font-bold text-2xl text-gray-800 border-2 border-sky-400 shadow-sm transition-colors"
                style={{ background: 'linear-gradient(180deg, #b3e0f2, #87ceeb)' }}>
                0
              </button>
              <button onClick={handleBackspace}
                className="flex-1 h-16 rounded-lg font-bold text-lg text-white border-2 border-red-400 shadow-sm transition-colors"
                style={{ background: 'linear-gradient(180deg, #f5a0a0, #e06060)' }}>
                del
              </button>
              <button onClick={handleClear}
                className="flex-1 h-16 rounded-lg font-bold text-lg text-white border-2 border-red-500 shadow-sm transition-colors"
                style={{ background: 'linear-gradient(180deg, #f08080, #d04040)' }}>
                C
              </button>
              <div className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* POS Terminal button */}
      {onOpenTerminal && (
        <button onClick={onOpenTerminal}
          className="absolute bottom-3 right-4 z-20 flex items-center gap-2 bg-gray-800/80 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors backdrop-blur border border-gray-600">
          POS Terminal
        </button>
      )}

      <p className="relative z-10 text-center text-xs text-gray-500 py-2">
        TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
      </p>
    </div>
  );
};

export default LoginScreen;
