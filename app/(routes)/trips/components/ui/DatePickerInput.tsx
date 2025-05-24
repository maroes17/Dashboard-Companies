import { useState, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DatePickerInputProps {
  id: string;
  label: string;
  date: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function DatePickerInput({
  id,
  label,
  date,
  onChange,
  required = false,
  error,
  disabled = false
}: DatePickerInputProps) {
  const [inputValue, setInputValue] = useState<string>("");
  
  // Actualiza el input cuando cambia la fecha
  useEffect(() => {
    if (date && isValid(date)) {
      // Formato YYYY-MM-DD para input type="date"
      setInputValue(format(date, "yyyy-MM-dd"));
    } else {
      setInputValue("");
    }
  }, [date]);
  
  // Función para manejar cambios en el input date
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value) {
      try {
        // Crear un objeto Date a partir del valor del input
        const newDate = new Date(value);
        if (isValid(newDate)) {
          onChange(newDate);
        }
      } catch (error) {
        console.error("Error al parsear la fecha:", error);
      }
    } else {
      onChange(null);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <Input
        type="date"
        id={id}
        name={id}
        value={inputValue}
        onChange={handleDateChange}
        disabled={disabled}
        className={error ? "border-destructive" : ""}
      />
      
      {error && (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
} 