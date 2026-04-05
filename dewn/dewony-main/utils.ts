
import { Debt, Installment, InstallmentStatus } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat('ar-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(timestamp));
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Logic to generate installments
export const calculatePlan = (
  totalAmount: number,
  months: number,
  startDate: Date,
  payDay: number
): Omit<Installment, 'id' | 'debtId'>[] => {
  const amountPerMonth = Math.floor(totalAmount / months);
  const remainder = totalAmount - (amountPerMonth * months);
  
  const plan: Omit<Installment, 'id' | 'debtId'>[] = [];
  
  let currentMonth = startDate.getMonth();
  let currentYear = startDate.getFullYear();

  // If start date day is after pay day, start next month
  if (startDate.getDate() > payDay) {
    currentMonth++;
  }

  for (let i = 0; i < months; i++) {
    // Create date for the pay day of that month
    const dueDate = new Date(currentYear, currentMonth + i, payDay);
    
    // Add remainder to the last installment
    const installmentAmount = (i === months - 1) ? amountPerMonth + remainder : amountPerMonth;

    plan.push({
      dueDate: dueDate.getTime(),
      amount: installmentAmount,
      status: InstallmentStatus.PENDING,
    });
  }

  return plan;
};

export const getStatusColor = (status: InstallmentStatus) => {
  switch (status) {
    case InstallmentStatus.PAID: return 'bg-green-100 text-green-700 border-green-200';
    case InstallmentStatus.OVERDUE: return 'bg-red-100 text-red-700 border-red-200';
    case InstallmentStatus.POSTPONED: return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getStatusLabel = (status: InstallmentStatus) => {
  switch (status) {
    case InstallmentStatus.PAID: return 'تم السداد';
    case InstallmentStatus.OVERDUE: return 'متأخر';
    case InstallmentStatus.POSTPONED: return 'تم التأجيل';
    default: return 'مستحق';
  }
};
