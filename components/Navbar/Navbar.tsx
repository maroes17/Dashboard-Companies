import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, Bell, Sun, Moon, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Sidebar } from "../Sidebar";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
    return (
        <div className="flex items-center px-4 gap-x-4 md:px-6 justify-between w-full bg-background h-20 border-b">
            <div className="flex items-center gap-x-2">
                <div className="block md:hidden">
                    <Sheet>
                        <SheetTrigger className="flex items-center p-2 hover:bg-slate-100 rounded-lg">
                            <Menu className="h-5 w-5" />
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                </div>
                <h1 className="text-xl font-bold md:hidden">TransporteApp</h1>
            </div>
            <div className="relative w-[250px] md:w-[300px] hidden sm:block">
                <Input type="text" placeholder="Buscar..." className="rounded-lg" />
                <Search strokeWidth={1} className="absolute top-2 right-2 h-5 w-5 text-muted-foreground" /> 
            </div>
            <div className="flex items-center gap-x-4">
                <div className="hidden md:flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Sun className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Bell className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex items-center gap-x-2">
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </div>
    )
}
