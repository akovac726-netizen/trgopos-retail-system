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

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 50%, #d4eaf7 70%, #4aa3df 85%, #2980b9 100%)' }}>
      {/* Decorative blue triangles */}
      <div className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: '400px solid transparent', borderTop: '300px solid #3498db', opacity: 0.3 }} />
      <div className="absolute bottom-0 right-0 w-0 h-0" style={{ borderLeft: '600px solid transparent', borderBottom: '400px solid #2980b9', opacity: 0.4 }} />
      <div className="absolute bottom-0 left-1/3 w-0 h-0" style={{ borderRight: '300px solid transparent', borderBottom: '200px solid #5dade2', opacity: 0.3 }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-4">
        {/* Left - System buttons */}
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <RotateCcw className="w-5 h-5" />
            Restart
          </button>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors">
            <Power className="w-5 h-5" />
            Turn off
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
          <button onClick={() => handleModeSwitch('trgopos')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'trgopos' ? 'bg-sky-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            TrgoPOS
          </button>
          <button onClick={() => handleModeSwitch('backoffice')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'backoffice' ? 'bg-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            BackOffice
          </button>
        </div>
      </div>

      {/* Logo */}
      <div className="relative z-10 text-center mt-4 mb-4">
        <h2 className="text-5xl font-black tracking-wide">
          <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
          <span className="text-orange-400 text-4xl ml-1">★</span>
        </h2>
        <p className="text-gray-600 font-bold text-base mt-1 tracking-widest">
          {mode === 'trgopos' ? 'TrgoPOS' : 'BackOffice'}
        </p>
      </div>

      {/* Input fields */}
      <div className="relative z-10 max-w-lg mx-auto w-full px-6 space-y-2 mb-4">
        <input type="text" value={username} readOnly onClick={() => setActiveField('username')}
          placeholder="Uporabniško ime"
          className={`w-full h-12 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-base border-2 rounded ${activeField === 'username' ? 'border-sky-400' : 'border-gray-200'}`}
        />
        <input type="password" value={password} readOnly onClick={() => setActiveField('password')}
          placeholder="Geslo"
          className={`w-full h-12 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-base border-2 rounded ${activeField === 'password' ? 'border-sky-400' : 'border-gray-200'}`}
        />
      </div>

      {/* Numeric keypad only */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-4">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 inline-flex flex-col gap-2">
          {numKeys.map((row, ri) => (
            <div key={ri} className="flex gap-2">
              {row.map(key => (
                <button key={key} onClick={() => handleKey(key)}
                  className="w-16 h-14 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
                  {key}
                </button>
              ))}
            </div>
          ))}
          {/* Bottom row: 0, comma, backspace */}
          <div className="flex gap-2">
            <button onClick={() => handleKey('0')}
              className="w-16 h-14 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
              0
            </button>
            <button onClick={() => handleKey(',')}
              className="w-16 h-14 bg-gray-200 hover:bg-gray-300 border border-gray-400 rounded-lg font-bold text-2xl text-gray-700 transition-colors">
              ,
            </button>
            <button onClick={handleBackspace}
              className="w-16 h-14 bg-red-500 hover:bg-red-600 border border-red-600 rounded-lg flex items-center justify-center transition-colors">
              <Delete className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* POTRDI button */}
        <button onClick={handleEnter}
          className="w-[216px] h-14 bg-white hover:bg-gray-50 border-2 border-gray-400 rounded-lg font-bold text-xl text-gray-700 flex items-center justify-center gap-2 transition-colors">
          <span className="text-xl">↵</span> POTRDI
        </button>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-center text-xs text-gray-500 mt-auto py-2">
        TrgoPOS © 2026 StandBuy s. p., vse pavice pridržane
      </p>
    </div>
  );
};

export default LoginScreen;
