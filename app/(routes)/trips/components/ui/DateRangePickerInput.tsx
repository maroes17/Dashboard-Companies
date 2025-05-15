import { useState, useEffect } from "react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateRangePickerInputProps {
  id: string;
  label: string;
  dateRange: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function DateRangePickerInput({
  id,
  label,
  dateRange,
  onChange,
  required = false,
  error,
  disabled = false
}: DateRangePickerInputProps) {
  const [fromValue, setFromValue] = useState<string>("");
  const [toValue, setToValue] = useState<string>("");
  
  // Actualiza los inputs cuando cambia el rango de fechas
  useEffect(() => {
    if (dateRange?.from && isValid(dateRange.from)) {
      setFromValue(format(dateRange.from, "yyyy-MM-dd"));
    } else {
      setFromValue("");
    }
    
    if (dateRange?.to && isValid(dateRange.to)) {
      setToValue(format(dateRange.to, "yyyy-MM-dd"));
    } else {
      setToValue("");
    }
  }, [dateRange]);
  
  // Función para manejar cambios en el input desde
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromValue(value);
    
    if (value) {
      try {
        const fromDate = new Date(value);
        if (isValid(fromDate)) {
          onChange({
            from: fromDate,
            to: dateRange?.to
          });
        }
      } catch (error) {
        console.error("Error al parsear la fecha de inicio:", error);
      }
    } else {
      onChange({
        from: undefined,
        to: dateRange?.to
      });
    }
  };
  
  // Función para manejar cambios en el input hasta
  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToValue(value);
    
    if (value) {
      try {
        const toDate = new Date(value);
        if (isValid(toDate)) {
          onChange({
            from: dateRange?.from,
            to: toDate
          });
        }
      } catch (error) {
        console.error("Error al parsear la fecha de fin:", error);
      }
    } else {
      onChange({
        from: dateRange?.from,
        to: undefined
      });
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${id}-from`} className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            type="date"
            id={`${id}-from`}
            name={`${id}-from`}
            value={fromValue}
            onChange={handleFromChange}
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor={`${id}-to`} className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            type="date"
            id={`${id}-to`}
            name={`${id}-to`}
            value={toValue}
            onChange={handleToChange}
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
} 