import { Button } from "@/components/ui/button";
import { CardSummary } from "./components/CardSummary";
import { 
  UsersRound, 
  Waypoints, 
  Receipt, 
  CreditCard, 
  TruckIcon, 
  UserCheck, 
  AlertCircle
} from "lucide-react";
import { RecentExpenses } from "./components/RecentExpenses";
import { DriverActivity } from "./components/DriverActivity";
import { ExpenseByCategoryChart } from "./components/ExpenseByCategoryChart";

export const dataCardSummary = [
  {
    icon: UsersRound,
    total: "24",
    average: 5,
    title: "Choferes activos",
    tooltipText: "Número total de choferes activos",
  },
  {
    icon: TruckIcon,
    total: "12",
    average: 10,
    title: "Vehículos",
    tooltipText: "Vehículos operativos en la flota",
  },
  {
    icon: Receipt,
    total: "$1,258,450",
    average: 25,
    title: "Gastos mensuales",
    tooltipText: "Total de gastos en el último mes",
  },
  {
    icon: CreditCard,
    total: "$356,780",
    average: 15,
    title: "Anticipos",
    tooltipText: "Anticipos pendientes por liquidar",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Resumen de actividad y finanzas</p>
        </div>
        <div className="flex gap-x-2">
          <Button variant="outline">
            <AlertCircle className="mr-2 h-4 w-4" />
            Reportar problema
          </Button>
          <Button>
            <UserCheck className="mr-2 h-4 w-4" />
            Nuevo anticipo
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dataCardSummary.map(({icon, total, average, title, tooltipText}) => (
          <CardSummary
            key={title}
            icon={icon}
            total={total}
            average={average}
            title={title}
            tooltipText={tooltipText}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-background rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Gastos recientes</h3>
          <RecentExpenses />
        </div>
        <div className="bg-white dark:bg-background rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Gastos por categoría</h3>
          <ExpenseByCategoryChart />
        </div>
      </div>
      
      <div className="bg-white dark:bg-background rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Actividad de choferes</h3>
          <Button variant="outline" size="sm">Ver todos</Button>
        </div>
        <DriverActivity />
      </div>
    </div>
  );
}
