
export enum InstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  POSTPONED = 'POSTPONED'
}

export interface Client {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
  createdAt: number;
}

export interface Installment {
  id: string;
  debtId: string;
  dueDate: number; // timestamp
  amount: number;
  status: InstallmentStatus;
  paidDate?: number;
  notes?: string; // Added for payment notes
}

export interface Debt {
  id: string;
  clientId: string;
  itemName: string;
  baseValue: number; // Cost of item
  profitPercentage: number;
  profitValue: number;
  totalValue: number; // base + profit
  startDate: number;
  monthCount: number;
  paymentDay: number; // Day of month (e.g., 25)
  installments: Installment[];
  isFullyPaid: boolean;
  notes?: string;
}

export type ViewState = 
  | 'DASHBOARD'
  | 'CLIENTS_LIST'
  | 'CLIENT_DETAILS'
  | 'ADD_CLIENT'
  | 'ADD_DEBT'
  | 'EDIT_DEBT'
  | 'RECORD_PAYMENT' 
  | 'SETTINGS';

export interface AppData {
  clients: Client[];
  debts: Debt[];
}
