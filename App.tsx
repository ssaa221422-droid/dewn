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

const INITIAL_DATA: AppData = {
  clients: [],
  debts: []
};

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

export default function App() {
  [span_3](start_span)const [postponedInfo, setPostponedInfo] = useState<{ date: number; note: string } | null>(null);[span_3](end_span)
  [span_4](start_span)const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);[span_4](end_span)
  const [summaryPreview, setSummaryPreview] = useState<{ text: string; phone: string } | null>(null);
  
  const [data, setData] = useState<AppData>(() => {
    [span_5](start_span)const saved = localStorage.getItem('debtCollectorData');[span_5](end_span)
    if (saved) {
      try {
        [span_6](start_span)const parsed = JSON.parse(saved);[span_6](end_span)
        [span_7](start_span)if (parsed.clients && parsed.debts) return parsed;[span_7](end_span)
      } catch (e) { console.error("Error parsing saved data", e); [span_8](start_span)}
    }
    return INITIAL_DATA;[span_8](end_span)
  });

  [span_9](start_span)const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');[span_9](end_span)
  [span_10](start_span)const [selectedClientId, setSelectedClientId] = useState<string | null>(null);[span_10](end_span)
  [span_11](start_span)const [editingDebtId, setEditingDebtId] = useState<string | null>(null);[span_11](end_span)
  [span_12](start_span)const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);[span_12](end_span)
  [span_13](start_span)const [searchTerm, setSearchTerm] = useState('');[span_13](end_span)
  [span_14](start_span)const [isEditClientOpen, setIsEditClientOpen] = useState(false);[span_14](end_span)
  [span_15](start_span)const [editClientName, setEditClientName] = useState('');[span_15](end_span)
  [span_16](start_span)const [editClientPhone, setEditClientPhone] = useState('');[span_16](end_span)

  useEffect(() => {
    [span_17](start_span)localStorage.setItem('debtCollectorData', JSON.stringify(data));[span_17](end_span)
  }, [data]);

  const exportData = () => {
    [span_18](start_span)const dataStr = JSON.stringify(data, null, 2);[span_18](end_span)
    [span_19](start_span)const blob = new Blob([dataStr], { type: "application/json" });[span_19](end_span)
    [span_20](start_span)const url = URL.createObjectURL(blob);[span_20](end_span)
    [span_21](start_span)const link = document.createElement('a');[span_21](end_span)
    [span_22](start_span)link.href = url;[span_22](end_span)
    [span_23](start_span)link.download = `debt_backup_${new Date().toISOString().split('T')[0]}.json`;[span_23](end_span)
    [span_24](start_span)link.click();[span_24](end_span)
    [span_25](start_span)URL.revokeObjectURL(url);[span_25](end_span)
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    [span_26](start_span)const file = event.target.files?.[0];[span_26](end_span)
    [span_27](start_span)if (!file) return;[span_27](end_span)
    [span_28](start_span)const reader = new FileReader();[span_28](end_span)
    reader.onload = (e) => {
      try {
        [span_29](start_span)const json = JSON.parse(e.target?.result as string);[span_29](end_span)
        [span_30](start_span)if (json.clients && json.debts) {[span_30](end_span)
          [span_31](start_span)if (confirm('سيتم استبدال البيانات الحالية بالنسخة المرفوعة. هل تريد الاستمرار؟')) {[span_31](end_span)
            [span_32](start_span)setData(json);[span_32](end_span)
            [span_33](start_span)alert('تم استعادة البيانات بنجاح ✅');[span_33](end_span)
          }
        }
      } catch (err) { alert('حدث خطأ أثناء قراءة الملف ❌'); [span_34](start_span)}
    };
    reader.readAsText(file);[span_34](end_span)
    [span_35](start_span)event.target.value = '';[span_35](end_span)
  };

  const resetAppData = () => {
    [span_36](start_span)if (confirm('تحذير نهائي: سيتم حذف جميع العملاء والديون والبيانات نهائياً...')) {[span_36](end_span)
      [span_37](start_span)setData({ clients: [], debts: [] });[span_37](end_span)
      [span_38](start_span)setSelectedClientId(null);[span_38](end_span)
      [span_39](start_span)setEditingDebtId(null);[span_39](end_span)
      [span_40](start_span)setCurrentView('DASHBOARD');[span_40](end_span)
      [span_41](start_span)localStorage.removeItem('debtCollectorData');[span_41](end_span)
      [span_42](start_span)alert('تم تصفير التطبيق بالكامل بنجاح ✅');[span_42](end_span)
    }
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    [span_43](start_span)const newClient: Client = { ...client, id: generateId(), createdAt: Date.now() };[span_43](end_span)
    [span_44](start_span)setData(prev => ({ ...prev, clients: [newClient, ...prev.clients] }));[span_44](end_span)
    [span_45](start_span)setCurrentView('CLIENTS_LIST');[span_45](end_span)
  };

  const saveDebt = (debtData: any, isEdit: boolean) => {
    [span_46](start_span)const { id, clientId, itemName, baseValue, profitPercentage, monthCount, startDate, paymentDay, installments } = debtData;[span_46](end_span)
    [span_47](start_span)const finalInstallmentsTotal = installments.reduce((sum: number, i: any) => sum + Number(i.amount), 0);[span_47](end_span)
    [span_48](start_span)const profitValue = finalInstallmentsTotal - Number(baseValue);[span_48](end_span)
    const processedInstallments = installments.map((inst: any) => ({
      [span_49](start_span)...inst, id: inst.id || generateId(), debtId: isEdit ? id : 'temp', status: inst.status || InstallmentStatus.PENDING[span_49](end_span)
    }));
    if (isEdit) {
       setData(prev => ({
         [span_50](start_span)...prev, debts: prev.debts.map(d => d.id === id ? { ...d, itemName, baseValue, profitPercentage, profitValue, totalValue: finalInstallmentsTotal, monthCount, startDate: new Date(startDate).getTime(), paymentDay, installments: processedInstallments } : d)[span_50](end_span)
       }));
    } else {
      [span_51](start_span)const newDebt: Debt = { id: generateId(), clientId, itemName, baseValue, profitPercentage, profitValue, totalValue: finalInstallmentsTotal, monthCount, startDate: new Date(startDate).getTime(), paymentDay, isFullyPaid: false, installments: processedInstallments };[span_51](end_span)
      [span_52](start_span)newDebt.installments.forEach(i => i.debtId = newDebt.id);[span_52](end_span)
      [span_53](start_span)setData(prev => ({ ...prev, debts: [newDebt, ...prev.debts] }));[span_53](end_span)
    }
    [span_54](start_span)setSelectedClientId(clientId);[span_54](end_span)
    [span_55](start_span)setCurrentView('CLIENT_DETAILS');[span_55](end_span)
  };

  const processPayment = (debtId: string, installmentId: string, paidAmount: number, paidDate: number, notes: string, newFutureInstallments: Installment[]) => {
    setData(prev => {
      const newDebts = prev.debts.map(debt => {
        [span_56](start_span)if (debt.id !== debtId) return debt;[span_56](end_span)
        [span_57](start_span)const pastInstallments = debt.installments.filter(i => i.id !== installmentId && (i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.POSTPONED));[span_57](end_span)
        [span_58](start_span)const currentInstallment = debt.installments.find(i => i.id === installmentId);[span_58](end_span)
        [span_59](start_span)if(!currentInstallment) return debt;[span_59](end_span)
        [span_60](start_span)const isPostponed = paidAmount === 0;[span_60](end_span)
        const updatedCurrent: Installment = { ...currentInstallment, amount: paidAmount, status: isPostponed ? [span_61](start_span)InstallmentStatus.POSTPONED : InstallmentStatus.PAID, paidDate: paidDate, notes: notes };[span_61](end_span)
        [span_62](start_span)const allInstallments = [...pastInstallments, updatedCurrent, ...newFutureInstallments];[span_62](end_span)
        [span_63](start_span)allInstallments.sort((a, b) => a.dueDate - b.dueDate);[span_63](end_span)
        [span_64](start_span)const allPaid = allInstallments.every(i => i.status === InstallmentStatus.PAID || i.status === InstallmentStatus.POSTPONED);[span_64](end_span)
        [span_65](start_span)return { ...debt, installments: allInstallments, isFullyPaid: allPaid, monthCount: allInstallments.length };[span_65](end_span)
      });
      [span_66](start_span)return { ...prev, debts: newDebts };[span_66](end_span)
    });
    [span_67](start_span)setCurrentView('CLIENT_DETAILS');[span_67](end_span)
  };

  const openEditClient = (client: Client) => {
    [span_68](start_span)setEditClientName(client.name || '');[span_68](end_span)
    [span_69](start_span)setEditClientPhone((client.phone as any) || '');[span_69](end_span)
    [span_70](start_span)setIsEditClientOpen(true);[span_70](end_span)
  };

  const deleteClient = (id: string) => {
    [span_71](start_span)if(!confirm('هل أنت متأكد من حذف هذا العميل وجميع ديونه نهائياً؟')) return;[span_71](end_span)
    [span_72](start_span)setData(prev => ({ clients: prev.clients.filter(c => c.id !== id), debts: prev.debts.filter(d => d.clientId !== id) }));[span_72](end_span)
    [span_73](start_span)setSelectedClientId(null);[span_73](end_span)
    [span_74](start_span)setCurrentView('CLIENTS_LIST');[span_74](end_span)
    [span_75](start_span)alert('تم حذف العميل بنجاح ✅');[span_75](end_span)
  };

  const deleteDebt = (id: string) => {
    [span_76](start_span)if(!confirm('هل أنت متأكد من حذف هذه المديونية؟')) return;[span_76](end_span)
    [span_77](start_span)setData(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));[span_77](end_span)
    [span_78](start_span)alert('تم حذف المديونية بنجاح ✅');[span_78](end_span)
  };

  const stats = useMemo(() => {
    [span_79](start_span)let totalLoaned = 0, totalProfit = 0, totalCollected = 0, totalPending = 0;[span_79](end_span)
    data.debts.forEach(debt => {
      [span_80](start_span)totalLoaned += debt.baseValue;[span_80](end_span)
      [span_81](start_span)totalProfit += debt.profitValue;[span_81](end_span)
      debt.installments.forEach(inst => {
        [span_82](start_span)if (inst.status === InstallmentStatus.PAID) totalCollected += inst.amount;[span_82](end_span)
        [span_83](start_span)else if (inst.status !== InstallmentStatus.POSTPONED) totalPending += inst.amount;[span_83](end_span)
      });
    });
    [span_84](start_span)return { totalLoaned, totalProfit, totalCollected, totalPending };[span_84](end_span)
  }, [data.debts]);

  const ClientsListView = () => {
    const clientsWithTotals = useMemo(() => {
      return data.clients.map(client => {
        [span_85](start_span)const clientDebts = data.debts.filter(d => d.clientId === client.id);[span_85](end_span)
        [span_86](start_span)const total = clientDebts.reduce((acc, curr) => acc + curr.totalValue, 0);[span_86](end_span)
        [span_87](start_span)const paid = clientDebts.reduce((acc, curr) => acc + curr.installments.filter(i => i.status === InstallmentStatus.PAID).reduce((s, i) => s + i.amount, 0), 0);[span_87](end_span)
        [span_88](start_span)const remaining = total - paid;[span_88](end_span)
        const nextDate = clientDebts.flatMap(d => d.installments).filter(i => i.status === InstallmentStatus.PENDING).sort((a, b) => a.dueDate - b.dueDate)[0]?.dueDate || Infinity;
        [span_89](start_span)return { ...client, total, paid, remaining, nextDate };[span_89](end_span)
      });
    }, [data.clients, data.debts]);

    const filteredClients = useMemo(() => {
      return clientsWithTotals.filter(c => c.name.includes(searchTerm) || c.phone.includes(searchTerm)).sort((a, b) => {
        [span_90](start_span)const aPaid = a.remaining <= 0; const bPaid = b.remaining <= 0;[span_90](end_span)
        [span_91](start_span)if (aPaid && !bPaid) return 1;[span_91](end_span)
        [span_92](start_span)if (!aPaid && bPaid) return -1;[span_92](end_span)
        if (!aPaid && !bPaid) return a.nextDate - b.nextDate; // الترتيب المطلوب
        [span_93](start_span)return b.remaining - a.remaining;[span_93](end_span)
      });
    }, [clientsWithTotals, searchTerm]);

    return (
      <div className="pb-24 pt-4 px-4 h-full flex flex-col">
        [span_94](start_span)<div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-gray-900">العملاء</h2>[span_94](end_span)
          [span_95](start_span)<button onClick={() => setCurrentView('ADD_CLIENT')} className="text-blue-600 p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"><UserPlus size={24} /></button>[span_95](end_span)
        </div>
        [span_96](start_span)<div className="relative mb-6">[span_96](end_span)
          [span_97](start_span)<input type="text" placeholder="بحث..." className="w-full bg-white pl-4 pr-10 py-3 rounded-xl border-none shadow-sm text-sm focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />[span_97](end_span)
          [span_98](start_span)<Search className="absolute right-3 top-3 text-gray-400" size={20} />[span_98](end_span)
        </div>
        [span_99](start_span)<div className="space-y-3 overflow-y-auto no-scrollbar pb-20">[span_99](end_span)
          {filteredClients.map(client => (
            [span_100](start_span)<div key={client.id} onClick={() => { setSelectedClientId(client.id); setSelectedDebtIds([]); setCurrentView('CLIENT_DETAILS'); }} className={`bg-white p-4 rounded-xl shadow-sm active:scale-[0.99] transition-all cursor-pointer ${client.remaining <= 0 ? 'opacity-50 grayscale border-dashed border-gray-200' : 'border border-transparent'}`}>[span_100](end_span)
              [span_101](start_span)<div className="flex justify-between items-start">[span_101](end_span)
                <div><h3 className={`font-bold ${client.remaining <= 0 ? [span_102](start_span)'text-gray-400' : 'text-gray-800'}`}>{client.name}</h3>[span_102](end_span)
                {client.remaining > 0 && client.nextDate !== Infinity && (<p className="text-[10px] text-blue-600 font-medium mt-1">القادم: {formatDate(client.nextDate)}</p>)}</div>
                [span_103](start_span)<div className="text-left">[span_103](end_span)
                  [span_104](start_span)<span className="block text-xs text-gray-400">المتبقي</span>[span_104](end_span)
                  <span className={`font-bold ${client.remaining <= 0 ? 'text-gray-400' : 'text-red-500'}`}>{client.remaining <= 0 ? [span_105](start_span)'0' : formatCurrency(client.remaining)}</span>[span_105](end_span)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ClientDetailsView = () => {
    [span_106](start_span)const client = data.clients.find(c => c.id === selectedClientId);[span_106](end_span)
    [span_107](start_span)if (!client) return null;[span_107](end_span)
    [span_108](start_span)const clientDebts = data.debts.filter(d => d.clientId === client.id);[span_108](end_span)

    const handlePrepareSummary = () => {
      [span_109](start_span)const selected = selectedDebtIds.length > 0 ? clientDebts.filter(d => selectedDebtIds.includes(d.id)) : clientDebts;[span_109](end_span)
      [span_110](start_span)let text = `مرحباً ${client.name}،\nإليك ملخص حسابك:\n\n`;[span_110](end_span)
      [span_111](start_span)let tA = 0, pA = 0;[span_111](end_span)
      selected.forEach(d => {
        [span_112](start_span)const p = d.installments.filter(i => i.status === InstallmentStatus.PAID).reduce((s, i) => s + i.amount, 0);[span_112](end_span)
        [span_113](start_span)text += `📌 *${d.itemName}*\n- إجمالي: ${formatCurrency(d.totalValue)}\n- المتبقي: ${formatCurrency(d.totalValue - p)}\n\n`;[span_113](end_span)
        [span_114](start_span)tA += d.totalValue; pA += p;[span_114](end_span)
      });
      [span_115](start_span)if (selected.length > 1) text += `📊 *الإجمالي:* ${formatCurrency(tA - pA)}\n\n`;[span_115](end_span)
      [span_116](start_span)text += `شكراً لتعاملك معنا.`;[span_116](end_span)
      setSummaryPreview({ text, phone: client.phone.replace(/\D/g, '') });
    };

    const toggleDebtSelection = (id: string) => {
      [span_117](start_span)setSelectedDebtIds(prev => prev.includes(id) ? prev.filter(debtId => debtId !== id) : [...prev, id]);[span_117](end_span)
    };

    return (
      <div className="pb-24 bg-gray-50 min-h-screen animate-fade-in">
        <div className="bg-white pb-6 pt-4 px-4 rounded-b-3xl shadow-sm sticky top-0 z-10 text-center">
          <div className="flex items-center justify-between mb-4">
            [span_118](start_span)<button onClick={() => { setSelectedClientId(null); setCurrentView('CLIENTS_LIST'); }} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button>[span_118](end_span)
            [span_119](start_span)<h2 className="font-bold text-lg">ملف العميل</h2>[span_119](end_span)
            [span_120](start_span)<div className="flex items-center gap-2">[span_120](end_span)
              [span_121](start_span)<button onClick={() => openEditClient(client)} className="text-blue-600 p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"><Edit size={22} /></button>[span_121](end_span)
              [span_122](start_span)<button onClick={() => deleteClient(client.id)} className="text-red-500 p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors"><Trash2 size={22} /></button>[span_122](end_span)
            </div>
          </div>
          [span_123](start_span)<div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">{client.name.charAt(0)}</div>[span_123](end_span)
          [span_124](start_span)<h1 className="text-xl font-bold text-gray-900">{client.name}</h1>[span_124](end_span)
          [span_125](start_span)<p className="text-gray-500 text-sm">{client.phone}</p>[span_125](end_span)
          [span_126](start_span)<button onClick={handlePrepareSummary} className="mt-4 flex items-center gap-2 bg-green-50 text-green-700 px-6 py-2 rounded-xl font-bold mx-auto"><Send size={16} /> كشف حساب</button>[span_126](end_span)
        </div>
        <div className="px-4 mt-6 space-y-6">
           [span_127](start_span)<div className="flex justify-between items-center">[span_127](end_span)
             [span_128](start_span)<h3 className="font-bold text-gray-800">الديون المسجلة</h3>[span_128](end_span)
             <button onClick={() => { setEditingDebtId(null); setCurrentView('ADD_DEBT'); [span_129](start_span)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200">+ مديونية جديدة</button>[span_129](end_span)
           </div>
           {clientDebts.map(debt => (
             [span_130](start_span)<div key={debt.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all ${selectedDebtIds.includes(debt.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}>[span_130](end_span)
               [span_131](start_span)<div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">[span_131](end_span)
                 [span_132](start_span)<div className="flex items-center gap-3">[span_132](end_span)
                   [span_133](start_span)<input type="checkbox" checked={selectedDebtIds.includes(debt.id)} onChange={() => toggleDebtSelection(debt.id)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />[span_133](end_span)
                   [span_134](start_span)<div><h4 className="font-bold text-gray-900">{debt.itemName}</h4>[span_134](end_span)
                   <p className="text-xs text-gray-500 mt-1">أصل: {formatCurrency(debt.baseValue)} | [span_135](start_span)ربح: {debt.profitPercentage.toFixed(1)}%</p></div>[span_135](end_span)
                 </div>
                 [span_136](start_span)<div className="flex gap-2">[span_136](end_span)
                   <button onClick={() => { setEditingDebtId(debt.id); setCurrentView('EDIT_DEBT'); [span_137](start_span)}} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"><Edit size={16} /></button>[span_137](end_span)
                   [span_138](start_span)<button onClick={() => deleteDebt(debt.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={16} /></button>[span_138](end_span)
                 </div>
               </div>
               [span_139](start_span)<div className="divide-y divide-gray-100">[span_139](end_span)
                 {debt.installments.map((inst, idx) => (
                   [span_140](start_span)<div key={inst.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">[span_140](end_span)
                     [span_141](start_span)<div className="flex items-center gap-3">[span_141](end_span)
                       <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${inst.status === 'PAID' ? 'bg-green-100 text-green-700' : inst.status === InstallmentStatus.POSTPONED ? [span_142](start_span)'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>[span_142](end_span)
                       [span_143](start_span)<div><p className="text-sm font-medium text-gray-900">{formatCurrency(inst.amount)}</p><p className="text-xs text-gray-500">{formatDate(inst.dueDate)}</p></div>[span_143](end_span)
                     </div>
                     {inst.status === InstallmentStatus.PAID || inst.status === InstallmentStatus.POSTPONED ? [span_144](start_span)(
                       <div className="flex items-center gap-2">[span_144](end_span)
                         <button onClick={() => inst.status === InstallmentStatus.POSTPONED && setPostponedInfo({ date: inst.dueDate, note: inst.notes || '' })} className={`text-xs font-bold px-2 py-1 rounded-md ${inst.status === InstallmentStatus.POSTPONED ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>{inst.status === InstallmentStatus.POSTPONED ? [span_145](start_span)'تم التأجيل' : 'مدفوع'}</button>[span_145](end_span)
                       </div>
                     ) : (
                       [span_146](start_span)<button onClick={() => { setEditingDebtId(debt.id); setSelectedInstallmentId(inst.id); setCurrentView('RECORD_PAYMENT'); }} className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">تسجيل سداد</button>[span_146](end_span)
                     )}
                   </div>
                 ))}
               </div>
               [span_147](start_span)<div className="p-3 bg-gray-50 border-t border-gray-100 text-center"><div className="flex justify-between items-center text-sm"><span className="text-gray-500">الإجمالي:</span><span className="font-bold text-gray-800">{formatCurrency(debt.totalValue)}</span></div></div>[span_147](end_span)
             </div>
           ))}
        </div>
      </div>
    );
  };

  const RecordPaymentView = () => {
    [span_148](start_span)const debt = data.debts.find(d => d.id === editingDebtId);[span_148](end_span)
    [span_149](start_span)const installment = debt?.installments.find(i => i.id === selectedInstallmentId);[span_149](end_span)
    [span_150](start_span)if (!debt || !installment) return null;[span_150](end_span)
    [span_151](start_span)const futurePendingInstallments = useMemo(() => { const currentIndex = debt.installments.findIndex(i => i.id === installment.id); return debt.installments.slice(currentIndex + 1); }, [debt, installment]);[span_151](end_span)
    [span_152](start_span)const [paymentAmount, setPaymentAmount] = useState<number>(installment.amount);[span_152](end_span)
    [span_153](start_span)const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);[span_153](end_span)
    [span_154](start_span)const [notes, setNotes] = useState('');[span_154](end_span)
    [span_155](start_span)const [remainingMonths, setRemainingMonths] = useState<number>(futurePendingInstallments.length);[span_155](end_span)
    [span_156](start_span)const [previewInstallments, setPreviewInstallments] = useState<Installment[]>([]);[span_156](end_span)
    [span_157](start_span)const totalDebt = debt.totalValue;[span_157](end_span)
    [span_158](start_span)const previouslyPaid = debt.installments.filter(i => i.status === InstallmentStatus.PAID && i.id !== installment.id).reduce((sum, i) => sum + i.amount, 0);[span_158](end_span)
    [span_159](start_span)const balanceAfterThisPayment = totalDebt - previouslyPaid - paymentAmount;[span_159](end_span)

    useEffect(() => {
        [span_160](start_span)if (balanceAfterThisPayment <= 0 && remainingMonths <= 0) { setPreviewInstallments([]); return; }[span_160](end_span)
        const safeMonths = (balanceAfterThisPayment > 1 && remainingMonths === 0) ? [span_161](start_span)1 : remainingMonths;[span_161](end_span)
        if (safeMonths > 0) {
            [span_162](start_span)const payDateObj = new Date(paymentDate);[span_162](end_span)
            [span_163](start_span)const nextStartDate = new Date(payDateObj.getFullYear(), payDateObj.getMonth() + 1, debt.paymentDay);[span_163](end_span)
            [span_164](start_span)const plan = calculatePlan(Math.max(0, balanceAfterThisPayment), safeMonths, nextStartDate, debt.paymentDay);[span_164](end_span)
            [span_165](start_span)setPreviewInstallments(plan.map(p => ({ ...p, id: generateId(), debtId: debt.id, status: InstallmentStatus.PENDING })));[span_165](end_span)
        }
    }, [paymentAmount, remainingMonths, paymentDate, balanceAfterThisPayment, debt]);

    return (
        <div className="bg-gray-50 min-h-screen pb-20 animate-fade-in text-right">
            [span_166](start_span)<div className="bg-white px-4 pt-6 pb-4 border-b flex items-center sticky top-0 z-20"><button onClick={() => setCurrentView('CLIENT_DETAILS')} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button><h2 className="text-xl font-bold mr-2">تسجيل دفعة</h2></div>[span_166](end_span)
            <div className="p-4 space-y-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                    [span_167](start_span)<div><label className="block text-xs text-gray-500 mb-1">المبلغ المدفوع</label><input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-right" /></div>[span_167](end_span)
                    [span_168](start_span)<div><label className="block text-xs text-gray-500 mb-1">تاريخ السداد</label><input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-right" /></div>[span_168](end_span)
                    [span_169](start_span)<div><label className="block text-xs text-gray-500 mb-1">ملاحظات (سبب التأجيل)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl text-sm h-20 resize-none text-right" placeholder="سبب التأجيل، ملاحظات إضافية..." /></div>[span_169](end_span)
                </div>
                {balanceAfterThisPayment > 0 && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border-t-4 border-orange-400">
                        [span_170](start_span)<div className="flex justify-between items-center font-bold text-orange-600"><h3>جدولة المتبقي</h3><span>{formatCurrency(balanceAfterThisPayment)}</span></div>[span_170](end_span)
                        [span_171](start_span)<div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"><span className="text-sm font-medium">عدد الأشهر</span><div className="flex items-center gap-4"><button onClick={() => setRemainingMonths(Math.max(1, remainingMonths - 1))} className="w-8 h-8 rounded-full bg-white">-</button><span className="font-bold">{remainingMonths}</span><button onClick={() => setRemainingMonths(remainingMonths + 1)} className="w-8 h-8 rounded-full bg-white">+</button></div></div>[span_171](end_span)
                        [span_172](start_span)<div className="divide-y">{previewInstallments.map((inst, idx) => (<div key={idx} className="p-2 flex justify-between text-xs"><span>قسط {idx + 1}</span><span className="font-bold">{formatCurrency(inst.amount)}</span></div>))}</div>[span_172](end_span)
                    </div>
                )}
                <button onClick={() => processPayment(debt.id, installment.id, paymentAmount, new Date(paymentDate).getTime(), notes, previewInstallments)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">{paymentAmount === 0 ? [span_173](start_span)'تأكيد التأجيل والجدولة' : 'تأكيد السداد والجدولة'}</button>[span_173](end_span)
            </div>
        </div>
    );
  };

  const DebtFormView = () => {
    [span_174](start_span)const isEditMode = currentView === 'EDIT_DEBT' && !!editingDebtId;[span_174](end_span)
    [span_175](start_span)const existingDebt = isEditMode ? data.debts.find(d => d.id === editingDebtId) : null;[span_175](end_span)
    [span_176](start_span)const [itemName, setItemName] = useState(existingDebt?.itemName || '');[span_176](end_span)
    const [baseValue, setBaseValue] = useState<number | [span_177](start_span)''>(existingDebt?.baseValue || '');[span_177](end_span)
    const [profitType, setProfitType] = useState<'PERCENTAGE' | [span_178](start_span)'FIXED'>(existingDebt?.profitPercentage ? 'PERCENTAGE' : 'FIXED');[span_178](end_span)
    [span_179](start_span)const [profitPercentage, setProfitPercentage] = useState<number>(existingDebt?.profitPercentage || 10);[span_179](end_span)
    const [fixedProfit, setFixedProfit] = useState<number | [span_180](start_span)''>(existingDebt?.profitValue || '');[span_180](end_span)
    [span_181](start_span)const [months, setMonths] = useState<number>(existingDebt?.monthCount || 6);[span_181](end_span)
    [span_182](start_span)const [startDate, setStartDate] = useState(existingDebt ? new Date(existingDebt.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);[span_182](end_span)
    [span_183](start_span)const [paymentDay, setPaymentDay] = useState(existingDebt?.paymentDay || 27);[span_183](end_span)
    [span_184](start_span)const [manualInstallments, setManualInstallments] = useState<any[]>(existingDebt?.installments || []);[span_184](end_span)

    const handleBaseValueChange = (val: number | '') => {
        setBaseValue(val); const base = Number(val) || [span_185](start_span)0;[span_185](end_span)
        if (base > 0) { if (profitType === 'PERCENTAGE') setFixedProfit(base * (profitPercentage / 100)); else setProfitPercentage(((Number(fixedProfit) || 0) / base) * 100); [span_186](start_span)}
    };
    const handleFixedProfitChange = (val: number | '') => { setFixedProfit(val); const base = Number(baseValue) || 0; const fixed = Number(val) || 0; if (base > 0) setProfitPercentage((fixed / base) * 100); };[span_186](end_span)
    const getCalculatedValues = () => { const base = Number(baseValue) || 0; let profit = 0; if (profitType === 'PERCENTAGE') profit = base * (profitPercentage / 100); else profit = Number(fixedProfit) || 0; return { base, profit, total: base + profit }; [span_187](start_span)};[span_187](end_span)
    const handleRecalculate = () => { const { total } = getCalculatedValues(); if (total === 0) return; const plan = calculatePlan(total, months, new Date(startDate), paymentDay); setManualInstallments(plan.map(p => ({ ...p, id: generateId(), debtId: isEditMode ? editingDebtId : 'temp', status: InstallmentStatus.PENDING }))); [span_188](start_span)};[span_188](end_span)
    [span_189](start_span)const currentTotal = manualInstallments.reduce((sum, item) => sum + Number(item.amount), 0);[span_189](end_span)
    [span_190](start_span)const { total: targetTotal } = getCalculatedValues();[span_190](end_span)
    const updateInstallment = (index: number, field: 'amount' | 'dueDate', value: any) => {
        [span_191](start_span)const newInstallments = [...manualInstallments];[span_191](end_span)
        if (field === 'dueDate') { newInstallments[index].dueDate = new Date(value).getTime(); setManualInstallments(newInstallments); [span_192](start_span)}
        else {
            const newAmount = Number(value); if (newAmount < 0) return;[span_192](end_span)
            [span_193](start_span)newInstallments[index].amount = newAmount; const remainingCount = newInstallments.length - 1 - index;[span_193](end_span)
            if (remainingCount > 0) {
                [span_194](start_span)const sumSoFar = newInstallments.slice(0, index + 1).reduce((sum, i) => sum + i.amount, 0);[span_194](end_span)
                [span_195](start_span)const remainingBalance = targetTotal - sumSoFar; const amountPerMonth = Math.floor(remainingBalance / remainingCount); const remainder = remainingBalance - (amountPerMonth * remainingCount);[span_195](end_span)
                for (let j = index + 1; j < newInstallments.length; j++) { const isLast = j === newInstallments.length - 1; newInstallments[j].amount = Math.max(0, amountPerMonth + (isLast ? remainder : 0)); [span_196](start_span)}
            }
            setManualInstallments(newInstallments);[span_196](end_span)
        }
    };

    return (
      <div className="bg-gray-50 min-h-screen pb-24 text-right animate-fade-in">
        [span_197](start_span)<div className="bg-white px-4 pt-6 pb-4 border-b flex items-center shadow-sm sticky top-0 z-20"><button onClick={() => setCurrentView('CLIENT_DETAILS')} className="p-2 -mr-2 text-gray-600"><ArrowLeft /></button><h2 className="text-xl font-bold mr-2">{isEditMode ? 'تعديل' : 'إضافة'} مديونية</h2></div>[span_197](end_span)
        <div className="p-4 space-y-5">
           <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
             [span_198](start_span)<h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2 mb-2"><FileText size={18} className="text-blue-500" /> تفاصيل السلعة</h3>[span_198](end_span)
             [span_199](start_span)<div><label className="block text-xs text-gray-500 mb-1">اسم السلعة</label><input type="text" value={itemName} onChange={e => setItemName(e.target.value)} className="w-full p-3 bg-gray-50 rounded-lg border text-right" /></div>[span_199](end_span)
             [span_200](start_span)<div><label className="block text-xs text-gray-500 mb-1">رأس المال</label><input type="number" value={baseValue} onChange={e => handleBaseValueChange(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-lg border font-bold text-right" /></div>[span_200](end_span)
             [span_201](start_span)<div className="bg-gray-50 p-3 rounded-xl border border-gray-200">[span_201](end_span)
                [span_202](start_span)<div className="flex bg-white rounded-lg p-1 shadow-sm mb-3">[span_202](end_span)
                   <button onClick={() => setProfitType('PERCENTAGE')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${profitType === 'PERCENTAGE' ? [span_203](start_span)'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Percent size={14} /> نسبة مئوية</button>[span_203](end_span)
                   <button onClick={() => setProfitType('FIXED')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 ${profitType === 'FIXED' ? [span_204](start_span)'bg-blue-100 text-blue-700' : 'text-gray-500'}`}><Coins size={14} /> مبلغ ثابت</button>[span_204](end_span)
                </div>
                {profitType === 'PERCENTAGE' ? (<div><label className="block text-xs text-gray-500 mb-1">نسبة الربح (%)[span_205](start_span)</label><div className="flex gap-2"><input type="number" value={profitPercentage} onChange={e => setProfitPercentage(Number(e.target.value))} className="w-24 p-2 bg-white rounded-lg text-sm border text-center font-bold" /><div className="flex-1 p-2 bg-gray-100 rounded-lg border flex items-center justify-between px-3 font-bold">{formatCurrency(Number(fixedProfit) || 0)}</div></div></div>) : (<div><label className="block text-xs text-gray-500 mb-1">مبلغ الربح (ريال)</label><input type="number" value={fixedProfit} onChange={e => handleFixedProfitChange(Number(e.target.value))} className="w-full p-2 bg-white rounded-lg border font-bold text-right" /></div>)}[span_205](end_span)
             </div>
             [span_206](start_span)<div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border text-blue-800 font-bold"><span>إجمالي المديونية</span><span>{formatCurrency(targetTotal)}</span></div>[span_206](end_span)
           </div>
           [span_207](start_span)<div className="bg-white p-4 rounded-xl shadow-sm space-y-4">[span_207](end_span)
             [span_208](start_span)<div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-gray-500 mb-1">الأشهر</label><input type="number" value={months} onChange={e => setMonths(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-lg border text-right" /></div><div><label className="block text-xs text-gray-500 mb-1">يوم السداد</label><input type="number" value={paymentDay} onChange={e => setPaymentDay(Number(e.target.value))} className="w-full p-3 bg-gray-50 rounded-lg border text-right" /></div></div>[span_208](end_span)
             [span_209](start_span)<button onClick={handleRecalculate} className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg border">إنشاء جدول الأقساط</button>[span_209](end_span)
             <div className="mt-4"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold">جدول الأقساط</span><span className={`font-bold ${currentTotal === targetTotal ? [span_210](start_span)'text-green-600' : 'text-red-500'}`}>{formatCurrency(currentTotal)}</span></div><div className="max-h-80 overflow-y-auto border rounded-lg divide-y bg-gray-50">{manualInstallments.map((inst, idx) => { const isLast = idx === manualInstallments.length - 1; return (<div key={idx} className="p-2 flex gap-2 items-center text-sm"><span className="w-6 text-center text-gray-400">{idx + 1}</span><input type="date" className="p-1 rounded border text-xs" value={new Date(inst.dueDate).toISOString().split('T')[0]} onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)} /><input type="number" className={`p-1 rounded border text-xs w-24 font-bold text-right ${isLast ? 'bg-gray-100 text-gray-500' : ''}`} value={inst.amount} onChange={(e) => updateInstallment(idx, 'amount', e.target.value)} disabled={isLast} /></div>); })}</div></div>[span_210](end_span)
           </div>
           <button onClick={() => saveDebt({ id: editingDebtId, clientId: selectedClientId, itemName, baseValue, profitPercentage, monthCount: months, startDate, paymentDay, installments: manualInstallments }, isEditMode)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"><Save size={20} />{isEditMode ? [span_211](start_span)'حفظ التعديلات' : 'اعتماد المديونية'}</button>[span_211](end_span)
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden font-tajawal">
        {currentView === 'DASHBOARD' && <DashboardView />}
        {currentView === 'CLIENTS_LIST' && <ClientsListView />}
        {currentView === 'CLIENT_DETAILS' && <ClientDetailsView />}
        {currentView === 'RECORD_PAYMENT' && <RecordPaymentView />}
        {(currentView === 'ADD_DEBT' || currentView === 'EDIT_DEBT') && <DebtFormView />}
        {currentView === 'SETTINGS' && <SettingsView />}
        [span_212](start_span)<TabBar currentView={currentView} onChangeView={setCurrentView} />[span_212](end_span)
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
        <div onClick={() => setPostponedInfo(null)} className="fixed inset-0 z-[999999] bg-black/45 flex items-center justify-center">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[14px] p-[18px] w-[90%] max-w-[420px] shadow-2xl text-center">
            [span_213](start_span)<div style={{color:'#FF7700' , fontWeight: 800, marginBottom: 6 }}>تفاصيل التأجيل</div>[span_213](end_span)
            [span_214](start_span)<div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>تاريخ القسط: {formatDate(postponedInfo.date)}</div>[span_214](end_span)
            [span_215](start_span)<div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#D40000',fontWeight: 800}}>{postponedInfo.note}</div>[span_215](end_span)
            [span_216](start_span)<button onClick={() => setPostponedInfo(null)} style={{marginTop: 14, padding: '10px 16px', borderRadius: 12, background: '#FF7700', color: '#fff', fontWeight: 700, width: '100%'}}>إغلاق</button>[span_216](end_span)
          </div>
        </div>
      )}
    </>
  );
}
