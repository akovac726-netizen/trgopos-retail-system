import { useState } from "react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import { Power, RotateCcw, Delete } from "lucide-react";

type AppMode = 'trgopos' | 'backoffice';

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
  onBackOfficeLogin: (role: 'admin' | 'shop') => void;
}

const LoginScreen = ({ cashiers, onLogin, onBackOfficeLogin }: LoginScreenProps) => {
  const [mode, setMode] = useState<AppMode>('trgopos');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');
  const [capsLock, setCapsLock] = useState(false);

  const handleKey = (key: string) => {
    const char = capsLock ? key.toUpperCase() : key;
    if (activeField === 'username') {
      setUsername(prev => prev + char);
    } else {
      setPassword(prev => prev + char);
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

  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['y', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  // BackOffice login - dark themed matching the image
  if (mode === 'backoffice') {
    return (
      <div className="h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #3a3a3a 0%, #1a1a1a 50%, #0d0d0d 100%)' }}>
        {/* Water droplet decorations */}
        <div className="absolute top-8 left-12 w-6 h-8 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
        <div className="absolute top-20 right-20 w-10 h-14 rounded-full bg-gradient-to-b from-white/8 to-white/3 blur-sm" />
        <div className="absolute bottom-16 right-32 w-16 h-20 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-md" />
        <div className="absolute bottom-32 left-24 w-4 h-5 rounded-full bg-gradient-to-b from-white/10 to-white/5 blur-sm" />
        <div className="absolute top-1/3 left-8 w-3 h-4 rounded-full bg-gradient-to-b from-white/8 to-transparent" />

        {/* Mode selector top right */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-black/40 backdrop-blur rounded-lg px-1 py-1 border border-gray-600">
          <button onClick={() => handleModeSwitch('trgopos')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-gray-400 hover:text-gray-200">
            TrgoPOS
          </button>
          <button
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-violet-600 text-white shadow">
            BackOffice
          </button>
        </div>

        {/* System buttons top left */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
          <button className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <Power className="w-4 h-4" />
            Turn off
          </button>
        </div>

        {/* Main card */}
        <div className="relative z-10 w-[480px] bg-gradient-to-b from-gray-700/90 to-gray-800/95 border border-gray-500/50 rounded-2xl p-8 shadow-2xl">
          {/* Admin icon */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 bg-gray-800 border-2 border-gray-500 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="32" cy="20" r="8" />
                <path d="M20 44c0-8 5-14 12-14s12 6 12 14" />
                <circle cx="32" cy="32" r="28" />
                <circle cx="14" cy="14" r="3" />
                <circle cx="50" cy="14" r="3" />
                <circle cx="14" cy="50" r="3" />
                <circle cx="50" cy="50" r="3" />
                <circle cx="8" cy="32" r="3" />
                <circle cx="56" cy="32" r="3" />
                <line x1="14" y1="14" x2="50" y2="14" />
                <line x1="50" y1="14" x2="56" y2="32" />
                <line x1="56" y1="32" x2="50" y2="50" />
                <line x1="50" y1="50" x2="14" y2="50" />
                <line x1="14" y1="50" x2="8" y2="32" />
                <line x1="8" y1="32" x2="14" y2="14" />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-white font-bold text-xl mb-6">TrgoPOS - BackOffice</h2>

          {/* Input fields */}
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onClick={() => setActiveField('username')}
              placeholder="Uporabniško ime:"
              className={`w-full h-11 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded ${activeField === 'username' ? 'border-sky-400 ring-1 ring-sky-400' : 'border-gray-500'}`}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onClick={() => setActiveField('password')}
              placeholder="Geslo:"
              className={`w-full h-11 px-4 bg-gray-400/80 text-gray-900 font-medium placeholder:text-gray-600 focus:outline-none text-sm border rounded ${activeField === 'password' ? 'border-sky-400 ring-1 ring-sky-400' : 'border-gray-500'}`}
            />
          </div>

          {/* PRIJAVA button */}
          <div className="flex justify-center mb-6">
            <button onClick={handleEnter}
              className="px-10 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg rounded-lg transition-colors shadow-lg">
              PRIJAVA
            </button>
          </div>

          {/* StandBuy logo */}
          <div className="text-center mb-6">
            <h3 className="text-4xl font-black tracking-wide">
              <span className="text-teal-400">Stand</span><span className="text-teal-500">Buy</span>
              <span className="text-orange-400 text-3xl ml-1">★</span>
            </h3>
          </div>

          {/* Bottom buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => { setUsername('StandBuyAdmin'); setPassword(''); setActiveField('password'); }}
              className="px-8 py-2 bg-transparent border-2 border-gray-400 text-gray-200 rounded-full font-medium text-sm hover:bg-gray-600/50 transition-colors">
              Direktor
            </button>
            <button
              onClick={() => { setUsername('StandBuy.si'); setPassword(''); setActiveField('password'); }}
              className="px-8 py-2 bg-transparent border-2 border-gray-400 text-gray-200 rounded-full font-medium text-sm hover:bg-gray-600/50 transition-colors">
              Poslovalnica
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-500">
          TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
        </p>
      </div>
    );
  }

  // TrgoPOS login - blue gradient with numeric keypad + QWERTY
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 50%, #d4eaf7 70%, #4aa3df 85%, #2980b9 100%)' }}>
      <div className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: '400px solid transparent', borderTop: '300px solid #3498db', opacity: 0.3 }} />
      <div className="absolute bottom-0 right-0 w-0 h-0" style={{ borderLeft: '600px solid transparent', borderBottom: '400px solid #2980b9', opacity: 0.4 }} />
      <div className="absolute bottom-0 left-1/3 w-0 h-0" style={{ borderRight: '300px solid transparent', borderBottom: '200px solid #5dade2', opacity: 0.3 }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-3">
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors">
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors">
            <Power className="w-4 h-4" /> Turn off
          </button>
        </div>
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
          <button className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-sky-500 text-white shadow">
            TrgoPOS
          </button>
          <button onClick={() => handleModeSwitch('backoffice')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700">
            BackOffice
          </button>
        </div>
      </div>

      {/* Logo */}
      <div className="relative z-10 text-center mt-2 mb-2">
        <h2 className="text-4xl font-black tracking-wide">
          <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
          <span className="text-orange-400 text-3xl ml-1">★</span>
        </h2>
        <p className="text-gray-600 font-bold text-sm mt-1 tracking-widest">TrgoPOS</p>
      </div>

      {/* Input fields */}
      <div className="relative z-10 max-w-md mx-auto w-full px-6 space-y-2 mb-2">
        <input type="text" value={username} readOnly onClick={() => setActiveField('username')}
          placeholder="Uporabniško ime"
          className={`w-full h-10 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-sm border-2 rounded ${activeField === 'username' ? 'border-sky-400' : 'border-gray-200'}`}
        />
        <input type="password" value={password} readOnly onClick={() => setActiveField('password')}
          placeholder="Geslo"
          className={`w-full h-10 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-sm border-2 rounded ${activeField === 'password' ? 'border-sky-400' : 'border-gray-200'}`}
        />
      </div>

      {/* Numeric keypad */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 mb-2">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 inline-flex flex-col gap-1.5">
          {numKeys.map((row, ri) => (
            <div key={ri} className="flex gap-1.5">
              {row.map(key => (
                <button key={key} onClick={() => handleKey(key)}
                  className="w-14 h-11 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-xl text-gray-700 transition-colors">
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex gap-1.5">
            <button onClick={() => handleKey('0')}
              className="w-14 h-11 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-xl text-gray-700 transition-colors">
              0
            </button>
            <button onClick={() => handleKey(',')}
              className="w-14 h-11 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-xl text-gray-700 transition-colors">
              ,
            </button>
            <button onClick={handleBackspace}
              className="w-14 h-11 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
              <Delete className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <button onClick={handleEnter}
          className="w-[196px] h-11 bg-white hover:bg-gray-50 border-2 border-gray-400 rounded-lg font-bold text-lg text-gray-700 flex items-center justify-center gap-2 transition-colors">
          <span className="text-lg">↵</span> POTRDI
        </button>
      </div>

      <p className="relative z-10 text-center text-xs text-gray-500 mt-auto py-2">
        TrgoPOS © 2026 StandBuy s. p., vse pravice pridržane
      </p>
    </div>
  );
};

export default LoginScreen;
