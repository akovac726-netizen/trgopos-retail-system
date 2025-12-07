import { useState } from "react";
import { User, Lock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Cashier } from "@/types/pos";

interface LoginScreenProps {
  cashiers: Cashier[];
  onLogin: (cashier: Cashier) => void;
}

const LoginScreen = ({ cashiers, onLogin }: LoginScreenProps) => {
  const [step, setStep] = useState<'username' | 'password'>('username');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);

  const handleKeyPress = (key: string) => {
    if (step === 'username') {
      if (username.length < 5) {
        setUsername(prev => prev + key);
      }
    } else {
      if (password.length < 5) {
        setPassword(prev => prev + key);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'username') {
      setUsername(prev => prev.slice(0, -1));
    } else {
      setPassword(prev => prev.slice(0, -1));
    }
  };

  const handleConfirm = () => {
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
  };

  const handleBack = () => {
    setStep('username');
    setPassword("");
    setSelectedCashier(null);
  };

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="pos-panel p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-bold text-3xl">T</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">TrgoPOS</h1>
            <p className="text-muted-foreground">Blagajniški sistem</p>
          </div>

          {/* Login form */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                {step === 'username' ? (
                  <>
                    <User className="w-4 h-4" />
                    Uporabniška koda (5 mest)
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Geslo (5 mest)
                  </>
                )}
              </label>
              
              {/* Display */}
              <div className="bg-muted rounded-lg p-4 text-center">
                <span className="font-mono text-3xl tracking-widest">
                  {step === 'username' 
                    ? username.padEnd(5, '○')
                    : '●'.repeat(password.length) + '○'.repeat(5 - password.length)
                  }
                </span>
              </div>

              {step === 'password' && selectedCashier && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Blagajnik: {selectedCashier.name}
                </p>
              )}
            </div>

            {/* Numpad */}
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

            {/* Action buttons */}
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
                disabled={(step === 'username' && username.length !== 5) || (step === 'password' && password.length !== 5)}
                className="h-12 pos-btn-confirm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <LogIn className="w-5 h-5" />
                {step === 'username' ? 'Naprej' : 'Prijava'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
