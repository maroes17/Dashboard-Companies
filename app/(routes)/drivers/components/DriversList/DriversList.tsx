"use client";

import { useState } from "react";
import { MoreHorizontal, User, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
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
}

export function DriversList({ drivers }: DriversListProps) {
  return (
    <div className="bg-white dark:bg-background rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Licencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha de Alta</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No se encontraron choferes
              </TableCell>
            </TableRow>
          ) : (
            drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-600" />
                    </div>
                    {driver.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {driver.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {driver.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{driver.license_number}</TableCell>
                <TableCell>
                  <Badge 
                    variant={driver.status === "active" ? "success" : "destructive"}
                    className="gap-1"
                  >
                    {driver.status === "active" ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(driver.created_at).toLocaleDateString("es-CL")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Desactivar
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