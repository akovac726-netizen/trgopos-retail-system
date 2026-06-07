import { useState } from "react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import { Delete } from "lucide-react";

type AppMode = 'trgopos' | 'backoffice';

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
  onBackOfficeLogin: (role: 'admin' | 'shop' | 'oddelki' | 'skladisce' | 'nabava' | 'racunovodstvo' | 'prodaja' | 'kadrovska') => void;
  registerId: number;
  registerLocked: boolean;
  onSelectRegister: (id: number) => void;
  onOpenTerminal?: () => void;
}

const LoginScreen = ({ cashiers, onLogin, onBackOfficeLogin, registerId, registerLocked, onSelectRegister, onOpenTerminal }: LoginScreenProps) => {
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const locked = localStorage.getItem('device_locked_mode');
      if (locked === 'backoffice') return 'backoffice';
    } catch { /* noop */ }
    return 'trgopos';
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      // BackOffice login - profili
      if (username === 'ivancnag' && password === 'TR-IVO-001') {
        onBackOfficeLogin('shop');
        toast.success('Dobrodošli v BackOffice (Trgovina Ivančna Gorica)!');
      } else if (username === 'domzale' && password === 'TR-DOM-002') {
        onBackOfficeLogin('shop');
        toast.success('Dobrodošli v BackOffice (Trgovina Domžale)!');
        try { localStorage.setItem('trgopos_shop_label', 'Trgovina Domžale'); } catch (_e) { /* noop */ }
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
      } else if (username === 'StB_PRO' && password === 'PRO;stb56') {
        onBackOfficeLogin('prodaja');
        toast.success('Dobrodošli v BackOffice (Prodaja)!');
      } else if (username === 'StB_KAD' && password === 'KAD;stb78') {
        onBackOfficeLogin('kadrovska');
        toast.success('Dobrodošli v BackOffice (Kadrovska)!');
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

  // ── BackOffice login — retro Windows look (slide 1) ──
  if (mode === 'backoffice') {
    const negoizo = (() => {
      const u = username.toLowerCase();
      if (u.includes('domzale')) return '900002';
      if (u.includes('ivancnag') || u.startsWith('iv')) return '900001';
      return '300083';
    })();
    const userBadge = (() => {
      const u = username.toLowerCase();
      if (u.includes('domzale')) return 'Trgovina Domžale';
      if (u.includes('ivancnag')) return 'Trgovina Ivančna Gorica';
      return 'Trgovina Ivančna Gorica';
    })();
    return (
      <div className="h-screen flex flex-col overflow-hidden select-none"
           style={{ background: '#c8d4e6', fontFamily: '"Tw Cen MT","Century Gothic",system-ui,sans-serif' }}>
        {/* Title bar with clickable mode-switch icon (slika cs) */}
        <div className="h-7 flex items-center justify-between text-white text-xs"
             style={{ background: 'linear-gradient(180deg,#2b3a55 0%,#1a2540 100%)' }}>
          <button
            title="Klik: odkleni / zamenjaj način (POS ↔ BackOffice)"
            onClick={() => {
              try { localStorage.removeItem('device_locked_mode'); } catch { /* noop */ }
              handleModeSwitch('trgopos');
            }}
            className="ml-1 h-6 w-10 flex items-center justify-center border border-white/40 hover:bg-white/20"
            style={{ background: 'linear-gradient(180deg,#b3d1ec,#7aa6c8)' }}
          >
            <span className="text-[#1a2540] font-bold text-sm italic">œ</span>
          </button>
          <div className="flex items-center">
            <span className="px-2 cursor-default">_</span>
            <span className="px-2 cursor-default">▢</span>
            <span className="px-2 font-bold">X</span>
          </div>
        </div>
        {/* Menu bar */}
        <div className="h-7 flex items-center text-sm relative" style={{ background: 'linear-gradient(180deg,#9098a8 0%,#7a8294 100%)', color: '#e8e8e8' }}>
          {/* Nastavitve dropdown */}
          <div className="relative h-full">
            <button onClick={() => setSettingsOpen(o => !o)} className="px-3 h-full hover:bg-white/20">Nastavitve</button>
            {settingsOpen && (
              <div className="absolute top-full left-0 bg-white text-gray-900 border border-gray-500 shadow-xl min-w-[220px] z-50">
                <div className="px-3 py-1 text-xs text-gray-500 border-b">Način te naprave</div>
                {[
                  { key: 'backoffice', label: 'Nastavi kot BackOffice' },
                  { key: 'pos', label: 'Nastavi kot POS' },
                ].map(opt => (
                  <button key={opt.key}
                          onClick={() => { try { localStorage.setItem('device_locked_mode', opt.key); } catch { /* noop */ } setSettingsOpen(false); if (opt.key === 'pos') handleModeSwitch('trgopos'); }}
                          className="block w-full text-left px-4 py-1.5 text-sm hover:bg-blue-600 hover:text-white">{opt.label}</button>
                ))}
                <div className="border-t" />
                <button onClick={() => { try { localStorage.setItem('device_locked_mode', 'backoffice'); } catch { /* noop */ } setSettingsOpen(false); toast.success('BackOffice je zaklenjen na tej napravi'); }}
                        className="block w-full text-left px-4 py-1.5 text-sm hover:bg-blue-600 hover:text-white font-semibold">zakleni BackOffice</button>
                <button onClick={() => { try { localStorage.setItem('device_locked_mode', 'pos'); } catch { /* noop */ } setSettingsOpen(false); handleModeSwitch('trgopos'); toast.success('POS je zaklenjen na tej napravi'); }}
                        className="block w-full text-left px-4 py-1.5 text-sm hover:bg-blue-600 hover:text-white font-semibold">zakleni POS</button>
              </div>
            )}
          </div>
          {['Datoteke','Trgovina','Tiskanje SLO','Orodja','Urniki','Izdaje dopustov','Tiskanje HR'].map(m => (
            <button key={m} className="px-3 h-full hover:bg-white/20">{m}</button>
          ))}
          <div className="ml-auto pr-2">
            <button onClick={() => handleModeSwitch('trgopos')}
                    className="text-xs px-2 py-0.5 bg-black/30 hover:bg-black/50 rounded">↩ TrgoPOS</button>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 min-h-0 flex items-center justify-center" style={{ background: '#c8d4e6' }}>
          <div className="bg-[#d5e0ee] border-2 px-12 py-8" style={{ borderColor: '#1a2540', minWidth: 520 }}>
            <h1 className="text-center font-bold mb-8" style={{ fontSize: 36, color: '#0a0a0a' }}>BackOffice</h1>
            <div className="grid grid-cols-[160px_1fr] gap-y-6 gap-x-4 items-center mb-6">
              <label className="text-sm font-bold" style={{ color: '#0a0a0a' }}>Uporabniško ime:</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') handleEnter(); }}
                     autoFocus
                     className="h-7 px-2 bg-white border text-sm" style={{ borderColor: '#1a2540' }} />
              <label className="text-sm font-bold" style={{ color: '#0a0a0a' }}>Geslo:</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') handleEnter(); }}
                     className="h-7 px-2 bg-white border text-sm" style={{ borderColor: '#1a2540' }} />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={handleEnter}
                      className="px-6 py-1 text-sm border font-medium"
                      style={{ background: 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)', borderColor: '#7a7a7a', color: '#111', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)', minWidth: 80 }}>
                Login
              </button>
              <button onClick={() => { setUsername(''); setPassword(''); }}
                      className="px-6 py-1 text-sm border font-medium"
                      style={{ background: 'linear-gradient(180deg,#f0f0f0 0%,#c8c8c8 100%)', borderColor: '#7a7a7a', color: '#111', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)', minWidth: 80 }}>
                Prekliči
              </button>
            </div>
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="h-6 flex items-center text-xs text-white" style={{ background: 'linear-gradient(180deg,#7a8294 0%,#5a6274 100%)' }}>
          <div className="px-3 h-full flex items-center border-r border-black/20" style={{ background: '#a05858' }}>
            Uporabnik: {userBadge}
          </div>
          <div className="px-3 h-full flex items-center border-r border-black/20" style={{ background: '#5a8a9a' }}>
            Negoizo: {negoizo}
          </div>
          <div className="px-3 h-full flex items-center flex-1">Funkcije:</div>
        </div>
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
