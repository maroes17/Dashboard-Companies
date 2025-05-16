import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedDate: Date | null) => {
    onChange(selectedDate);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-destructive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, "dd/MM/yyyy", { locale: es })
            ) : (
              <span>Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={handleSelect}
              initialFocus
              locale={es}
              disabled={disabled}
              fromDate={new Date()} // Solo permite fechas futuras
              required={true}
              ISOWeek={false} // Esto asegura que la semana comience en lunes
              className="rounded-md border"
              classNames={{
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                nav: "flex items-center justify-between px-1 py-2 [&>button:first-child]:order-1 [&>button:last-child]:order-3 [&>div]:order-2",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "",
                nav_button_next: "",
                table: "w-full border-collapse space-y-1",
                caption: "text-sm font-medium",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
} 