"use client";

import { useState } from "react";
import { MoreHorizontal, User, Mail, Phone, CheckCircle, XCircle, FileText, Calendar, AlertTriangle } from "lucide-react";
import { Driver } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DriversListProps {
  drivers: Driver[];
  onViewDetails: (driver: Driver) => void;
  onEditDriver: (driver: Driver) => void;
}

export function DriversList({ drivers, onViewDetails, onEditDriver }: DriversListProps) {
  // Función para formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Si no ha llegado su cumpleaños este año, restar un año
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Función para verificar si una licencia está próxima a vencer (menos de 30 días)
  const isLicenseSoonToExpire = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  // Función para verificar si una licencia está vencida
  const isLicenseExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <div className="bg-white dark:bg-background rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Licencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Ingreso</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No se encontraron choferes
              </TableCell>
            </TableRow>
          ) : (
            drivers.map((driver) => (
              <TableRow key={driver.id_chofer} className="cursor-pointer hover:bg-slate-50" onClick={() => onViewDetails(driver)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                    {driver.nombre_completo}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{driver.documento_identidad}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-muted-foreground text-xs">{driver.nacionalidad}</span>
                      {driver.fecha_nacimiento && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {calculateAge(driver.fecha_nacimiento)} años
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {driver.email || "No disponible"}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {driver.telefono || "No disponible"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium">
                      <FileText className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {driver.tipo_licencia || "No especificado"}
                    </div>
                    <div className="flex items-center text-xs">
                      <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      <span>Vence: </span>
                      {isLicenseExpired(driver.vencimiento_licencia) ? (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          {formatDate(driver.vencimiento_licencia)}
                        </Badge>
                      ) : isLicenseSoonToExpire(driver.vencimiento_licencia) ? (
                        <Badge variant="outline" className="ml-1 text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                          {formatDate(driver.vencimiento_licencia)}
                        </Badge>
                      ) : (
                        <span className="ml-1">{formatDate(driver.vencimiento_licencia)}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={driver.estado === "activo" ? "success" : "destructive"}
                    className="gap-1"
                  >
                    {driver.estado === "activo" ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Activo</span>
                      </>
                    ) : driver.estado === "suspendido" ? (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Suspendido</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(driver.fecha_ingreso)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(driver)}>
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditDriver(driver)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>Asignar vehículo</DropdownMenuItem>
                      <DropdownMenuItem>Registrar gastos</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        {driver.estado === "activo" ? "Desactivar" : "Activar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 