import { useState } from "react";
import { User, Lock, LogIn, Monitor, Briefcase, Delete } from "lucide-react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";

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

  // BackOffice login state
  const [boUsername, setBoUsername] = useState("");
  const [boPassword, setBoPassword] = useState("");

  // On-screen keyboard handlers for TrgoPOS
  const handleAlphaKey = (key: string) => {
    const char = isShift ? key.toUpperCase() : key;
    setUsername(prev => prev + char);
  };

  const handleNumKey = (key: string) => {
    setPassword(prev => prev + key);
  };

  const handleBackspace = () => {
    // Remove from password first, then username
    if (password.length > 0) {
      setPassword(prev => prev.slice(0, -1));
    } else {
      setUsername(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setPassword("");
    setUsername("");
  };

  const handleTrgoPOSLogin = () => {
    // Find cashier by id (username) and check password
    const cashier = cashiers.find(c => c.id === username);
    if (cashier && password === cashier.password) {
      onLogin(cashier);
      toast.success(`Dobrodošli, ${cashier.name}!`);
    } else {
      toast.error('Napačno uporabniško ime ali geslo');
      setPassword("");
    }
  };

  const handleDrawerOpen = () => {
    // Find cashier and verify drawer code
    const cashier = cashiers.find(c => c.id === username);
    if (cashier && password === cashier.drawerCode) {
      toast.success('Blagajniški predal odprt');
    } else {
      toast.error('Napačna koda za predal');
    }
  };

  const handleBackOfficeLogin = () => {
    if (boUsername === 'StandBuyAdmin' && boPassword === 'Admin12273') {
      onBackOfficeLogin('admin');
      toast.success('Dobrodošli v BackOffice (Direktor)!');
    } else if (boUsername === 'StandBuy.si' && boPassword === 'TR122732207') {
      onBackOfficeLogin('shop');
      toast.success('Dobrodošli v BackOffice (Trgovina)!');
    } else {
      toast.error('Napačno uporabniško ime ali geslo');
      setBoPassword("");
    }
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setUsername("");
    setPassword("");
    setBoUsername("");
    setBoPassword("");
    setIsShift(false);
  };

  const alphaRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', '<', '>'],
  ];

  const numKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0'],
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-between bg-gradient-to-b from-primary via-primary/80 to-background pb-4 pt-6">
      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 mb-2">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur rounded-full px-4 py-2 border border-border/50">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono text-sm tracking-wider text-muted-foreground">
            {'●'.repeat(password.length || 7)}
          </span>
        </div>
        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-card/80 backdrop-blur rounded-full px-1 py-1 border border-border/50">
          <button
            onClick={() => handleModeSwitch('trgopos')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === 'trgopos'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleModeSwitch('backoffice')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === 'backoffice'
                ? 'bg-violet-600 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            BackOffice
          </button>
        </div>
      </div>

      {/* Logo & Welcome */}
      <div className="text-center mb-4">
        <h2 className="text-primary-foreground font-black text-2xl tracking-wide">
          StandBuy<span className="text-yellow-400">✦</span>
        </h2>
        <p className="text-primary-foreground/70 text-xs uppercase tracking-widest mt-1">
          {mode === 'trgopos' ? 'TRGOPOS STANDBUY' : 'BACKOFFICE STANDBUY'}
        </p>
        <h1 className="text-3xl font-bold text-primary-foreground mt-2">Dobrodošli nazaj</h1>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl bg-card rounded-t-3xl shadow-2xl flex-1 flex flex-col px-6 pt-8 pb-4 overflow-auto">
        {mode === 'trgopos' ? (
          <>
            {/* Input fields */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 border border-border">
                <User className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  readOnly
                  placeholder="Uporabniško ime"
                  className="flex-1 bg-transparent text-foreground font-medium placeholder:text-muted-foreground focus:outline-none text-base"
                />
                <div className="w-0.5 h-6 bg-primary animate-pulse" />
              </div>
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3 border border-border">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  readOnly
                  placeholder="Geslo"
                  className="flex-1 bg-transparent text-foreground font-medium placeholder:text-muted-foreground focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={handleTrgoPOSLogin}
                disabled={!username || !password}
                className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors shadow-md"
              >
                <LogIn className="w-5 h-5" />
                Prijava
              </button>
              <button
                onClick={handleDrawerOpen}
                disabled={!username || !password}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors shadow-md"
              >
                <Monitor className="w-5 h-5" />
                Blagajniški predal
              </button>
            </div>

            {/* On-screen keyboard */}
            <div className="flex gap-2 flex-1">
              {/* Alpha keyboard */}
              <div className="flex-1 flex flex-col gap-1.5">
                {alphaRows.map((row, ri) => (
                  <div key={ri} className="flex gap-1 justify-center">
                    {row.map(key => (
                      <button
                        key={key}
                        onClick={() => handleAlphaKey(key)}
                        className="h-11 min-w-[2.5rem] flex-1 bg-muted hover:bg-muted/70 rounded-lg font-semibold text-foreground transition-colors text-sm"
                      >
                        {isShift ? key.toUpperCase() : key}
                      </button>
                    ))}
                    {ri === 0 && (
                      <button
                        onClick={handleBackspace}
                        className="h-11 min-w-[2.5rem] flex-1 bg-muted hover:bg-muted/70 rounded-lg flex items-center justify-center text-foreground transition-colors"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                    {ri === 1 && (
                      <button
                        onClick={handleTrgoPOSLogin}
                        disabled={!username || !password}
                        className="h-11 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs disabled:opacity-40 transition-colors"
                      >
                        ENTER
                      </button>
                    )}
                  </div>
                ))}
                {/* Bottom row: SHIFT + SPACE + SHIFT */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsShift(!isShift)}
                    className={`h-11 px-4 rounded-lg font-bold text-xs transition-colors ${
                      isShift ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'
                    }`}
                  >
                    SHIFT
                  </button>
                  <button
                    onClick={() => setUsername(prev => prev + ' ')}
                    className="h-11 flex-1 bg-muted hover:bg-muted/70 rounded-lg font-semibold text-foreground text-xs transition-colors"
                  >
                    SPACE
                  </button>
                  <button
                    onClick={() => setIsShift(!isShift)}
                    className={`h-11 px-4 rounded-lg font-bold text-xs transition-colors ${
                      isShift ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'
                    }`}
                  >
                    SHIFT
                  </button>
                </div>
              </div>

              {/* Numeric keypad */}
              <div className="w-32 flex flex-col gap-1.5">
                {numKeys.map((row, ri) => (
                  <div key={ri} className="flex gap-1">
                    {row.map(key => (
                      <button
                        key={key}
                        onClick={() => handleNumKey(key)}
                        className={`h-11 flex-1 rounded-lg font-bold text-white transition-colors text-lg ${
                          key === '0' ? 'bg-primary hover:bg-primary/90' : 'bg-primary hover:bg-primary/90'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                    {ri === 3 && (
                      <button
                        onClick={handleClear}
                        className="h-11 flex-1 bg-destructive hover:bg-destructive/90 rounded-lg font-bold text-white text-xs transition-colors"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* BackOffice Login */
          <div className="space-y-6 max-w-sm mx-auto w-full">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Uporabniško ime
                </label>
                <input
                  type="text"
                  value={boUsername}
                  onChange={(e) => setBoUsername(e.target.value)}
                  className="w-full h-12 px-4 bg-muted rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 border border-border"
                  placeholder="Vnesite uporabniško ime"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Geslo
                </label>
                <input
                  type="password"
                  value={boPassword}
                  onChange={(e) => setBoPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-muted rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 border border-border"
                  placeholder="Vnesite geslo"
                  onKeyDown={(e) => e.key === 'Enter' && handleBackOfficeLogin()}
                />
              </div>
            </div>
            <button
              onClick={handleBackOfficeLogin}
              disabled={!boUsername || !boPassword}
              className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Prijava v BackOffice
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-2">Login Screen TrgoPOS StandBuy</p>
    </div>
  );
};

export default LoginScreen;
