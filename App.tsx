import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Calendar, CheckCircle2, 
  AlertCircle, ArrowLeft, Search, Phone, FileText, Send, 
  Trash2, TrendingUp, Wallet, Receipt, Edit, Save, Calculator, Clock,
  Percent, Coins, RefreshCw, Plus, Minus, Settings, Download, Upload, Database, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { TabBar } from './components/TabBar';
import { Client, Debt, Installment, AppData, ViewState, InstallmentStatus } from './types';
import { formatCurrency, formatDate, generateId, calculatePlan } from './utils';

// --- EMPTY INITIAL DATA ---
const INITIAL_DATA: AppData = {
  clients: [],
  debts: []
};

// --- COLORS FOR CHARTS ---
const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export default function App() {
  // --- STATE ---
  const [postponedInfo, setPostponedInfo] = useState<{ date: number; note: string } | null>(null);
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);
  const [summaryPreview, setSummaryPreview] = useState<{ text: string; phone: string } | null>(null);
  
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('debtCollectorData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.clients && parsed.debts) return parsed;
      } catch (e) {
        console.error("Error parsing saved data", e);
      }
    }
    return INITIAL_DATA;
  });

  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');

  // Persist Data to LocalStorage
  useEffect(() => {
    localStorage.setItem('debtCollectorData', JSON.stringify(data));
  }, [data]);

  // --- DATA MANAGEMENT ACTIONS (تم تفعيلها بالكامل) ---
  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debt_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.clients && json.debts) {
          if (confirm('سيتم استبدال البيانات الحالية بالنسخة المرفوعة. هل تريد الاستمرار؟')) {
            setData(json);
            alert('تم استعادة البيانات بنجاح ✅');
          }
        }
      } catch (err) { alert('حدث خطأ أثناء قراءة الملف ❌'); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const resetAppData = () => {
    if (confirm('تحذير نهائي: سيتم حذف جميع العملاء والديون والبيانات نهائياً. هل أنت متأكد؟')) {
      setData({ clients: [], debts: [] });
      setSelectedClientId(null);
      setEditingDebtId(null);
      setCurrentView('DASHBOARD');
      localStorage.removeItem('debtCollectorData');
      alert('تم تصفير التطبيق بنجاح ✅');
    }
  };

  // --- APP ACTIONS ---
  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...client, id: generateId(), createdAt: Date.now() };
    setData(prev => ({ ...prev, clients: [newClient, ...prev.clients] }));
    setCurrentView('CLIENTS_LIST');
  };

  const saveDebt = (debtData: any, isEdit: boolean) => {
    const { id, clientId, itemName, baseValue, profitPercentage, monthCount, startDate, paymentDay, installments } = debtData;
    const finalTotal = installments.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
    const profitVal = finalTotal - Number(baseValue);
    const procInst = installments.map((inst: any) => ({
      ...inst, id: inst.id || generateId(), debtId: isEdit ? id : 'temp', status: inst.status || InstallmentStatus.PENDING
    }));

    if (isEdit) {
       setData(prev => ({
         ...prev, debts: prev.debts.map(d => d.id === id ? {
            ...d, itemName, baseValue, profitPercentage, profitValue: profitVal,
            totalValue: finalTotal, monthCount,
            startDate: new Date(startDate).getTime(), paymentDay,
            installments: procInst
         } : d)
       }));
    } else {
      const newDebt: Debt = {
        id: generateId(), clientId, itemName, baseValue, profitPercentage, profitValue: profitVal,
        totalValue: finalTotal, monthCount,
        startDate: new Date(startDate).getTime(), paymentDay,
        isFullyPaid: false, installments: procInst
      };
      newDebt.installments.forEach(i => i.debtId = newDebt.id);
      setData(prev => ({ ...prev, debts: [newDebt, ...prev.debts] }));
    }
    setSelectedClientId(clientId);
    setCurrentView('CLIENT_DETAILS');
    setEditingDebtId(null);
  };

  const processPayment = (debtId: string, installmentId: string, paidAmount: number, paidDate: number, notes: string, newFutureInstallments: Installment[]) => {
    setData(prev => {
      const newDebts = prev.debts.map(debt => {
        if (debt.id !== debtId) return debt;
        const pastInstallments = debt.installments.filter(i => i.id !== installmentId && (i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.POSTPONED));
        const currentInstallment = debt.installments.find(i => i.id === installmentId);
        if(!currentInstallment) return debt;
        const isPostponed = paidAmount === 0;
        const updatedCurrent: Installment = {
          ...currentInstallment, amount: paidAmount, status: isPostponed ? InstallmentStatus.POSTPONED : InstallmentStatus.PAID,
          paidDate: paidDate, notes: notes
        };
        const allInstallments = [...pastInstallments, updatedCurrent, ...newFutureInstallments].sort((a, b) => a.dueDate - b.dueDate);
        const allPaid = allInstallments.every(i => i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.POSTPONED);
        return { ...debt, installments: allInstallments, isFullyPaid: allPaid, monthCount: allInstallments.length };
      });
      return { ...prev, debts: newDebts };
    });
    setCurrentView('CLIENT_DETAILS');
  };
   
  const openEditClient = (client: Client) => {
    setEditClientName(client.name || '');
    setEditClientPhone((client.phone as any) || '');
    setIsEditClientOpen(true);
  };

  const saveEditClient = () => {
    if (!selectedClientId) return;
    const name = editClientName.trim();
    const phone = editClientPhone.trim();
    if (!name) return alert('الرجاء إدخال اسم العميل');
    setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === selectedClientId ? { ...c, name, phone } : c) }));
    setIsEditClientOpen(false);
  };

  const deleteClient = (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا العميل وجميع ديونه نهائياً؟')) return;
    setData(prev => ({ clients: prev.clients.filter(c => c.id !== id), debts: prev.debts.filter(d => d.clientId !== id) }));
    setSelectedClientId(null);
    setCurrentView('CLIENTS_LIST');
  };

  const deleteDebt = (id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذه المديونية؟')) return;
    setData(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  // --- STATS ---
  const stats = useMemo(() => {
    let tL = 0, tP = 0, tC = 0, tPe = 0;
    data.debts.forEach(debt => {
      tL += debt.baseValue; tP += debt.profitValue;
      debt.installments.forEach(inst => {
        if (inst.status === InstallmentStatus.PAID) tC += inst.amount;
        else if (inst.status !== InstallmentStatus.POSTPONED) tPe += inst.amount;
      });
    });
    return { totalLoaned: tL, totalProfit: tP, totalCollected: tC, totalPending: tPe };
  }, [data.debts]);

  const DashboardView = () => (
    <div className="pb-24 animate-fade-in text-right">
      <header className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">مرحباً بك 👋</h1>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
            <div className="flex items-center gap-2 mb-2 text-blue-600 justify-center"><Wallet size={20} /><span className="text-xs font-semibold">إجمالي الديون</span></div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalLoaned + stats.totalProfit)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-center">
            <div className="flex items-center gap-2 mb-2 text-green-600 justify-center"><CheckCircle2 size={20} /><span className="text-xs font-semibold">تم تحصيله</span></div>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalCollected)}</p>
          </div>
        </div>
      </header>
      <div className="px-4 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 justify-end"><TrendingUp size={18} /> تحليل الأداء</h3>
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'أصل', value: stats.totalLoaned }, { name: 'ربح', value: stats.totalProfit }, { name: 'متبقي', value: stats.totalPending }]} barSize={40}>
                  <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{ [stats.totalLoaned, stats.totalProfit, stats.totalPending].map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />) }</Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const ClientsListView = () => {
    const clientsWithTotals = useMemo(() => {
      return data.clients.map(client => {
        const clientDebts = data.debts.filter(d => d.clientId === client.id);
        const total = clientDebts.reduce((acc, curr) => acc + curr.totalValue, 0);
        const paid = clientDebts.reduce((acc, curr) => acc + curr.installments.filter(i => i.status === InstallmentStatus.PAID).reduce((s, i) => s + i.amount, 0), 0);
        const remaining = total - paid;
        const nextDate = clientDebts.flatMap(d => d.installments).filter(i => i.status === InstallmentStatus.PENDING).sort((a, b) => a.dueDate - b.dueDate)[0]?.dueDate || Infinity;
        return { ...client, total, paid, remaining, nextDate };
      });
    }, [data.clients, data.debts]);

    const filteredClients = useMemo(() => {
      return clientsWithTotals.filter(c => c.name.includes(searchTerm) || c.phone.includes(searchTerm)).sort((a, b) => {
        const aP = a.remaining <= 0; const bP = b.remaining <= 0;
        if (aP && !bP) return 1; if (!aP && bP) return -1;
        if (!aP && !bP) return a.nextDate - b.nextDate; // ترتيب الأقرب سداداً
        return b.remaining - a.remaining;
      });
    }, [clientsWithTotals, searchTerm]);

    return (
      <div className="pb-24 pt-4 px-4 h-full flex flex-col text-right">
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">العملاء</h2><button onClick={() => setCurrentView('ADD_CLIENT')} className="text-blue-600 p-2 bg-blue-50 rounded-full"><UserPlus size={24} /></button></div>
        <div className="relative mb-6"><input type="text" placeholder="بحث..." className="w-full bg-white pl-4 pr-10 py-3 rounded-xl border-none shadow-sm text-sm text-right focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><Search className="absolute right-3 top-3 text-gray-400" size={20} /></div>
        <div className="space-y-3 overflow-y-auto no-scrollbar pb-20">
          {filteredClients.map(client => (
            <div key={client.id} onClick={() => { setSelectedClientId(client.id); setSelectedDebtIds([]); setCurrentView('CLIENT_DETAILS'); }} className={`bg-white p-4 rounded-xl shadow-sm active:scale-[0.99] transition-all cursor-pointer ${client.remaining <= 0 ? 'opacity-50 grayscale border-dashed border-gray-200' : ''}`}>
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold">{client.name}</h3><p className="text-xs text-gray-500">{client.phone}</p>
                {client.remaining > 0 && client.nextDate !== Infinity && (<p className="text-[10px] text-blue-600 font-medium">القادم: {formatDate(client.nextDate)}</p>)}</div>
                <div className="text-left"><span className="block text-xs text-gray-400">المتبقي</span><span className={`font-bold ${client.remaining <= 0 ? 'text-gray-400' : 'text-red-500'}`}>{client.remaining <= 0 ? '0' : formatCurrency(client.remaining)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ClientDetailsView = () => {
    const client = data.clients.find(c => c.id === selectedClientId);
    if (!client) return null;
    const clientDebts = data.debts.filter(d => d.clientId === client.id);

    const toggleDebtSelection = (id: string) => {
      setSelectedDebtIds(prev => prev.includes(id) ? prev.filter(debtId => debtId !== id) : [...prev, id]);
    };

    const handlePrepareSummary = () => {
      const selected = selectedDebtIds.length > 0 ? clientDebts.filter(d => selectedDebtIds.includes(d.id)) : clientDebts;
      let text = `مرحباً ${client.name}،\nإليك ملخص حسابك للمديونيات المحددة:\n\n`;
      let tA = 0, pA = 0;
      selected.forEach(d => {
        const p = d.installments.filter(i => i.status === InstallmentStatus.PAID).reduce((s, i) => s + i.amount, 0);
        text += `📌 *${d.itemName}*\n- إجمالي: ${formatCurrency(d.totalValue)}\n- المتبقي: ${formatCurrency(d.totalValue - p)}\n\n`;
        tA += d.totalValue; pA += p;
      });
      if (selected.length > 1) text += `📊 *الإجمالي العام للمختار:*\n- إجمالي المتبقي: ${formatCurrency(tA - pA)}\n\n`;
      text += `شكراً لتعاملك معنا.`;
      setSummaryPreview({ text, phone: client.phone.replace(/\D/g, '') });
    };

    const sendReceipt = (debt: Debt, inst: Installment, receiptNumber: number) => {
      const tD = clientDebts.reduce((acc, d) => acc + (d.totalValue || 0), 0);
      const tP = clientDebts.reduce((acc, d) => acc + d.installments.filter(i => i.status === InstallmentStatus.PAID).reduce((s, i) => s + (i.amount || 0), 0), 0);
      const message = `سند سداد قسط\nالعميل: ${client.name} \nالمبلغ: ${formatCurrency(inst.amount)}\nالمتبقي الإجمالي: ${formatCurrency(tD - tP)}\nشكراً لسدادكم.`;
      window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
      <div className="pb-24 bg-gray-50 min-h-screen animate-fade-in text-right">
        <div className="bg-white pb-6 pt-4 px-4 rounded-b-3xl shadow-sm sticky top-0 z-10 text-center">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setSelectedClientId(null); setCurrentView('CLIENTS_LIST'); }} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button>
            <h2 className="font-bold text-lg">ملف العميل</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => openEditClient(client)} className="text-blue-600 p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"><Edit size={22} /></button>
              <button onClick={() => deleteClient(client.id)} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors"><Trash2 size={22} /></button>
            </div>
          </div>
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">{client.name.charAt(0)}</div>
          <h1 className="text-xl font-bold">{client.name}</h1>
          <p className="text-gray-500 text-sm mb-4">{client.phone}</p>
          <button onClick={handlePrepareSummary} className="flex items-center gap-2 bg-green-50 text-green-700 px-6 py-2 rounded-xl font-bold mx-auto"><Send size={16} /> كشف حساب</button>
        </div>
        <div className="px-4 mt-6 space-y-6">
           {clientDebts.map(debt => (
             <div key={debt.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${selectedDebtIds.includes(debt.id) ? 'border-blue-500 ring-1' : 'border-gray-100'}`}>
               <div className="p-4 border-b bg-gray-50/50 flex justify-between items-start">
                 <div className="flex items-center gap-3"><input type="checkbox" checked={selectedDebtIds.includes(debt.id)} onChange={() => toggleDebtSelection(debt.id)} className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer" /><div><h4 className="font-bold text-gray-900">{debt.itemName}</h4><p className="text-xs text-gray-500">أصل: {formatCurrency(debt.baseValue)} | ربح: {debt.profitPercentage.toFixed(1)}%</p></div></div>
                 <div className="flex gap-2">
                   <button onClick={() => { setEditingDebtId(debt.id); setCurrentView('EDIT_DEBT'); }} className="p-2 bg-gray-200 text-gray-600 rounded-lg"><Edit size={16} /></button>
                   <button onClick={() => deleteDebt(debt.id)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                 </div>
               </div>
               <div className="divide-y divide-gray-100">
                 {debt.installments.map((inst, idx) => (
                   <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${inst.status === 'PAID' ? 'bg-green-100 text-green-700' : inst.status === InstallmentStatus.POSTPONED ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                       <div><p className="text-sm font-medium">{formatCurrency(inst.amount)}</p><p className="text-xs text-gray-500">{formatDate(inst.dueDate)}</p></div>
                     </div>
                     {inst.status === InstallmentStatus.PAID || inst.status === InstallmentStatus.POSTPONED ? (
                       <div className="flex items-center gap-2">
                         {inst.status === InstallmentStatus.PAID && (<button onClick={() => sendReceipt(debt, inst, idx)} className="text-green-600 bg-green-50 p-1.5 rounded-md hover:bg-green-100"><Receipt size={16} /></button>)}
                         <button onClick={() => inst.status === InstallmentStatus.POSTPONED && setPostponedInfo({ date: inst.dueDate, note: inst.notes || '' })} className={`text-xs font-bold px-2 py-1 rounded-md ${inst.status === InstallmentStatus.POSTPONED ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{inst.status === InstallmentStatus.POSTPONED ? 'تم التأجيل' : 'مدفوع'}</button>
                       </div>
                     ) : (
                       <button onClick={() => { setEditingDebtId(debt.id); setSelectedInstallmentId(inst.id); setCurrentView('RECORD_PAYMENT'); }} className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">تسجيل سداد</button>
                     )}
                   </div>
                 ))}
               </div>
               <div className="p-3 bg-gray-50 border-t border-gray-100 text-center"><div className="flex justify-between items-center text-sm font-bold"><span>الإجمالي:</span><span>{formatCurrency(debt.totalValue)}</span></div></div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  const RecordPaymentView = () => {
    const debt = data.debts.find(d => d.id === editingDebtId);
    const installment = debt?.installments.find(i => i.id === selectedInstallmentId);
    if (!debt || !installment) return null;
    const futurePendingInstallments = useMemo(() => { const currentIndex = debt.installments.findIndex(i => i.id === installment.id); return debt.installments.slice(currentIndex + 1); }, [debt, installment]);
    const [paymentAmount, setPaymentAmount] = useState<number>(installment.amount);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [remainingMonths, setRemainingMonths] = useState<number>(futurePendingInstallments.length);
    const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);
    const totalDebt = debt.totalValue;
    const previouslyPaid = debt.installments.filter(i => i.status === InstallmentStatus.PAID && i.id !== installment.id).reduce((sum, i) => sum + i.amount, 0);
    const balanceAfterThisPayment = totalDebt - previouslyPaid - paymentAmount;

    useEffect(() => {
        if (balanceAfterThisPayment <= 0 && remainingMonths <= 0) { setPreviewInstallments([]); return; }
        const safeMonths = (balanceAfterThisPayment > 1 && remainingMonths === 0) ? 1 : remainingMonths;
        if (safeMonths > 0) {
            const payDateObj = new Date(paymentDate);
            const nextStartDate = new Date(payDateObj.getFullYear(), payDateObj.getMonth() + 1, debt.paymentDay);
            const plan = calculatePlan(Math.max(0, balanceAfterThisPayment), safeMonths, nextStartDate, debt.paymentDay);
            setPreviewInstallments(plan.map(p => ({ ...p, id: generateId(), debtId: debt.id, status: InstallmentStatus.PENDING })));
        }
    }, [paymentAmount, remainingMonths, paymentDate, balanceAfterThisPayment, debt]);

    return (
        <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in text-right">
            <div className="bg-white px-4 pt-6 pb-4 border-b flex items-center sticky top-0 z-20"><button onClick={() => setCurrentView('CLIENT_DETAILS')} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button><h2 className="text-xl font-bold mr-2">تسجيل دفعة</h2></div>
            <div className="p-4 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                    <div><label className="block text-xs text-gray-500 mb-1">المبلغ المدفوع</label><input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-right" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">تاريخ السداد</label><input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-right" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">ملاحظات (سبب التأجيل)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm h-20 resize-none text-right" placeholder="اكتب سبب التأجيل أو ملاحظاتك هنا..." /></div>
                </div>
                {balanceAfterThisPayment > 0 && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border-t-4 border-orange-400">
                        <div className="flex justify-between items-center font-bold text-orange-600"><h3>جدولة المتبقي</h3><span>{formatCurrency(balanceAfterThisPayment)}</span></div>
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"><span className="text-sm font-medium">عدد الأشهر</span><div className="flex items-center gap-4"><button onClick={() => setRemainingMonths(Math.max(1, remainingMonths - 1))} className="w-8 h-8 rounded-full bg-white shadow-sm border flex items-center justify-center text-red-500">-</button><span className="font-bold text-lg">{remainingMonths}</span><button onClick={() => setRemainingMonths(remainingMonths + 1)} className="w-10 h-10 rounded-full bg-white shadow-sm border flex items-center justify-center text-green-600">+</button></div></div>
                        <div className="divide-y">{previewInstallments.map((p, i) => (<div key={i} className="p-2 flex justify-between text-xs bg-white"><span>قسط {i+1}</span><span className="font-bold">{formatCurrency(p.amount)}</span></div>))}</div>
                    </div>
                )}
                <button onClick={() => processPayment(debt.id, installment.id, paymentAmount, new Date(paymentDate).getTime(), notes, previewInstallments)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200">{paymentAmount === 0 ? 'تأكيد التأجيل والجدولة' : 'تأكيد السداد والجدولة'}</button>
            </div>
        </div>
    );
  };

  const DebtFormView = () => {
    const isEditMode = currentView === 'EDIT_DEBT' && !!editingDebtId;
    const existingDebt = isEditMode ? data.debts.find(d => d.id === editingDebtId) : null;
    const [itemName, setItemName] = useState(existingDebt?.itemName || '');
    const [baseValue, setBaseValue] = useState<number | ''>(existingDebt?.baseValue || '');
    const [profitType, setProfitType] = useState<'PERCENTAGE' | 'FIXED'>(existingDebt?.profitPercentage ? 'PERCENTAGE' : 'FIXED');
    const [profitPercentage, setProfitPercentage] = useState<number>(existingDebt?.profitPercentage || 10);
    const [fixedProfit, setFixedProfit] = useState<number | ''>(existingDebt?.profitValue || '');
    const [months, setMonths] = useState<number>(existingDebt?.monthCount || 6);
    const [startDate, setStartDate] = useState(existingDebt ? new Date(existingDebt.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [paymentDay, setPaymentDay] = useState(existingDebt?.paymentDay || 27);
    const [manualInstallments, setManualInstallments] = useState<any[]>(existingDebt?.installments || []);

    const handleBaseValueChange = (val: number | '') => {
        setBaseValue(val); const base = Number(val) || 0;
        if (base > 0) { if (profitType === 'PERCENTAGE') setFixedProfit(base * (profitPercentage / 100)); else setProfitPercentage(((Number(fixedProfit) || 0) / base) * 100); }
    };
    const handleFixedProfitChange = (val: number | '') => { setFixedProfit(val); const base = Number(baseValue) || 0; const fixed = Number(val) || 0; if (base > 0) setProfitPercentage((fixed / base) * 100); };
    const getCalculatedValues = () => { const base = Number(baseValue) || 0; let profit = 0; if (profitType === 'PERCENTAGE') profit = base * (profitPercentage / 100); else profit = Number(fixedProfit) || 0; return { base, profit, total: base + profit }; };
    const handleRecalculate = () => { const { total } = getCalculatedValues(); if (total === 0) return; const plan = calculatePlan(total, months, new Date(startDate), paymentDay); setManualInstallments(plan.map(p => ({ ...p, id: generateId(), debtId: isEditMode ? editingDebtId : 'temp', status: InstallmentStatus.PENDING }))); };
    const currentTotal = manualInstallments.reduce((sum, item) => sum + Number(item.amount), 0);
    const { total: targetTotal } = getCalculatedValues();
    const updateInstallment = (index: number, field: 'amount' | 'dueDate', value: any) => {
        const newInst = [...manualInstallments];
        if (field === 'dueDate') { newInst[index].dueDate = new Date(value).getTime(); setManualInstallments(newInst); }
        else {
            const newAmount = Number(value); if (newAmount < 0) return;
            newInst[index].amount = newAmount; const rem = newInst.length - 1 - index;
            if (rem > 0) {
                const sumSoFar = newInst.slice(0, index + 1).reduce((s, i) => s + i.amount, 0);
                const remBal = targetTotal - sumSoFar; const amtPerM = Math.floor(remBal / rem); const r = remBal - (amtPerM * rem);
                for (let j = index + 1; j < newInst.length; j++) { const isLast = j === newInst.length - 1; newInst[j].amount = Math.max(0, amtPerM + (isLast ? r : 0)); }
            }
            setManualInstallments(newInst);
        }
    };
    return (
      <div className="bg-gray-50 min-h-screen pb-24 text-right animate-fade-in">
        <div className="bg-white px-4 pt-6 pb-4 border-b flex items-center shadow-sm sticky top-0 z-20"><button onClick={() => setCurrentView('CLIENT_DETAILS')} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button><h2 className="text-xl font-bold mr-2">{isEditMode ? 'تعديل' : 'إضافة'} مديونية</h2></div>
        <div className="p-4 space-y-5">
           <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
             <div><label className="block text-xs text-gray-500 mb-1">اسم السلعة</label><input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border text-right" /></div>
             <div><label className="block text-xs text-gray-500 mb-1">رأس المال</label><input type="number" value={baseValue} onChange={e => handleBaseValueChange(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-lg border font-bold text-right" /></div>
             <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="flex bg-white rounded-lg p-1 shadow-sm mb-3">
                   <button onClick={() => setProfitType('PERCENTAGE')} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 ${profitType === 'PERCENTAGE' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Percent size={14} /> نسبة</button>
                   <button onClick={() => setProfitType('FIXED')} className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 ${profitType === 'FIXED' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Coins size={14} /> ثابت</button>
                </div>
                {profitType === 'PERCENTAGE' ? (<div><label className="block text-xs text-gray-500 mb-1">الربح (%)</label><div className="flex gap-2"><input type="number" value={profitPercentage} onChange={e => setProfitPercentage(Number(e.target.value))} className="w-24 p-2 bg-white rounded-lg border text-center font-bold" /><div className="flex-1 p-2 bg-gray-100 rounded-lg border flex items-center justify-between px-3 font-bold">{formatCurrency(Number(fixedProfit) || 0)}</div></div></div>) : (<div><label className="block text-xs text-gray-500 mb-1">مبلغ الربح (ريال)</label><input type="number" value={fixedProfit} onChange={e => handleFixedProfitChange(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg border font-bold text-right" /></div>)}
             </div>
             <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border text-blue-800 font-bold"><span>إجمالي المديونية</span><span>{formatCurrency(targetTotal)}</span></div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 text-right">
             <button onClick={handleRecalculate} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg border">إنشاء جدول الأقساط</button>
             <div className="mt-4"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold">جدول الأقساط</span><span className={`font-bold ${currentTotal === targetTotal ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(currentTotal)}</span></div><div className="max-h-80 overflow-y-auto border rounded-lg divide-y bg-gray-50">{manualInstallments.map((inst, idx) => { const isLast = idx === manualInstallments.length - 1; return (<div key={idx} className="p-2 flex gap-2 items-center text-sm"><span className="w-6 text-center text-gray-400">{idx + 1}</span><input type="date" className="p-1 rounded border text-xs" value={new Date(inst.dueDate).toISOString().split('T')[0]} onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)} /><input type="number" className={`p-1 rounded border text-xs w-24 font-bold text-right ${isLast ? 'bg-gray-100' : ''}`} value={inst.amount} onChange={(e) => updateInstallment(idx, 'amount', e.target.value)} disabled={isLast} /></div>); })}</div></div>
           </div>
           <button onClick={() => saveDebt({ id: editingDebtId, clientId: selectedClientId, itemName, baseValue, profitPercentage, monthCount: months, startDate, paymentDay, installments: manualInstallments }, isEditMode)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">حفظ المديونية</button>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="bg-gray-50 min-h-screen pb-24 text-right">
      <header className="bg-white p-6 pb-8 rounded-b-3xl shadow-sm mb-6"><h1 className="text-2xl font-bold">الإعدادات</h1></header>
      <div className="px-4 space-y-6">
        <button onClick={exportData} className="w-full flex items-center justify-between p-4 bg-blue-50 text-blue-700 rounded-xl font-bold"><Download size={20} /> تصدير نسخة احتياطية</button>
        <label className="w-full flex items-center justify-between p-4 bg-green-50 text-green-700 rounded-xl font-bold cursor-pointer"><Upload size={20} /> استيراد بيانات<input type="file" accept=".json" onChange={importData} className="hidden" /></label>
        <button onClick={resetAppData} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-xl font-bold"><Trash2 size={20} /> تصفير جميع البيانات</button>
      </div>
    </div>
  );

  return (
    <>
      {isEditClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 text-right">
            <h3 className="font-bold mb-3">تعديل بيانات العميل</h3>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">الاسم</label><input value={editClientName} onChange={e => setEditClientName(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-right" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">الجوال</label><input value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-right" /></div>
            </div>
            <div className="flex gap-2 mt-4"><button onClick={saveEditClient} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">حفظ</button><button onClick={() => setIsEditClientOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">إلغاء</button></div>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-tajawal">
        {currentView === 'DASHBOARD' && <DashboardView />}
        {currentView === 'CLIENTS_LIST' && <ClientsListView />}
        {currentView === 'CLIENT_DETAILS' && <ClientDetailsView />}
        {currentView === 'RECORD_PAYMENT' && <RecordPaymentView />}
        {(currentView === 'ADD_DEBT' || currentView === 'EDIT_DEBT') && <DebtFormView />}
        {currentView === 'SETTINGS' && <SettingsView />}
        <TabBar currentView={currentView} onChangeView={setCurrentView} />
      </div>

      {summaryPreview && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-right">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">مراجعة كشف الحساب</h3><button onClick={() => setSummaryPreview(null)} className="p-1 bg-gray-100 rounded-full"><X size={20}/></button></div>
            <div className="bg-gray-50 p-4 rounded-2xl text-sm whitespace-pre-wrap max-h-[40vh] overflow-y-auto mb-6 border border-gray-100 leading-relaxed">{summaryPreview.text}</div>
            <div className="flex gap-3">
              <button onClick={() => { window.open(`https://wa.me/${summaryPreview.phone}?text=${encodeURIComponent(summaryPreview.text)}`, '_blank'); setSummaryPreview(null); }} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"><Send size={20}/> إرسال الآن</button>
              <button onClick={() => setSummaryPreview(null)} className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {postponedInfo !== null && (
        <div onClick={() => setPostponedInfo(null)} className="fixed inset-0 z-[999999] bg-black/45 flex items-center justify-center text-right">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[14px] p-[18px] w-[90%] max-w-[420px] shadow-2xl text-center">
            <div style={{color:'#FF7700' , fontWeight: 800, marginBottom: 6 }}>تفاصيل التأجيل</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>تاريخ القسط: {formatDate(postponedInfo.date)}</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#D40000',fontWeight: 800}}>{postponedInfo.note}</div>
            <button onClick={() => setPostponedInfo(null)} style={{marginTop: 14, padding: '10px 16px', borderRadius: 12, background: '#FF7700', color: '#fff', fontWeight: 700, width: '100%'}}>إغلاق</button>
          </div>
        </div>
      )}
    </>
  );
}
