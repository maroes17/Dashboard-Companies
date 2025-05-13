"use client";

import { Receipt, Fuel, Coffee, Wrench, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseItemType, RecentExpensesProps } from "./RecentExpenses.types";

const DEFAULT_EXPENSES: ExpenseItemType[] = [
  {
    id: "1",
    driverName: "Carlos Martínez",
    driverAvatar: "/avatars/01.png",
    amount: "$45,600",
    category: "Combustible",
    icon: Fuel,
    date: "Hoy, 14:30",
    status: "Aprobado"
  },
  {
    id: "2",
    driverName: "Miguel González",
    driverAvatar: "/avatars/02.png",
    amount: "$12,350",
    category: "Mantenimiento",
    icon: Wrench,
    date: "Hoy, 11:15",
    status: "Pendiente"
  },
  {
    id: "3",
    driverName: "José Rodríguez",
    driverAvatar: "/avatars/03.png",
    amount: "$2,800",
    category: "Comida",
    icon: Coffee,
    date: "Ayer, 19:45",
    status: "Aprobado"
  },
  {
    id: "4",
    driverName: "Alejandro López",
    driverAvatar: "/avatars/04.png",
    amount: "$8,950",
    category: "Varios",
    icon: ShoppingBag,
    date: "Ayer, 09:20",
    status: "Rechazado"
  },
];

export function RecentExpenses({ expenses = DEFAULT_EXPENSES }: RecentExpensesProps) {
  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div key={expense.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <expense.icon className="h-5 w-5 text-slate-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                <div className={`w-3 h-3 rounded-full ${
                  expense.status === "Aprobado" ? "bg-green-500" : 
                  expense.status === "Rechazado" ? "bg-red-500" : "bg-amber-500"
                }`} />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm">{expense.category}</p>
              <p className="text-xs text-muted-foreground">{expense.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-medium text-sm">{expense.amount}</p>
              <p className="text-xs text-muted-foreground">{expense.driverName}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Receipt className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
} 