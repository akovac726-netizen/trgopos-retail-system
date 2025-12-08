import { useState, useMemo } from "react";
import { ArrowLeft, Calendar, User, TrendingUp, Receipt, CreditCard, Banknote, Filter } from "lucide-react";
import { Transaction, Cashier } from "@/types/pos";

interface SalesReportsProps {
  transactions: Transaction[];
  cashiers: Cashier[];
  onBack: () => void;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const SalesReports = ({ transactions, cashiers, onBack }: SalesReportsProps) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [cashierFilter, setCashierFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.filter(t => {
      const transDate = new Date(t.timestamp);
      
      // Date filter
      let dateMatch = true;
      switch (dateFilter) {
        case 'today':
          dateMatch = transDate >= startOfDay;
          break;
        case 'yesterday':
          dateMatch = transDate >= startOfYesterday && transDate < startOfDay;
          break;
        case 'week':
          dateMatch = transDate >= startOfWeek;
          break;
        case 'month':
          dateMatch = transDate >= startOfMonth;
          break;
        case 'all':
          dateMatch = true;
          break;
      }

      // Cashier filter
      const cashierMatch = cashierFilter === 'all' || t.cashierId === cashierFilter;

      return dateMatch && cashierMatch;
    });
  }, [transactions, dateFilter, cashierFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const cashPayments = filteredTransactions.filter(t => t.paymentMethod === 'gotovina');
    const cardPayments = filteredTransactions.filter(t => t.paymentMethod === 'kartica');
    const cashTotal = cashPayments.reduce((sum, t) => sum + t.total, 0);
    const cardTotal = cardPayments.reduce((sum, t) => sum + t.total, 0);
    const totalItems = filteredTransactions.reduce((sum, t) => 
      sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const totalDiscount = filteredTransactions.reduce((sum, t) => sum + t.discount, 0);

    return {
      totalRevenue,
      totalTransactions,
      avgTransaction,
      cashTotal,
      cardTotal,
      cashCount: cashPayments.length,
      cardCount: cardPayments.length,
      totalItems,
      totalDiscount
    };
  }, [filteredTransactions]);

  const cashierStats = useMemo(() => {
    const statsByCashier: Record<string, { name: string; total: number; count: number }> = {};
    
    filteredTransactions.forEach(t => {
      if (!statsByCashier[t.cashierId]) {
        statsByCashier[t.cashierId] = { name: t.cashierName, total: 0, count: 0 };
      }
      statsByCashier[t.cashierId].total += t.total;
      statsByCashier[t.cashierId].count += 1;
    });

    return Object.entries(statsByCashier).map(([id, data]) => ({
      id,
      ...data
    }));
  }, [filteredTransactions]);

  const dateFilterOptions: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Danes' },
    { value: 'yesterday', label: 'Včeraj' },
    { value: 'week', label: 'Zadnji teden' },
    { value: 'month', label: 'Ta mesec' },
    { value: 'all', label: 'Vse' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Poročila prodaje</h1>
            <p className="text-muted-foreground">Pregled prometa in statistike</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="pos-panel p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Obdobje:</span>
            <div className="flex gap-1">
              {dateFilterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDateFilter(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    dateFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">Blagajnik:</span>
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg bg-muted border-0 outline-none"
            >
              <option value="all">Vsi blagajniki</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="pos-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Skupni promet</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</p>
        </div>

        <div className="pos-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Transakcije</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
          <p className="text-sm text-muted-foreground">Povprečno: {stats.avgTransaction.toFixed(2)} €</p>
        </div>

        <div className="pos-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-muted-foreground">Gotovina</span>
          </div>
          <p className="text-2xl font-bold">{stats.cashTotal.toFixed(2)} €</p>
          <p className="text-sm text-muted-foreground">{stats.cashCount} transakcij</p>
        </div>

        <div className="pos-panel p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-muted-foreground">Kartica</span>
          </div>
          <p className="text-2xl font-bold">{stats.cardTotal.toFixed(2)} €</p>
          <p className="text-sm text-muted-foreground">{stats.cardCount} transakcij</p>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="pos-panel p-4">
          <h3 className="font-semibold mb-3">Dodatne statistike</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Skupaj artiklov:</span>
              <span className="font-medium">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Skupaj popustov:</span>
              <span className="font-medium text-destructive">-{stats.totalDiscount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <div className="pos-panel p-4">
          <h3 className="font-semibold mb-3">Promet po blagajnikih</h3>
          {cashierStats.length === 0 ? (
            <p className="text-muted-foreground text-sm">Ni podatkov</p>
          ) : (
            <div className="space-y-2">
              {cashierStats.map(cs => (
                <div key={cs.id} className="flex justify-between items-center">
                  <span className="text-muted-foreground">{cs.name}:</span>
                  <div className="text-right">
                    <span className="font-medium">{cs.total.toFixed(2)} €</span>
                    <span className="text-xs text-muted-foreground ml-2">({cs.count} trans.)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="pos-panel p-4 flex-1 overflow-hidden flex flex-col">
        <h3 className="font-semibold mb-3">Zadnje transakcije</h3>
        <div className="overflow-y-auto flex-1">
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ni transakcij v izbranem obdobju</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2">ID</th>
                  <th className="text-left py-2 px-2">Čas</th>
                  <th className="text-left py-2 px-2">Blagajnik</th>
                  <th className="text-center py-2 px-2">Artikli</th>
                  <th className="text-left py-2 px-2">Plačilo</th>
                  <th className="text-right py-2 px-2">Znesek</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 20).map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-2 font-mono">{t.id}</td>
                    <td className="py-2 px-2">
                      {new Date(t.timestamp).toLocaleString('sl-SI', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-2">{t.cashierName}</td>
                    <td className="py-2 px-2 text-center">
                      {t.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.paymentMethod === 'gotovina' 
                          ? 'bg-emerald-500/20 text-emerald-600' 
                          : 'bg-blue-500/20 text-blue-600'
                      }`}>
                        {t.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-medium">{t.total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;
