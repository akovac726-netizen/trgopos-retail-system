import { User, Clock, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

const POSHeader = () => {
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
              <p className="font-semibold text-sm">Blagajnik 1</p>
              <p className="text-xs text-muted-foreground">Blagajna 01</p>
            </div>
          </div>
          
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 text-destructive" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default POSHeader;
