import { useState } from "react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";
import { Power, RotateCcw } from "lucide-react";

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
  const [isShift, setIsShift] = useState(false);
  const [activeField, setActiveField] = useState<'username' | 'password'>('username');

  const handleKey = (key: string) => {
    const char = isShift ? key.toUpperCase() : key;
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

  const handleSpace = () => {
    if (activeField === 'username') setUsername(prev => prev + ' ');
    else setPassword(prev => prev + ' ');
  };

  const handleTab = () => {
    setActiveField(activeField === 'username' ? 'password' : 'username');
  };

  const handleEnter = () => {
    if (mode === 'trgopos') {
      handleTrgoPOSLogin();
    } else {
      handleBackOfficeLogin();
    }
  };

  const handleTrgoPOSLogin = () => {
    const cashier = cashiers.find(c => c.id === username);
    if (cashier && password === cashier.password) {
      onLogin(cashier);
      toast.success(`Dobrodošli, ${cashier.name}!`);
    } else {
      toast.error('Napačno uporabniško ime ali geslo');
      setPassword("");
    }
  };

  const handleBackOfficeLogin = () => {
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
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setUsername("");
    setPassword("");
    setIsShift(false);
    setActiveField('username');
  };

  const numberRow = ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'];
  const shiftNumberRow = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'];

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 30%, #fff 50%, #d4eaf7 70%, #4aa3df 85%, #2980b9 100%)' }}>
      {/* Decorative blue triangles */}
      <div className="absolute top-0 right-0 w-0 h-0" style={{ borderLeft: '400px solid transparent', borderTop: '300px solid #3498db', opacity: 0.3 }} />
      <div className="absolute bottom-0 right-0 w-0 h-0" style={{ borderLeft: '600px solid transparent', borderBottom: '400px solid #2980b9', opacity: 0.4 }} />
      <div className="absolute bottom-0 left-1/3 w-0 h-0" style={{ borderRight: '300px solid transparent', borderBottom: '200px solid #5dade2', opacity: 0.3 }} />

      {/* Top bar with mode switch and system buttons */}
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

        {/* Mode selector - top right */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-lg px-1 py-1 border border-gray-300">
          <button
            onClick={() => handleModeSwitch('trgopos')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'trgopos' ? 'bg-sky-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            TrgoPOS
          </button>
          <button
            onClick={() => handleModeSwitch('backoffice')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'backoffice' ? 'bg-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            BackOffice
          </button>
        </div>
      </div>

      {/* Logo & Title */}
      <div className="relative z-10 text-center mt-2 mb-3">
        <h2 className="text-5xl font-black tracking-wide">
          <span className="text-sky-500">Stand</span><span className="text-sky-600">Buy</span>
          <span className="text-orange-400 text-4xl ml-1">★</span>
        </h2>
        <p className="text-gray-600 font-bold text-base mt-1 tracking-widest">
          {mode === 'trgopos' ? 'TrgoPOS' : 'BackOffice'}
        </p>
      </div>

      {/* Input fields */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-6 space-y-2 mb-3">
        <input
          type="text"
          value={username}
          readOnly
          onClick={() => setActiveField('username')}
          placeholder="Uporabniško ime"
          className={`w-full h-12 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-base border-2 rounded ${
            activeField === 'username' ? 'border-sky-400' : 'border-gray-200'
          }`}
        />
        <input
          type="password"
          value={password}
          readOnly
          onClick={() => setActiveField('password')}
          placeholder="Geslo"
          className={`w-full h-12 px-4 bg-gray-100 text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none text-base border-2 rounded ${
            activeField === 'password' ? 'border-sky-400' : 'border-gray-200'
          }`}
        />
      </div>

      {/* On-screen keyboard */}
      <div className="relative z-10 flex-1 flex flex-col justify-end pb-2 px-2">
        <div className="bg-white/90 backdrop-blur border border-gray-300 rounded-lg p-2 space-y-1 max-w-4xl mx-auto w-full">
          {/* Number row */}
          <div className="flex gap-1">
            {(isShift ? shiftNumberRow : numberRow).map((key, i) => (
              <button key={i} onClick={() => handleKey(key)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
                {key}
              </button>
            ))}
            <button onClick={handleBackspace}
              className="flex-[1.5] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              backspace
            </button>
          </div>

          {/* Row 1 - QWERTY */}
          <div className="flex gap-1">
            <button onClick={handleTab}
              className="flex-[1.3] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              tab
            </button>
            {row1.map(key => (
              <button key={key} onClick={() => handleKey(key)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
                {isShift ? key.toUpperCase() : key}
              </button>
            ))}
          </div>

          {/* Row 2 - ASDF */}
          <div className="flex gap-1">
            <button onClick={() => {}}
              className="flex-[1.6] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors flex items-center justify-center">
              <span className="text-lg">🔍</span>
            </button>
            {row2.map(key => (
              <button key={key} onClick={() => handleKey(key)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
                {isShift ? key.toUpperCase() : key}
              </button>
            ))}
            <button onClick={handleEnter}
              className="flex-[1.8] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              enter
            </button>
          </div>

          {/* Row 3 - ZXCV */}
          <div className="flex gap-1">
            <button onClick={() => setIsShift(!isShift)}
              className={`flex-[1.8] h-10 border border-gray-300 rounded text-xs font-bold transition-colors ${
                isShift ? 'bg-sky-400 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}>
              shift
            </button>
            {row3.map(key => (
              <button key={key} onClick={() => handleKey(key)}
                className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
                {isShift ? key.toUpperCase() : key}
              </button>
            ))}
            <button onClick={() => setIsShift(!isShift)}
              className={`flex-[1.8] h-10 border border-gray-300 rounded text-xs font-bold transition-colors ${
                isShift ? 'bg-sky-400 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}>
              shift
            </button>
          </div>

          {/* Row 4 - Bottom */}
          <div className="flex gap-1">
            <button className="flex-[1.3] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              ctrl
            </button>
            <button className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              alt
            </button>
            <button onClick={handleSpace}
              className="flex-[6] h-10 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
            </button>
            <button className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              alt
            </button>
            <button className="flex-[1.3] h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors">
              ctrl
            </button>
            <button className="flex-1 h-10 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded text-xs font-bold text-gray-700 transition-colors flex items-center justify-center">
              △
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-center text-xs text-gray-500 py-2">
        TrgoPOS © 2026 StandBuy s. p., vse pavice pridržane
      </p>
    </div>
  );
};

export default LoginScreen;
