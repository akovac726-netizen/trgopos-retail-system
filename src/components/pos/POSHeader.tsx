import { User, Clock, Settings, LogOut, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Cashier } from "@/types/pos";

interface POSHeaderProps {
  cashier: Cashier | null;
  onLogout: () => void;
}

const POSHeader = ({ cashier, onLogout }: POSHeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sl-SI', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sl-SI', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const isAdmin = cashier?.role === 'admin';

  return (
    <header className="bg-card border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">TrgoPOS</h1>
            <p className="text-xs text-muted-foreground">Blagajniški sistem</p>
          </div>
        </div>

        {/* Center - Date and time */}
        <div className="text-center">
          <p className="font-mono text-2xl font-bold">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground capitalize">{formatDate(currentTime)}</p>
        </div>

        {/* Right - User info and actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
            <User className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{cashier?.name || 'Blagajnik'}</p>
                {isAdmin && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-500/20 text-violet-600 rounded text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Koda: {cashier?.id || '-'}</p>
            </div>
          </div>
          
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
            title="Odjava"
          >
            <LogOut className="w-5 h-5 text-destructive" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default POSHeader;
