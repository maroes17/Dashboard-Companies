"use client";

import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Receipt, 
  CreditCard, 
  FileText, 
  Calendar, 
  Settings, 
  HelpCircle,
  Box,
  FileCheck,
  Building2,
  AlertTriangle,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItemType, SidebarProps, SidebarSectionType } from "./Sidebar.types";

const DEFAULT_SECTIONS: SidebarSectionType[] = [
  {
    title: "General",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: Users, label: "Choferes", href: "/drivers" }
    ]
  },
  {
    title: "Vehículos",
    items: [
      { icon: Truck, label: "Flota", href: "/fleet" },
      { icon: Box, label: "Semirremolques", href: "/trailers" },
      { icon: Wrench, label: "Mantenimientos", href: "/maintenance" }
    ]
  },
  {
    title: "Documentación",
    items: [
      { icon: FileCheck, label: "Pólizas", href: "/policies" },
      { icon: Building2, label: "Clientes", href: "/clients" },
      { icon: AlertTriangle, label: "Incidentes", href: "/incidents" }
    ]
  },
  {
    title: "Finanzas",
    items: [
      { icon: Receipt, label: "Gastos", href: "/expenses" },
      { icon: CreditCard, label: "Anticipos", href: "/advances" },
      { icon: FileText, label: "Informes", href: "/reports" }
    ]
  },
  {
    title: "Planificación",
    items: [
      { icon: Calendar, label: "Viajes", href: "/trips" }
    ]
  },
  {
    title: "Configuración",
    items: [
      { icon: Settings, label: "Ajustes", href: "/settings" },
      { icon: HelpCircle, label: "Ayuda", href: "/help" }
    ]
  }
];

function SidebarItem({ icon: Icon, label, href }: SidebarItemType) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link href={href}>
      <div 
        className={cn(
          "flex items-center gap-x-3 text-slate-500 font-medium text-sm p-3 hover:text-slate-700 hover:bg-slate-300/20 rounded-lg transition-colors",
          isActive && "bg-slate-200/50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-200"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </div>
    </Link>
  );
}

export function Sidebar({ sections = DEFAULT_SECTIONS }: SidebarProps) {
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white dark:bg-background shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-bold">TransporteApp</h2>
        <p className="text-xs text-muted-foreground mt-1">Gestión de gastos y anticipos</p>
      </div>
      <div className="flex flex-col px-3 py-2">
        {sections.map((section, index) => (
          <div key={section.title} className={cn(index > 0 && "mt-6")}>
            <div className="font-medium text-xs text-muted-foreground px-4 py-2">
              {section.title}
            </div>
            {section.items.map((item) => (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto p-4 border-t">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
          <p className="text-sm font-medium">¿Necesitas ayuda?</p>
          <p className="text-xs text-muted-foreground mt-1">Consulta nuestra documentación o contacta con soporte.</p>
          <button className="mt-3 text-xs text-blue-500 font-medium hover:underline">
            Ver documentación
          </button>
        </div>
      </div>
    </div>
  );
} 