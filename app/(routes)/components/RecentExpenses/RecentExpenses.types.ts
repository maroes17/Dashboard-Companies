import { LucideIcon } from "lucide-react";

export type ExpenseItemType = {
  id: string;
  driverName: string;
  driverAvatar?: string;
  amount: string;
  category: string;
  icon: LucideIcon;
  date: string;
  status: 'Aprobado' | 'Pendiente' | 'Rechazado';
};

export type RecentExpensesProps = {
  expenses?: ExpenseItemType[];
}; 