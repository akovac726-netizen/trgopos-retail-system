import { useState } from "react";
import { User, Lock, LogIn, Monitor, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";

type AppMode = 'trgopos' | 'backoffice';

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
  onBackOfficeLogin: () => void;
}

const LoginScreen = ({ cashiers, onLogin, onBackOfficeLogin }: LoginScreenProps) => {
  const [mode, setMode] = useState<AppMode>('trgopos');
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);

  // BackOffice login state
  const [boUsername, setBoUsername] = useState("");
  const [boPassword, setBoPassword] = useState("");

  const handleKeyPress = (key: string) => {
    if (mode === 'trgopos') {
      if (step === 'username') {
        if (username.length < 4) setUsername(prev => prev + key);
      } else {
        if (password.length < 4) setPassword(prev => prev + key);
      }
    }
  };

  const handleDelete = () => {
    if (mode === 'trgopos') {
      if (step === 'username') {
        setUsername(prev => prev.slice(0, -1));
      } else {
        setPassword(prev => prev.slice(0, -1));
      }
    }
  };

  const handleConfirm = () => {
    if (mode === 'trgopos') {
      if (step === 'username') {
        const cashier = cashiers.find(c => c.id === username);
        if (cashier) {
          setSelectedCashier(cashier);
          setStep('password');
        } else {
          toast.error('Napačna uporabniška koda');
          setUsername("");
        }
      } else {
        if (selectedCashier && password === selectedCashier.password) {
          onLogin(selectedCashier);
          toast.success(`Dobrodošli, ${selectedCashier.name}!`);
        } else {
          toast.error('Napačno geslo');
          setPassword("");
        }
      }
    }
  };

  const handleBack = () => {
    setStep('username');
    setPassword("");
    setSelectedCashier(null);
  };

  const handleBackOfficeLogin = () => {
    if (boUsername === 'StandBuy' && boPassword === 'SI1227325') {
      onBackOfficeLogin();
      toast.success('Dobrodošli v BackOffice!');
    } else {
      toast.error('Napačno uporabniško ime ali geslo');
      setBoPassword("");
    }
  };

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
    setStep('username');
    setUsername("");
    setPassword("");
    setSelectedCashier(null);
    setBoUsername("");
    setBoPassword("");
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Mode selector - top left style */}
        <div className="flex items-center gap-2 mb-6 bg-card rounded-xl p-1.5 border border-border">
          <button
            onClick={() => handleModeSwitch('trgopos')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              mode === 'trgopos'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>TrgoPOS</span>
          </button>
          <button
            onClick={() => handleModeSwitch('backoffice')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              mode === 'backoffice'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span>BackOffice</span>
          </button>
        </div>

        <div className="pos-panel p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${
              mode === 'trgopos' ? 'bg-primary' : 'bg-violet-600'
            }`}>
              <span className="text-primary-foreground font-bold text-3xl">
                {mode === 'trgopos' ? 'T' : 'B'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'trgopos' ? 'TrgoPOS' : 'BackOffice'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'trgopos' ? 'Blagajniški sistem' : 'Administrativni sistem'}
            </p>
          </div>

          {/* TrgoPOS Login */}
          {mode === 'trgopos' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  {step === 'username' ? (
                    <>
                      <User className="w-4 h-4" />
                      Uporabniška koda (4 mesta)
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Geslo (4 mesta)
                    </>
                  )}
                </label>
                
                <div className="bg-muted rounded-lg p-4 text-center">
                  <span className="font-mono text-3xl tracking-widest">
                    {step === 'username' 
                      ? username.padEnd(4, '○')
                      : '●'.repeat(password.length) + '○'.repeat(4 - password.length)
                    }
                  </span>
                </div>

                {step === 'password' && selectedCashier && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Blagajnik: {selectedCashier.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {numpadKeys.map((key, index) => (
                  <button
                    key={index}
                    onClick={() => key && handleKeyPress(key)}
                    disabled={!key}
                    className={`h-14 rounded-lg font-bold text-xl transition-colors ${
                      key 
                        ? 'bg-muted hover:bg-muted/80 text-foreground' 
                        : 'invisible'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {step === 'password' ? (
                  <button
                    onClick={handleBack}
                    className="h-12 bg-muted hover:bg-muted/80 rounded-lg font-medium text-foreground transition-colors"
                  >
                    Nazaj
                  </button>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="h-12 bg-muted hover:bg-muted/80 rounded-lg font-medium text-foreground transition-colors"
                  >
                    Briši
                  </button>
                )}
                
                <button
                  onClick={handleConfirm}
                  disabled={(step === 'username' && username.length !== 4) || (step === 'password' && password.length !== 4)}
                  className="h-12 pos-btn-confirm flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <LogIn className="w-5 h-5" />
                  {step === 'username' ? 'Naprej' : 'Prijava'}
                </button>
              </div>
            </div>
          )}

          {/* BackOffice Login */}
          {mode === 'backoffice' && (
            <div className="space-y-6">
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
                    className="w-full h-12 px-4 bg-muted rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full h-12 px-4 bg-muted rounded-lg text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Vnesite geslo"
                    onKeyDown={(e) => e.key === 'Enter' && handleBackOfficeLogin()}
                  />
                </div>
              </div>

              <button
                onClick={handleBackOfficeLogin}
                disabled={!boUsername || !boPassword}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Prijava v BackOffice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
